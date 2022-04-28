const jenkinsapi = require('@yangin/jenkins-api')
const convert = require('xml-js')
const { isDevJob, isTestJob, isFrontJob, isBackJob, hasGitConfig, hasAutoBuildConfig, addGitWebhookTriggers } = require('../bin/jenkins/helper')

class Jenkins {
  constructor (jenkinsConfig) {
    this.jenkinsConfig = jenkinsConfig
    this.jenkinsUrl = `http://${jenkinsConfig.username}:${jenkinsConfig.token}@${jenkinsConfig.host}`
    this.jenkins = jenkinsapi.init(this.jenkinsUrl)
  }

  /**
   * 检查授权是否有效
   * @param {Object} authConfig
   * @returns {boolean}
   */
  static async isValidAuth (authConfig) {
    const { username, token, host } = authConfig
    if (!username || !token || !host) return (false)
    return new Promise((resolve, reject) => {
      const jenkins = jenkinsapi.init(`http://${username}:${token}@${host}`)
      jenkins.all_jobs({}, function (err, data) {
        if (err) { return resolve(false) }
        resolve(true)
      })
    })
  }

  /**
    * 获取所有job的名称
    * @returns {array} job name list
    */
  getAllJobNameList () {
    return new Promise((resolve, reject) => {
      this.jenkins.all_jobs({}, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        const jobNameList = data.map(item => item.name)
        // jobNameList.forEach(jobName => { console.log(jobName) })
        resolve(jobNameList)
      })
    })
  }

  /**
   * 根据jobName获取job的config Json格式
   * @param {string} jobName
   * @returns {object} job Git配置信息{ jobName, gitUrl, branch }
   */
  getJobJsonConfig (jobName) {
    return new Promise((resolve, reject) => {
      this.jenkins.get_config_xml(jobName, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        const env = isDevJob(jobName) ? 'dev' : isTestJob(jobName) ? 'test' : 'prod'
        const client = isFrontJob(jobName) ? 'front' : isBackJob(jobName) ? 'back' : 'other'
        const dataJson = JSON.parse(convert.xml2json(data, { compact: true, spaces: 2 }))
        try {
          const gitUrl = dataJson.project.scm.userRemoteConfigs[ 'hudson.plugins.git.UserRemoteConfig' ].url._text
          const repoName = gitUrl.split('/').pop().split('.').shift()
          const branch = dataJson.project.scm.branches[ 'hudson.plugins.git.BranchSpec' ].name._text
          const isAutoBuild = hasAutoBuildConfig(dataJson)
          resolve({ jobName, env, client, gitUrl, repoName, branch, isAutoBuild })
        } catch (e) {
          resolve({ jobName, env, client, gitUrl: '', repoName: '', branch: '', isAutoBuild: false })
        }
      })
    })
  }

  /**
   * 根据jobName获取config.xml
   */
  getJobConfig (jobName) {
    return new Promise((resolve, reject) => {
      this.jenkins.get_config_xml(jobName, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        resolve(data)
      })
    })
  }

  /**
   * 根据jobName获取job的config Json格式
   * @param {string} jobName job name
   * @param {string} branch new branch name
   */
  async updateJobGitBranch (jobName, branch) {
    const isExistJob = await this.isExistJob(jobName)
    if (!isExistJob) return { jobName, success: false, msg: 'Jenkins项目名称不存在' }
    if (!branch) return { jobName, success: false, msg: 'newBranch不存在' }
    const configXml = await this.getJobConfig(jobName)
    if (!hasGitConfig(configXml)) return { jobName, success: false, msg: 'git未配置' }

    return new Promise((resolve, reject) => {
      this.jenkins.update_config(jobName,
        (config) => {
          const dataJson = JSON.parse(convert.xml2json(config, { compact: true, spaces: 2 }))
          dataJson.project.scm.branches[ 'hudson.plugins.git.BranchSpec' ].name._text = branch
          return convert.json2xml(dataJson, { compact: true, spaces: 2 })
        },
        {},
        (err, data) => {
          if (err) { console.log(err); return reject(err) }
          resolve({ jobName, success: true, msg: '更新成功' })
        })
    })
  }

  /**
   * build job
   * @param {string} jobName job name
   */
  buildJob (jobName) {
    return new Promise((resolve, reject) => {
      this.jenkins.build(jobName, {}, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        resolve(data)
      })
    })
  }

  /**
   * 根据config.xml创建job项目
   */
  createJob (jobName, configXml) {
    return new Promise((resolve, reject) => {
      this.jenkins.create_job(jobName, configXml, {}, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        resolve(data)
      })
    })
  }

  /**
   * 更新job config.xml
   */
  updateJobConfig (jobName, configXml) {
    return new Promise((resolve, reject) => {
      this.jenkins.update_job(jobName, configXml, {}, function (err, data) {
        if (err) { console.log(err); return reject(err) }
        resolve(data)
      })
    })
  }

  /**
   * 检查jobName是否存在
   * @param {string} jobName
   * @returns {boolean} true: 存在 false: 不存在
   */
  async isExistJob (jobName) {
    try {
      await new Promise((resolve, reject) => {
        this.jenkins.get_config_xml(jobName, function (err, data) {
          if (err) { return reject(err) }
          resolve(data)
        })
      })
      return true
    } catch (e) { return false }
  }

  /**
   * 添加Git自动化构建配置
   * @param {string} jobName 项目名称
   * @return {boolean} 是否添加成功
   */
  async addGitAutoBuild (jobName) {
    // 检查是否存在git配置
    const isExistJob = await this.isExistJob(jobName)
    if (!isExistJob) return { jobName, success: false, msg: 'Jenkins项目名称不存在' }
    const configXml = await this.getJobConfig(jobName)
    if (!hasGitConfig(configXml)) return { jobName, success: false, msg: 'git未配置' }
    const autoConfigXml = addGitWebhookTriggers(configXml)
    await this.updateJobConfig(jobName, autoConfigXml)
    return { jobName, success: true, msg: '更新成功' }
  }
}

module.exports = Jenkins
