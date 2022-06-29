/**
 * 管理GitLab
 * 说明：基于GitLab API，支持批量更新分支、导出所有仓库信息、添加webhook
 */
const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { success, loading, failed } = require('../../utils/loading')
const { getDesktopPath } = require('../../utils/path')
const { writeFileSync } = require('../../utils/file')
const { jsonFormat } = require('../../utils/format')
const { isExistConfigFile } = require('../../helper/sample')
const { loginGitlab } = require('../../helper/gitlab')
const Gitlab = require('../../utils/gitlab')
const { validateUpdateBranchConfig, isRepeatNewBranch } = require('./helper')

const outputDir = `${getDesktopPath()}/gitlab`

const hooksConfigFileName = 'gitlab-hooks-config.json'
const updateBranchConfigFileName = 'gitlab-update-branch-config.json'
const protectedBranchConfigFileName = 'gitlab-protected-branch-config.json'

const chat = async () => {
  const { host, username, token, operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: '请选择要执行的操作',
      choices: [
        {
          name: '1.导出项目基本信息',
          value: 'exportProjectList'
        },
        // {
        //   name: '添加Webhook',
        //   value: 'addWebhook'
        // },
        {
          name: '2.批量更新Branch',
          value: 'updateBranch'
        },
        {
          name: '3.批量设置受保护分支',
          value: 'protectedBranches'
        }
      ]
    }
  ])

  return { host, username, token, operation }
}

/**
 * 导出所有仓库的信息，仓库名，默认分支，分支列表，hooks列表
 * @param {Gitlab} gitlab实例
 */
const exportAllProjectsInfo = async (gitlab) => {
  const spinner = loading('正在导出所有仓库基础信息...')

  const projects = await gitlab.Projects.all()

  const requestList = await projects.map(async (project) => {
    // 获取hooks列表
    const hooks = await gitlab.ProjectHooks.list(project.id)
    // 获取分支列表
    const branches = await gitlab.Branches.all(project.id)

    return new Promise((resolve, reject) => {
      resolve({
        projectId: project.id,
        projectName: project.name,
        defaultBranch: project.default_branch,
        branches: branches.map(branch => branch.name),
        hooks: hooks.map(hook => hook.url)
      })
    })
  })

  const projectInfos = await Promise.all(requestList)

  writeFileSync(`${outputDir}/projects.json`, jsonFormat(JSON.stringify(projectInfos)))

  success('所有仓库基础信息导出完毕', spinner)
  console.log(`\r\n  共计${chalk.cyan(projectInfos.length)}个仓库`)
  console.log(`\r\n  请在${chalk.cyan('桌面')}查看${chalk.cyan('gitlab/projects.json')}文件夹`)
}

/**
 * 添加webhook
 */
const addWebhook = async (gitlab) => {
  // 检查配置文件是否存在
  const isExist = await isExistConfigFile(outputDir, hooksConfigFileName, async (sampleFilePath) => {
    // 更新最新的projects给配置文件
    const projects = await gitlab.Projects.all()
    const projectInfos = projects.map((project) => ({ projectId: project.id, projectName: project.name }))
    writeFileSync(sampleFilePath, jsonFormat(JSON.stringify(projectInfos)))
  })
  if (!isExist) return

  const { url } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: '请输入webhook的url'
    }
  ])

  const spinner = loading('正在添加Webhook...')

  const hookConfigList = JSON.parse(fs.readFileSync(`${outputDir}/${hooksConfigFileName}`))

  // 重复性检查
  const requestList = hookConfigList.map(async config => {
    const currentHooks = await gitlab.ProjectHooks.list(config.projectId)
    const isExist = currentHooks.some(hook => hook.url === url)
    if (!isExist) {
      return gitlab.ProjectHooks.add(config.projectId, url)
    }
  })
  await Promise.all(requestList)

  success('Webhook添加完毕', spinner)
}

/**
 * 批量更新git仓库的branch
 * TODO: 当同时更新>=3个分支时，会卡死
 */
