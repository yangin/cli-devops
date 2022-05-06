
const dayjs = require('dayjs')
const { getPackageJsonPath } = require('../../utils/path')
const { addCache, getCache, updateCache } = require('../../utils/cache')

/**
 * 获取包名中的版本号，即最后一个数字，如admin_1中的1
 * @param {String} name
 * @returns {Number} version
 */
const getVersion = (name) => {
  const idx = name.lastIndexOf('_') || 0
  return parseInt(name.substring(idx + 1))
}

/**
 * 根据time获取zipName
 * @param {String} name 包名称
 * @returns {String} zipName admin_20220504100000
 */
const getZipNameByTime = (name) => {
  return `${name}_${dayjs().format('YYYYMMDDHHmmss')}`
}

/**
 * 根据包名与version获取zipName
 * @param {String} name
 * @param {String} version
 * @returns {String} zipName admin_1_0_0
 */
const getZipNameByVersion = (name, version) => {
  return `${name}_${version.replace('.', '_')}`
}

/**
 * 根据包名获取zipName
 * @param {String} name
 * @returns {String} zipName admin_1
 */
const getZipNameByName = (name) => {
  const firstName = `${name}_1`
  const zipNameCache = getCache('zipName')
  if (!zipNameCache) return firstName
  // 删除当日之前的type=date数据
  const validData = zipNameCache.filter(item => !(dayjs(item.lastTime).isBefore(dayjs(), 'day') && item.type === 'name'))
  updateCache('zipName', validData)
  // 获取type=date的当日数据
  const nameData = validData.filter(item => item.type === 'name')
  if (nameData.length === 0) return firstName
  // 获取type=day的当日数据中最大的版本号
  const maxVersion = nameData.reduce((pre, cur) => {
    const curVersion = getVersion(cur.zipName)
    return pre > curVersion ? pre : curVersion
  }, 0)
  return `${name}_${maxVersion + 1}`
}

/**
 * 根据包名及日期获取zipName
 * @param {String} name 包名
 * @returns {String} zipName admin_20220505_1
 */
const getZipNameByDate = (name) => {
  const firstName = `${name}_${dayjs().format('YYYYMMDD')}_1`
  const zipNameCache = getCache('zipName')
  if (!zipNameCache) return firstName
  // 删除当日之前的type=date数据
  const validData = zipNameCache.filter(item => !(dayjs(item.lastTime).isBefore(dayjs(), 'day') && item.type === 'date'))
  updateCache('zipName', validData)
  // 获取type=date的当日数据
  const dateData = validData.filter(item => item.type === 'date')
  if (dateData.length === 0) return firstName
  // 获取type=day的当日数据中最大的版本号
  const maxVersion = dateData.reduce((pre, cur) => {
    const curVersion = getVersion(cur.zipName)
    return pre > curVersion ? pre : curVersion
  }, 0)
  return `${name}_${dayjs().format('YYYYMMDD')}_${maxVersion + 1}`
}

/**
 * get zip name from cache
 * @param {String} type 命名方式 name | day | version | time
 */
const getZipName = (type) => {
  // 读取当前的配置文件，将新的账号信息写入到配置文件中
  //  cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
  const { version, name } = require(getPackageJsonPath())
  if (type === 'time') return getZipNameByTime(name)
  if (type === 'version') return getZipNameByVersion(name, version)
  if (type === 'name') return getZipNameByName(name)
  if (type === 'date') return getZipNameByDate(name)
}

/**
 * add zipName cache
 * @param {String} zipName 压缩包名
 * @param {String} type 命名方式 name | day
 * cacheInfo格式：{zipName: [{packageName: 'admin', zipName: 'admin_1', type: 'name', lastTime: '2022-05-04 10:00:00'}]}
 */
const addZipNameCache = (zipName, type) => {
  const { name: packageName } = require(getPackageJsonPath())
  addCache('zipName', { packageName, zipName, type, lastTime: dayjs().format('YYYY-MM-DD HH:mm:ss') })
}

module.exports = {
  getZipName,
  addZipNameCache
}
