/**
 * 管理缓存
 */
const chalk = require('chalk')
const { success } = require('../../utils/loading')
const { clearCache, cacheFilePath } = require('../../utils/cache')

const clear = () => {
  clearCache()
  success('缓存清理完毕')
  console.log(`\r\n  ${chalk.cyan('cat')} ${cacheFilePath}`)
}

module.exports = {
  clear
}
