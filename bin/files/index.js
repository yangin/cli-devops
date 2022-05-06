/**
 * 管理本地文件
 * zip压缩文件
 */

const fs = require('fs')
const { execSync } = require('child_process')
const chalk = require('chalk')
const { success, loading } = require('../../utils/loading')
const { getProcessDir } = require('../../utils/path')
const { getZipName, addZipNameCache } = require('./helper')
/**
 * 将本地的dist文件夹压缩成.zip文件
 * 文件名：包名_时间.zip，如：test_20180808.zip
 * @param {String} dir 打包的目录文件夹
 * @param {String} type 压缩文件名命名方式 time: YYYY-MM-DD HH:mm:ss， date: YYYY-MM-DD， name: 包名, version: 版本号
 * @returns {String} path 压缩文件所在的目录路径
*/
const zip = (dir, type = 'time') => {
  const spinner = loading(`正在压缩...`)

  const targetDir = getProcessDir()
  const newZipName = `${getZipName(type)}.zip`
  addZipNameCache(newZipName, type)

  // 如果当前文件名已存在，则重新打包
  if (fs.existsSync(`${targetDir}/${newZipName}`)) {
    zip(dir, type)
    return
  }

  execSync(`zip -r ${newZipName} ${dir}`)
  success(`文件夹${chalk.cyan(dir)}压缩完毕`, spinner)
  console.log(`\r\n  ${chalk.green(newZipName)}`)

  return targetDir
}

module.exports = {
  zip
}
