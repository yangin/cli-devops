const path = require('path')
const os = require('os')
/**
 * 获取绝对路径
 * @param {string} targetPath 目标路径
 * @returns
 */
const getAbsolutePath = (targetPath) => {
  return targetPath.startsWith('/') ? targetPath : path.resolve(__dirname, targetPath)
}

/**
 * 获取桌面路径
 */
const getDesktopPath = () => {
  return `${os.homedir()}/Desktop`
}

/**
 * 获取用户根目录
 */
const getUserRootPath = () => {
  return `${os.homedir()}`
}

module.exports = {
  getAbsolutePath,
  getDesktopPath,
  getUserRootPath
}
