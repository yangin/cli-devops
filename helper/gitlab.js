const inquirer = require('inquirer')
const { getLocalAuthInfo, authLogin } = require('./auth')

/**
 * Gitlab chat,并获取用户输入的信息
 */
const gitlabChat = async () => {
  let { host, token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: '请输入要登录的服务域名'
    },
    {
      type: 'input',
      name: 'token',
      message: '请输入要登录的token'
    }
  ])

  if (!/^http/.test(host)) host = `http://${host}`

  return { host, token }
}

/**
 * 登录Gitlab
 * @return {Object} 若登录成功，返回用户的授权信息，否则返回 null
 */
const loginGitlab = async () => {
  // 先从本地获取用户信息
  let authInfo = getLocalAuthInfo('Gitlab')
  // 如果信息不存在，则从用户输入获取
  if (!authInfo) {
    authInfo = await gitlabChat()
  }
  const res = await authLogin('Gitlab', authInfo)
  return res
}

module.exports = {
  gitlabChat,
  loginGitlab
}
