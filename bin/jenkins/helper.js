const convert = require('xml-js')
const { writeFileSync } = require('../../utils/file')
const { jsonFormat } = require('../../utils/format')
const { GIT_WEBHOOK_TRIGGERS } = require('./constant')

const isDevJob = (jobName) => jobName.startsWith('Dev-')
const isTestJob = (jobName) => jobName.startsWith('Test-')
const isProdJob = (jobName) => jobName.startsWith('Online-')

const isFrontJob = (jobName) => jobName.includes('-front-')
const isBackJob = (jobName) => jobName.includes('-back-')

/**
 * 将jobList按dev,test,prod,front,back,other进行分类
 * @param {array} jobNames job name list
 * @return {object} { devJobs: [], testJobs: [], prodJobs: [], frontJobs: [], otherJobs: [], otherJobs: [] }
 */
const classifyJobs = (jobNames) => {
  const devJobs = []
  const testJobs = []
  const prodJobs = []
  const frontJobs = []
  const backJobs = []
  const otherJobs = []

  jobNames.forEach(jobName => {
    let isIncludes = false
    if (isFrontJob(jobName)) { frontJobs.push(jobName); isIncludes = true }
    if (isBackJob(jobName)) { backJobs.push(jobName); isIncludes = true }

    if (isDevJob(jobName)) { devJobs.push(jobName); isIncludes = true }
    if (isTestJob(jobName)) { testJobs.push(jobName); isIncludes = true }
    if (isProdJob(jobName)) { prodJobs.push(jobName); isIncludes = true }

    if (!isIncludes) { otherJobs.push(jobName) }
  })

  return { devJobs, testJobs, prodJobs, frontJobs, backJobs, otherJobs }
}

/**
 * 获取配置中的Git信息
 * 包括：url, branch, repoName
 * @param {Object} configJson json格式的job配置
 * @return {Object} { gitUrl, branch, repoName }
 */
const getGitInfo = (configJson) => {
  let gitUrl = ''; let branch = ''; let repoName = ''
  try {
    gitUrl = configJson.project.scm.userRemoteConfigs[ 'hudson.plugins.git.UserRemoteConfig' ].url._text
    branch = configJson.project.scm.branches[ 'hudson.plugins.git.BranchSpec' ].name._text.replace('*/', '')
    repoName = gitUrl.split('/').pop()
      .split('.')
      .shift()
  } catch (e) {
    console.log('getGitInfo: ', e)
  }
  return { gitUrl, branch, repoName }
}

/**
 * 检查是否存在Git配置信息
 * @param {string} configXML
 * @returns  {boolean} 是否存在git配置信息
 */
const hasGitConfig = (configXML) => {
  const dataJson = JSON.parse(convert.xml2json(configXML, { compact: true, spaces: 2 }))
  const { branch, repoName } = getGitInfo(dataJson)
  return branch && repoName
}

/**
 * 检查是否有自动化构建的job配置
 * @param {*} configXML
 * @returns
 */
const hasAutoBuildConfig = (dataJson) => {
  if (!dataJson.project.triggers || !dataJson.project.triggers[ 'org.jenkinsci.plugins.gwt.GenericTrigger' ] || !dataJson.project.triggers[ 'org.jenkinsci.plugins.gwt.GenericTrigger' ].genericVariables) return false
  const { genericVariables: currentGenericVariables } = dataJson.project.triggers[ 'org.jenkinsci.plugins.gwt.GenericTrigger' ]
  const { genericVariables } = GIT_WEBHOOK_TRIGGERS[ 'org.jenkinsci.plugins.gwt.GenericTrigger' ]
  return JSON.stringify(currentGenericVariables) === JSON.stringify(genericVariables)
}

/**
 * 为job配置添加GitWebhook触发构建
 * @param {string} configXML 原来的job配置，xml格式
 * @return {string} 新的job配置，xml格式
 */
const addGitWebhookTriggers = (configXML) => {
  const dataJson = JSON.parse(convert.xml2json(configXML, { compact: true, spaces: 2 }))
  const { branch, repoName } = getGitInfo(dataJson)
  if (branch && repoName) {
    const currentFilterRegexp = `^${repoName}-(${branch}-default|default-${branch})$`
    dataJson.project.triggers = GIT_WEBHOOK_TRIGGERS
    dataJson.project.triggers[ 'org.jenkinsci.plugins.gwt.GenericTrigger' ].regexpFilterExpression._text = currentFilterRegexp
  }

  return convert.json2xml(dataJson, { compact: true, spaces: 2 })
}

/**
 * 同步最新的update-git-branch-config.sample.json文件内容
 */
const syncUpdateGitBranchConfigSample = async (jenkins, sampleFilePath) => {
  const list = await jenkins.getAllJobNameList()
  const sampleConfig = []

  const requestList = list.map(jobName => jenkins.getJobJsonConfig(jobName))
  const res = await Promise.all(requestList)
  res.forEach((config) => config.gitUrl && sampleConfig.push({ jobName: config.jobName, repoName: config.repoName, branch: config.branch, newBranch: '' }))

  writeFileSync(sampleFilePath, jsonFormat(JSON.stringify(sampleConfig)))
}

module.exports = {
  isDevJob,
  isTestJob,
  isProdJob,
  isFrontJob,
  isBackJob,
  classifyJobs,
  getGitInfo,
  hasGitConfig,
  hasAutoBuildConfig,
  addGitWebhookTriggers,
  syncUpdateGitBranchConfigSample
}
