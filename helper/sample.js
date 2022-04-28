const chalk = require('chalk')

const { isExistFileInDir } = require('../utils/file')
const { getDesktopPath } = require('../utils/path')
const { sampleFileName, exportSampleFile, getSampleFilePath } = require('../utils/sample')
const { failed } = require('../utils/loading')

/**
 * 语义化提示信息
 */
const semanticTips = (tip) => {
  // 将桌面路径转换为桌面文字
  const desktopPath = getDesktopPath()
  return tip.replace(desktopPath, '桌面')
}

/**
 * 检查配置文件是否存在
 * 不存在时，导出配置文件样本
 * @param {String} fileName 文件名
 * @param {String} dirPath 目录路径
 * @param {Function} callback 执行导出文件前的回调函数，用来实时更新sample文件
 * @returns {Boolean} 是否存在
 */
async function isExistConfigFile (dirPath, fileName, callback) {
  // 检查配置文件是否存在
  const isExist = isExistFileInDir(fileName, dirPath)
  if (!isExist) {
    // 导出配置文件样本

    if (typeof callback === 'function') { await callback(getSampleFilePath(fileName)) }
    exportSampleFile(dirPath, fileName)

    failed(`配置文件${chalk.cyan(semanticTips(dirPath + '/' + fileName))}不存在, 请配置好后再执行`)
    console.log(`\r\n  请参考${chalk.cyan(semanticTips(dirPath + '/' + sampleFileName(fileName)))}文件内容格式`)
    return false
  }
  return true
}

module.exports = {
  isExistConfigFile
}
