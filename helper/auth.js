/**
 * authLogin 相关
 */
const fs = require('fs')
const dayjs = require('dayjs')
const packageJson = require('../package.json')
const { writeFileSync } = require('../utils/file')
const { getUserRootPath } = require('../utils/path')
const { jsonFormat } = require('../utils/format')
const Jenkins = require('../utils/jenkins')
const Gitlab = require('../utils/gitlab')

const authConfigFilePath = `${getUserRootPath()}/.config/${packageJson.name}/auth.json`

/**
 * 检查授权是否有效
 * @param {*} server
 * @param {*} chatInfo
 * @returns {Boolean}
 */
const isValidAuth = async (server, chatInfo) => {
  let res = false
  switch (server) {
    case 'Jenkins': { res = await Jenkins.isValidAuth(chatInfo); break }
    case 'Gitlab': { res = await Gitlab.isValidAuth(chatInfo); break }
    default:break
  }
  return res
}

/**
 * 校验，并将用户的授权信息写入本地配置文件
 * @param {String} server 服务类型 Jenkins | Gitlab
 * @return {Object} 若登录成功，返回用户的授权信息，否则返回 null
 */
const authLogin = async (server, chatInfo) => {
  // 第二步：校验用户auth信息是否有效
  const isValid = await isValidAuth(server, chatInfo)
  if (!isValid) return null

  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  let authInfo = {}
  if (fs.existsSync(authConfigFilePath)) {
    const config = JSON.parse(fs.readFileSync(authConfigFilePath, 'utf-8'))
    authInfo = config
  }
  authInfo[ server ] = {
    ...chatInfo,
    lastTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  writeFileSync(authConfigFilePath, jsonFormat(JSON.stringify(authInfo)))

  return chatInfo
}

/**
 * 从本地配置文件中获取当前用户的授权信息
 * @param {String} server 服务类型 Jenkins | Gitlab
 * @return {Object} 返回用户的授权信息
 */
const getLocalAuthInfo = (server) => {
  if (!fs.existsSync(authConfigFilePath)) return null
  const config = JSON.parse(fs.readFileSync(authConfigFilePath, 'utf-8'))
  return config[ server ] || null
}

module.exports = {
  isValidAuth,
  authLogin,
  getLocalAuthInfo
}
