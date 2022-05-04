/**
 * 根据package.json version 打tag
 */

const chalk = require('chalk')
const { failed } = require('../../utils/loading')
const { getPackageJsonPath } = require('../../utils/path')
const { GitTag } = require('../../utils/git')

/**
 * 添加版本号 git tag <version>
 * @returns {String} 版本号
 */
const addTag = async () => {
  const packagePath = getPackageJsonPath()
  const { version } = require(packagePath)
  const tags = await GitTag.tagList()

  if (tags.includes(version)) {
    failed(`tag ${version} already exists`)

    console.log(`\r\n 请更新版本号，或者删除已有的tag`)

    console.log(`\r\n ${chalk.green('git tag -d <version>')}`)

    return
  }

  try {
    await GitTag.addTag(version)
  } catch (e) {
    console.log(chalk.red(e))
    return
  }

  return version
}

module.exports = {
  addTag
}
