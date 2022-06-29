const fs = require('fs')
const path = require('path')
const { getAbsolutePath } = require('./path')

/**
 * 检查文件是否在指定目录下
 * @param {string} filePath 文件路径
 * @param {string} dirPath 目录路径
 * @returns {boolean}
 */
const isExistFileInDir = (fileName, dir) => fs.existsSync(`${dir}/${fileName}`)

/**
 * 获取指定json文件中的json数据
 */
const getJsonInFile = (jsonPath) => {
  const json = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(json)
}

/**
 * 创建一个文件夹，当上级目录不存在时，自动创建
 * 当前fs.mkdir只能基于上一层目录存在的情况下创建，否则报错
 * @params {string} dirPath 文件夹路径
 */
const mkdir = (dirPath) => {
  const dirArr = getAbsolutePath(dirPath).split('/')
    .slice(1)
  dirArr.forEach(async (dir, index) => {
    const currentDir = `/${dirArr.slice(0, index + 1).join('/')}`
    if (!fs.existsSync(currentDir)) {
      fs.mkdirSync(currentDir)
    }
  })
}

/**
 * 将内容写入到文件中，当文件不存在时，创建该文件
 * fs.writeFileSync 的问题是，当文件的上级目录不存在时，则会报错
 * 此方法会当上级目录不存在时，依次创建上级目录
 * @param {string} filePath 文件路径
 */
const writeFileSync = (filePath, content, option = { flag: 'w+' }) => {
  const parentDirPath = path.dirname(filePath)
  !fs.existsSync(parentDirPath) && mkdir(parentDirPath)
  fs.writeFileSync(filePath, content, option)
}

/**
 * 将内容写入到文件中，当文件不存在时，创建该文件
 * fs.writeFileSync 的问题是，当文件的上级目录不存在时，则会报错
 * 此方法会当上级目录不存在时，依次创建上级目录
 * 与writeFileSync不同的是，此方法写入时将流定位到文件末尾
 * @param {string} filePath 文件路径
 */
const appendFileSync = (filePath, content, option = { flag: 'a' }) => {
  const parentDirPath = path.dirname(filePath)
  !fs.existsSync(parentDirPath) && mkdir(parentDirPath)
  fs.writeFileSync(filePath, content, option)
}

const writeFile = async (filePath, content, option = { flag: 'w+' }, callback) => {
  if (typeof option === 'function' && !callback) { callback = option }

  const parentDirPath = path.dirname(filePath)
  !fs.existsSync(parentDirPath) && mkdir(parentDirPath)

  await fs.writeFile(filePath, content, option, (err, data) => callback(err, data))
}

/**
 * 将targetPath的文件内容复制到outputPath中
 * @param {string} outputPath 输出文件地址
 * @param {string} targetPath 目标文件地址
 */
const copyFile = (outputPath, targetPath) => {
  writeFileSync(outputPath, fs.readFileSync(targetPath))
}

module.exports = {
  isExistFileInDir,
  getJsonInFile,
  mkdir,
  writeFileSync,
  appendFileSync,
  writeFile,
  copyFile
}