const updateProjectBranches = async (gitlab) => {
  // 检查配置文件
  const isExist = await isExistConfigFile(outputDir, updateBranchConfigFileName, async (sampleFilePath) => {
    // 更新最新的projects给配置文件
    const projects = await gitlab.Projects.all()
    const requestList = await projects.map(async (project) => {
      // 获取分支列表
      const branches = await gitlab.Branches.all(project.id)
      return new Promise((resolve, reject) => {
        resolve({
          projectId: project.id,
          projectName: project.name,
          branches: branches.map(branch => ({ oldBranch: branch.name, newBranch: '' }))
        })
      })
    })

    const projectInfos = await Promise.all(requestList)
    writeFileSync(sampleFilePath, jsonFormat(JSON.stringify(projectInfos)))
  })
  if (!isExist) return

  // 读取配置文件
  const branchConfigList = JSON.parse(fs.readFileSync(`${outputDir}/${updateBranchConfigFileName}`))
  // 检查配置文件数据是否有效
  // 检查项目id与项目名称是否匹配，不匹配，则不更新，并报错
  // 检查原分支是否存在，不存在则不更新，并报错
  // 检查新分支是否已存在，已存在则询问是否覆盖，若不覆盖，则不更新，并报错
  const validSpinner = loading(`正在检查配置文件...`)
  const { errorList, pendingList } = await validateUpdateBranchConfig(branchConfigList, gitlab)
  if (errorList.length > 0) {
    failed('配置文件不合法，请检查配置文件', validSpinner)
    console.log('\r')
    errorList.forEach(error => { console.log(`  ${error.msg}`) })
    process.exit(1)
  }

  if (pendingList.length > 0) {
    success('配置文件检查完毕', validSpinner)
    console.log('\r')
    pendingList.forEach(pending => { console.log(`  ${pending.msg}`) })
    console.log('\r')
    const { isCover } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isCover',
        message: '新分支名部分已存在，是否覆盖？'
      }
    ])
    if (!isCover) {
      failed('操作已取消')
      process.exit(1)
    }
  }

  // 只有当配置文件的数据没问题时，才执行更新操作
  // 此处逐个更新，避免一次性更新太多，导致gitlab报错
  const update = async (project) => {
    const { projectId, projectName, branches } = project
    const spinner = loading(`正在更新${projectName}的分支...`)
    const requestList = branches.map(async branch => {
      const { oldBranch, newBranch } = branch
      if (isRepeatNewBranch(projectId, newBranch, pendingList)) {
      // newBranch已存在的情况，resetHard
        return gitlab.Branches.hardReset(projectId, newBranch, oldBranch)
      }
      // newBranch不存在的情况，直接创建
      return gitlab.Branches.create(projectId, newBranch, oldBranch)
    })
    await Promise.all(requestList)
    success(`${projectName}的分支更新完毕`, spinner)
  }

  for (let i = 0; i < branchConfigList.length; i++) {
    const project = branchConfigList[ i ]
    await update(project)
  }
}

const protectedBranches = async (gitlab) => {
  const isExist = await isExistConfigFile(outputDir, protectedBranchConfigFileName)
  if (!isExist) return

  // 读取配置文件
  const branchConfigList = JSON.parse(fs.readFileSync(`${outputDir}/${protectedBranchConfigFileName}`))
  // 只有当配置文件的数据没问题时，才执行更新操作
  // 此处逐个更新，避免一次性更新太多，导致gitlab报错
  const update = async (project) => {
    const { projectId, projectName, branches } = project
    const spinner = loading(`正在更新${projectName}的分支...`)

    for (let i = 0; i < branches.length; i++) {
      await gitlab.ProtectedBranches.protect(String(projectId), branches[ i ])
    }

    success(`${projectName}的分支更新完毕`, spinner)
  }

  for (let i = 0; i < branchConfigList.length; i++) {
    const project = branchConfigList[ i ]
    await update(project)
  }
}

const action = async () => {
  const { operation } = await chat()
  const res = await loginGitlab()
  if (!res) {
    console.log(chalk.red(`\r\n授权信息错误，登录失败`))
    return
  }
  const gitlab = new Gitlab(res)
  switch (operation) {
    case 'exportProjectList': exportAllProjectsInfo(gitlab); break
    case 'addWebhook': addWebhook(gitlab); break
    case 'updateBranch': updateProjectBranches(gitlab); break
    case 'protectedBranches': protectedBranches(gitlab); break
    default: break
  }
}

module.exports = { action }
