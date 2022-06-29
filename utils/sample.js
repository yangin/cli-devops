const { copyFile } = require('./file')
const { getAbsolutePath } = require('./path')

const sampleDir = getAbsolutePath('../sample')

/**
 * 获取配置文件的样本文件名
 * @param {string} fileName  ***.json
 * @return {string} ***.sample.json
 */
const sampleFileName = (fileName) => {
  const nameArr = fileName.split('.')
  return `${nameArr[ 0 ]}.sample.${nameArr[ 1 ]}`
}

/**
 * 获取sample文件的绝对路径
 * @param {String} targetFileName
 * @returns {String} sample文件的绝对路径
 */
const getSampleFilePath = (targetFileName) => `${sampleDir}/${sampleFileName(targetFileName)}`

/**
 * 导出配置文件样本
 * @param {Object} outputDir 输出文件的父级目录
 * @param {string} targetFileName 目标配置文件名， 如update-git-branch-config.json
 */
const exportSampleFile = (outputDir, targetFileName) => {
  copyFile(`${outputDir}/${sampleFileName(targetFileName)}`, `${sampleDir}/${sampleFileName(targetFileName)}`)
}
module.exports = {
  sampleFileName,
  getSampleFilePath,
  exportSampleFile
}
