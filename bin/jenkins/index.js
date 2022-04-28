/**
 * 管理Jenkins
 * 基于Jenkins API, 具体可执行操作包括：
 * 导出所有配置信息（1个文件夹，包含一个完整配置信息的config.xml）
 * 项目分类统计（1个文件夹，包含一个项目分类统计的json文件）
 * 导出Git配置信息(将依赖git部署的job放到一个文件内，将其他的job放到另一个文件内)
 * 输出当前已自动化构建的项目
 * 批量更新Git Branch
 * 基于JobName添加Git自动化构建配置(同步到Gitlab)
 * 拷贝并创建一个新项目
 */

const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { success, loading, failed } = require('../../utils/loading')
const { getDesktopPath } = require('../../utils/path')
const { writeFileSync } = require('../../utils/file')
const { jsonFormat } = require('../../utils/format')
const { isExistConfigFile } = require('../../helper/sample')
const { loginJenkins, getJenkinsWebhook } = require('../../helper/jenkins')
const { loginGitlab } = require('../../helper/gitlab')
const Jenkins = require('../../utils/jenkins')
const Gitlab = require('../../utils/gitlab')
const { classifyJobs, syncUpdateGitBranchConfigSample } = require('./helper')

const jenkinsOutputDir = `${getDesktopPath()}/jenkins`
const jenkinsGitOutputDir = `${jenkinsOutputDir}/git`
const jenkinsConfigOutputDir = `${jenkinsOutputDir}/config`

const updateGitBranchConfigFileName = 'update-git-branch-config.json'

const chat = async () => {
  const { host, username, token, operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: '请选择要执行的操作',
      choices: [
        {
          name: '1.导出所有配置信息',
          value: 'exportAllConfig'
        },
        // {
        //   name: '项目分类统计',
        //   value: 'classifyExportJob'
        // },
        {
          name: '2.基于GitLab项目清单',
          value: 'exportGitConfig'
        },
        {
          name: '3.已自动化构建项目清单',
          value: 'showAutoBuildJob'
        },
        {
          name: '4.批量更新GitBranch',
          value: 'updateGitBranch'
        },
        {
          name: '5.添加Gitlab自动化构建',
          value: 'addGitAutoBuildWithGitlab'
        },
        {
          name: '6.拷贝项目',
          value: 'copyJob'
        }
      ]
    }
  ])

  return { host, username, token, operation }
}

/**
 * 将Jenkins中的所有job配置导出到桌面
 * @param {Jenkins} jenkins
 */
const exportAllConfig = async (jenkins) => {
  const list = await jenkins.getAllJobNameList()
  const spinner = loading('正在导出Jenkins所有项目配置...')
  list.forEach(async jobName => {
    const config = await jenkins.getJobConfig(jobName)
    try { writeFileSync(`${jenkinsConfigOutputDir}/xml-config/${jobName}/config.xml`, config) } catch (e) { console.log(e) }
  })
  success('Jenkins所有项目配置导出完毕', spinner)
  console.log(`\r\n  请在${chalk.cyan('桌面')}查看${chalk.cyan('jenkins/config/xml-config')}文件夹`)
}

/**
 * 项目分类统计
 * 分类：backend、frontend、other, dev、test、prod， all
 */
const classifyExportJob = async (jenkins) => {
  const spinner = loading('正在导出项目清单...')

  const outputDir = `${jenkinsConfigOutputDir}/job-list`
  const allList = await jenkins.getAllJobNameList()
  const { devJobs, testJobs, prodJobs, frontJobs, backJobs, otherJobs } = classifyJobs(allList)
  writeFileSync(`${outputDir}/all.json`, JSON.stringify(allList))
  writeFileSync(`${outputDir}/dev.json`, JSON.stringify(devJobs))
  writeFileSync(`${outputDir}/test.json`, JSON.stringify(testJobs))
  writeFileSync(`${outputDir}/prod.json`, JSON.stringify(prodJobs))
  writeFileSync(`${outputDir}/frontend.json`, JSON.stringify(frontJobs))
  writeFileSync(`${outputDir}/backend.json`, JSON.stringify(backJobs))
  writeFileSync(`${outputDir}/other.json`, JSON.stringify(otherJobs))

  success('项目清单导出完毕', spinner)
  console.log(`\r\n  请在${chalk.cyan('桌面')}查看${chalk.cyan('jenkins/config/job-list')}文件夹`)
}

