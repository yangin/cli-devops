const path = require('path')
const os = require('os')
/**
 * 获取绝对路径
 * @param {string} targetPath 目标路径
 * @returns
 */
const getAbsolutePath = (targetPath) => targetPath.startsWith('/') ? targetPath : path.resolve(__dirname, targetPath)

/**
 * 获取进程当前执行的目录
 */
const getProcessDir = () => process.cwd()

/**
 * 获取桌面路径
 */
const getDesktopPath = () => `${os.homedir()}/Desktop`

/**
 * 获取安装项目的package.json文件路径
 * @returns {string}
 */
const getPackageJsonPath = () => `${getProcessDir()}/package.json`

/**
 * 获取用户根目录
 */
const getUserRootPath = () => `${os.homedir()}`

module.exports = {
  getProcessDir,
  getAbsolutePath,
  getDesktopPath,
  getUserRootPath,
  getPackageJsonPath
}
