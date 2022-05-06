/**
 * 管理缓存相关的操作
 */

const fs = require('fs')
const packageJson = require('../package.json')
const { jsonFormat } = require('./format')
const { writeFileSync } = require('./file')
const { getUserRootPath } = require('./path')

const cacheFilePath = `${getUserRootPath()}/.cache/${packageJson.name}/cache.json`

/**
 * add cache
 * @param {String} key
 * @param {Object} value {packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}
 * @returns {Object}
 */
const addCache = (key, value) => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  // cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
  let cacheInfo = {}
  if (fs.existsSync(cacheFilePath)) {
    const cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'))
    cacheInfo = cache
  }

  if (!cacheInfo[ key ]) {
    cacheInfo[ key ] = [ value ]
  } else {
    cacheInfo[ key ].push(value)
  }

  writeFileSync(cacheFilePath, jsonFormat(JSON.stringify(cacheInfo)))

  return value
}

/**
 * get cache
 */
const getCache = (key) => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  // cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
  let cacheInfo = {}
  if (fs.existsSync(cacheFilePath)) {
    const cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'))
    cacheInfo = cache
  }

  if (!cacheInfo[ key ]) return null

  return cacheInfo[ key ]
}

/**
 * 更新缓存
 * @param {String} key
 * @param {String} value
 * @returns
 */
const updateCache = (key, value) => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  // cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
  let cacheInfo = {}
  if (fs.existsSync(cacheFilePath)) {
    const cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'))
    cacheInfo = cache
  }

  cacheInfo[ key ] = value

  writeFileSync(cacheFilePath, jsonFormat(JSON.stringify(cacheInfo)))
}

/**
 * remove cache
 */
const removeCache = (key) => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  // cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
  let cacheInfo = {}
  if (fs.existsSync(cacheFilePath)) {
    const cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'))
    cacheInfo = cache
  }

  if (!cacheInfo[ key ]) return null

  delete cacheInfo[ key ]

  writeFileSync(cacheFilePath, jsonFormat(JSON.stringify(cacheInfo)))

  return null
}

/**
 * clear cache
 */
const clearCache = async () => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  // cacheInfo格式：{zipNameByName: [{name: 'admin', lastTime: '2022-05-04 10:00:00'}]}
  writeFileSync(cacheFilePath, '{}')

  return null
}

module.exports = {
  cacheFilePath,
  addCache,
  getCache,
  updateCache,
  removeCache,
  clearCache
}