/**
 * 导出Jenkins中git配置信息
 * 包括git-config.json 与 no-git-config.json
 * @param {Jenkins} jenkins
 */
const exportGitConfig = async (jenkins) => {
  const list = await jenkins.getAllJobNameList()
  const spinner = loading('正在导出Jenkins所有项目的Git配置信息...')

  let gitConfigList = []
  let noGitConfigList = []

  const requestList = list.map(jobName => jenkins.getJobJsonConfig(jobName))
  const res = await Promise.all(requestList)
  res.forEach(({ jobName, env, client, gitUrl, branch }) => { gitUrl ? gitConfigList.push({ jobName, env, client, gitUrl, branch }) : noGitConfigList.push({ jobName, env, client }) })

  try {
    writeFileSync(`${jenkinsGitOutputDir}/git-config.json`, jsonFormat(JSON.stringify(gitConfigList)))
    writeFileSync(`${jenkinsGitOutputDir}/no-git-config.json`, jsonFormat(JSON.stringify(noGitConfigList)))
  } catch (e) { console.log(e) }
  success('Jenkins所有项目Git配置导出完毕', spinner)
  console.log(`\r\n  请在${chalk.cyan('桌面')}查看${chalk.cyan('jenkins/git')}文件夹`)
}

/**
 * 查看当前已配置自动化构建的Job
 * 此处自动化构建指gitlab与jenkins的自动化构建都配置好了
 */
const showAutoBuildJob = async (jenkins) => {
  const spinner = loading('正在获取已配置自动化构建项目清单...')
  const loginRes = await loginGitlab()
  if (!loginRes) {
    failed('信息获取失败', spinner)
    console.log(chalk.red(`\r\n Gitlab授权信息错误，登录失败`))
    return
  }

  // 获取所有配置了自动化构建的Job信息{jobName, gitUrl, repoName, branch}
  const autoBuildList = []
  const allJobs = await jenkins.getAllJobNameList()
  const requestList = allJobs.map(jobName => jenkins.getJobJsonConfig(jobName))
  const res = await Promise.all(requestList)
  res.forEach((config) => config.gitUrl && config.isAutoBuild && autoBuildList.push(config))
  // 根据gitlab的gitUrl去查找其hooks
  const gitlab = new Gitlab(loginRes)
  const webhook = await getJenkinsWebhook()

  let githooks = []
  for (let i = 0; i < autoBuildList.length; i++) {
    const job = autoBuildList[ i ]
    const hooks = await gitlab.ProjectHooks.list(job.gitUrl)
    if (hooks.length > 0 && hooks.some(hook => hook.url === webhook)) {
      githooks.push(job.jobName)
    }
  }

  success(`已配置自动化构建项目清单获取完毕`, spinner)
  console.log(`\r`)
  githooks.forEach(jobName => console.log(` ${jobName}`))
}

/**
 * 根据配置文件来更新job的git branch
 * 配置文件名为：updateGitBranchConfigFileName
 */
const updateGitBranch = async (jenkins) => {
  // 检查配置文件是否存在
  const isExist = await isExistConfigFile(jenkinsGitOutputDir, updateGitBranchConfigFileName, (sampleFilePath) => syncUpdateGitBranchConfigSample(jenkins, sampleFilePath))
  if (!isExist) return

  const spinner = loading('正在更新Jenkins的Git Branch...')

  const gitConfigList = JSON.parse(fs.readFileSync(`${jenkinsGitOutputDir}/${updateGitBranchConfigFileName}`))
  const requestList = gitConfigList.map(config => jenkins.updateJobGitBranch(config.jobName, config.newBranch))
  const resList = await Promise.all(requestList)

  success('Jenkins的Git Branch更新完毕', spinner)

  resList.forEach(res => {
    !res.success && console.log(`\r\n  ${res.jobName} 更新失败，${res.msg}`)
  })
}

