/**
 * Git 辅助命令
 * tag 读取package.json文件版本号，并打版本
 * tag-push， 打版本，并push到远程
 */

const chalk = require('chalk')
const { success, loading } = require('../../utils/loading')
const { GitTag, GitAction } = require('../../utils/git')
const { addTag } = require('./helper')

const tag = async () => {
  const res = await addTag()
  if(!res) return 
  success(`${chalk.cyan('版本号')}: ${chalk.green(res)}`)
}

const tagPush = async () => {

  const res = await addTag()
  if(!res) return 

  const spinner = loading('正在Pushing...')

  await GitTag.pushTag(res)

  success(`${chalk.cyan('版本号')}: ${chalk.green(res)}`, spinner)
}

/**
 * 删除本地与远程的tag
 */
const deleteTag = async (tag) => {
  const spinner = loading('正在打Tag与Pushing...')
  await GitTag.deleteTag(tag)
  await GitAction.deleteRemoteBranchOrTag(tag)
  success(`成功删除本地与远程的tag: ${chalk.green(tag)}`, spinner)
}

module.exports = {
  tag,
  tagPush,
  deleteTag
}
