const inquirer = require('inquirer')
const { getLocalAuthInfo, authLogin } = require('./auth')

/**
 * Jenkins chat,并获取用户输入的信息
 */
const jenkinsChat = async () => {
  let { host, username, token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: '请输入要登录的服务域名'
    },
    {
      type: 'input',
      name: 'username',
      message: '请输入要登录的用户名'
    },
    {
      type: 'input',
      name: 'token',
      message: '请输入要登录的token'
    }
  ])

  if (/^http/.test(host)) host = host.replace(/http(s)?:\/\//, '')

  return { host, username, token }
}

/**
 * 登录Jenkins
 * @return {Object} 若登录成功，返回用户的授权信息，否则返回 null
 */
const loginJenkins = async () => {
  // 先从本地获取用户信息
  let authInfo = getLocalAuthInfo('Jenkins')
  // 如果信息不存在，则从用户输入获取
  if (!authInfo) {
    authInfo = await jenkinsChat()
  }
  const res = await authLogin('Jenkins', authInfo)
  return res
}

/**
 * 获取Jenkins的Git Webhook
 * @return {String} Webhook url
 */
const getJenkinsWebhook = async () => {
  // 先从本地获取用户信息
  const authInfo = await getLocalAuthInfo('Jenkins')
  const { host, username, token } = authInfo
  return `http://${username}:${token}@${host}/generic-webhook-trigger/invoke`
}

module.exports = {
  jenkinsChat,
  loginJenkins,
  getJenkinsWebhook
}
