/**
 * 管理本cli涉及到的所有账号，域名，token
 * 包括Jenkins、Gitlab等
 * 通过将账号信息写入到配置文件中，可以方便的管理
 * 配置文件地址：.config/@yangjin/cli/auth.json, 其中@yangjin/cli为包名
 * 具体包括login、logout、list
 */

const fs = require('fs')
const chalk = require('chalk')
const inquirer = require('inquirer')
const { getUserRootPath } = require('../../utils/path')
const { writeFileSync } = require('../../utils/file')
const { jsonFormat } = require('../../utils/format')
const packageJson = require('../../package.json')
const { authLogin } = require('../../helper/auth')
const { jenkinsChat } = require('../../helper/jenkins')
const { gitlabChat } = require('../../helper/gitlab')

const authConfigFilePath = `${getUserRootPath()}/.config/${packageJson.name}/auth.json`

/**
 * 登录操作
 */
const login = async () => {
  const { server } = await inquirer.prompt([
    {
      type: 'list',
      name: 'server',
      message: '请选择要登录的服务',
      choices: ['Jenkins', 'Gitlab']
    }
  ])

  let chatInfo = {}
  // 不同的server对应不同的chat
  switch (server) {
    case 'Jenkins': chatInfo = await jenkinsChat(); break
    case 'Gitlab': chatInfo = await gitlabChat(); break
    default: break
  }

  const res = await authLogin(server, chatInfo)
  if (!res) {
    console.log(chalk.red(`\r\n${server}授权信息错误，登录失败`))
    return
  }
  console.log(chalk.green(`\r\n${server}登录成功`))
}

/**
 * 退出登录
 * 从配置文件中根据server移除对应的账号信息
 */
const logout = async () => {
  // 检查当前是否存在auth文件
  if (!fs.existsSync(authConfigFilePath)) {
    console.log(chalk.red(`\r\n当前没有登录的账号信息，无需退出`))
    return
  }

  const jsonData = JSON.parse(fs.readFileSync(authConfigFilePath, 'utf-8'))
  const serverList = Object.keys(jsonData)
  if (serverList.length === 0) {
    console.log(chalk.red(`\r\n当前没有登录的账号信息，无需退出`))
    return
  }

  const { server } = await inquirer.prompt([
    {
      type: 'list',
      name: 'server',
      message: '请选择要退出的服务',
      choices: serverList
    }
  ])

  // 删除对应的账号信息
  delete jsonData[ server ]
  // 写入文件
  writeFileSync(authConfigFilePath, jsonFormat(JSON.stringify(jsonData)))
  console.log(chalk.green(`\r\n${server}退出登录成功`))
}

/**
 * 查看登录的账号信息
 */
const list = async () => {
  // 检查当前是否存在auth文件
  if (!fs.existsSync(authConfigFilePath)) {
    console.log(chalk.red(`\r\n当前没有登录的账号信息，无需查看`))
    return
  }

  const jsonData = JSON.parse(fs.readFileSync(authConfigFilePath, 'utf-8'))
  console.log('\r')
  console.log(jsonData)
}

module.exports = {
  login,
  logout,
  list
}