/**
 * 添加Git Push|Merge 后自动化构建配置
 * TODO: 改为不走配置文件，直接输入，空格分隔，支持多个job，自动配置Gitlab
 * @param {Jenkins} jenkins
 */
const addAutoBuildWithGitlab = async (jenkins) => {
  // 获取要添加自动化配置的Jenkins Job清单
  const { jobs } = await inquirer.prompt([
    {
      type: 'input',
      name: 'jobs',
      message: '请输入要添加的Jenkins项目名称'
    }
  ])
  if (!jobs) { console.log(`\r\n  ${chalk.red('请输入要添加的Jenkins项目名称')}`); return }
  const jobList = jobs.split(' ')

  // 配置Jenkins中的自动化配置
  const spinner = loading('正在配置Jenkins的自动化构建配置...')
  const requestList = jobList.map(jobName => jenkins.addGitAutoBuild(jobName))
  const jenkinsResList = await Promise.all(requestList)
  success('Jenkins的自动化构建配置添加完毕', spinner)

  jenkinsResList.forEach(res => {
    !res.success && console.log(`\r\n  ${res.jobName} 更新失败，${res.msg}`)
  })

  // 配置Gitlab中的自动化配置
  const loginRes = await loginGitlab()
  if (!loginRes) {
    console.log(chalk.red(`\r\nGitlab授权信息错误，登录失败`))
    return
  }
  const gitlab = new Gitlab(loginRes)

  const gitlabSpinner = loading('正在为Gitlab项目添加Webhook...')
  // 根据jobList获取gitUrl
  const requestJobConfigList = jobList.map(jobName => jenkins.getJobJsonConfig(jobName))
  const jobConfigResList = await Promise.all(requestJobConfigList)
  const gitUrlList = jobConfigResList.map(res => res.gitUrl)
  // 根据gitUrl获取gitlabProjectId
  const requestGitProjectIdList = gitUrlList.map(gitUrl => gitlab.Projects.getProjectIdByUrl(gitUrl))
  const gitProjectIdResList = await Promise.all(requestGitProjectIdList)
  // 根据gitlabProjectId添加Webhook
  const webhook = await getJenkinsWebhook()
  const requestHookList = gitProjectIdResList.map(async projectId => {
    const currentHooks = await gitlab.ProjectHooks.list(projectId)
    const isExist = currentHooks.some(hook => hook.url === webhook)
    if (!isExist) {
      return gitlab.ProjectHooks.add(projectId, webhook)
    }
  })
  await Promise.all(requestHookList)

  success('Gitlab项目Webhook添加完毕', gitlabSpinner)
}

/**
 * 复制并创建一个新项目
 */
const copyJob = async (jenkins) => {
  const { copyJobName, newJobName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'copyJobName',
      message: '请输入复制的项目'
    },
    {
      type: 'input',
      name: 'newJobName',
      message: '请输入新项目名称'
    }
  ])

  const spinner = loading(`正在复制项目${copyJobName}...`)
  const config = await jenkins.getJobConfig(copyJobName)
  await jenkins.createJob(newJobName, config)
  success(`新项目${newJobName}创建完毕`, spinner)
}

const action = async () => {
  const { operation } = await chat()
  const res = await loginJenkins()
  if (!res) {
    console.log(chalk.red(`\r\n授权信息错误，登录失败`))
    return
  }
  const jenkins = new Jenkins(res)
  switch (operation) {
    case 'exportAllConfig': exportAllConfig(jenkins); break
    case 'exportGitConfig': exportGitConfig(jenkins); break
    case 'updateGitBranch': updateGitBranch(jenkins); break
    case 'addGitAutoBuildWithGitlab': addAutoBuildWithGitlab(jenkins); break
    case 'classifyExportJob': classifyExportJob(jenkins); break
    case 'showAutoBuildJob': showAutoBuildJob(jenkins); break
    case 'copyJob': copyJob(jenkins); break
    default: break
  }
}

module.exports = { action }
