
/**
 * Gitlab 工具类
 * 拓展一个 Branches 的 hard reset 功能
 */

const { Gitlab: Client } = require('@gitbeaker/node')

class Gitlab extends Client {
  // eslint-disable-next-line no-useless-constructor
  constructor (props) {
    super(props)
    this.host = props.host
    this.token = props.token
    this.Branches.hardReset = this.hardReset.bind(this)
    this.Projects.updateDefaultBranch = this.updateProjectDefaultBranch.bind(this)
    this.Projects.getProjectIdByUrl = this.getProjectIdByUrl.bind(this)
    this.ProjectHooks.list = this.projectHooksList.bind(this) // 通过bind绑定this，将this传入到方法中
  }

  /**
   * 检查授权是否有效
   * @param {Object} authConfig
   * @returns {boolean}
   */
  static async isValidAuth (authConfig) {
    try {
      const client = new Client({ host: authConfig.host, token: authConfig.token })
      await client.Users.current()
      return true
    } catch (e) {
      return false
    }
  }

  async updateProjectDefaultBranch (projectId, defaultBranch) {
    await this.Projects.edit(projectId, { 'default_branch': defaultBranch })
    return true
  }

  /**
   * 对分支执行 reset --hard 命令
   * 实际过程是 remove branch --> create branch
   * @param {Number} projectId
   * @param {String} newBranchName
   * @param {String} oldBranchName
   */
  async hardReset (projectId, newBranchName, oldBranchName) {
    // 检查newBranchName是否为默认分支，如果是，则将其转移走
    try {
      const projectInfo = await this.Projects.show(projectId)
      const defaultBranch = projectInfo.default_branch

      if (defaultBranch === newBranchName) {
        this.Projects.updateDefaultBranch(projectId, oldBranchName)
      }

      // 删除之前的分支
      await this.Branches.remove(projectId, newBranchName)

      // 创建新分支
      const newBranchInfo = await this.Branches.create(projectId, newBranchName, oldBranchName)

      if (defaultBranch === newBranchName) {
        this.Projects.updateDefaultBranch(projectId, newBranchName)
      }
      return new Promise((resolve, reject) => {
        resolve(newBranchInfo)
      })
    } catch (e) {
      return new Promise((resolve, reject) => {
        reject(e)
      })
    }
  }

  async getProjectIdByUrl (Url) {
    try {
      const projects = await this.Projects.all()
      const project = projects.find(item => item.http_url_to_repo === Url)
      return project ? project.id : null
    } catch (e) {
      return null
    }
  }

  /**
   * 对 ProjectHooks.all 进行封装，使返回的数据结构更加简洁稳定
   * @param {String | Number} projectId 项目id | 项目Url
   * @returns {Array} hooks列表
   */
  async projectHooksList (projectId) {
    try {
      const id = parseInt(projectId)
      if (isNaN(id)) {
        projectId = await this.Projects.getProjectIdByUrl(projectId)
      }

      const hooks = await this.ProjectHooks.all(projectId)
      return hooks
    } catch (e) {
      return []
    }
  }
}

module.exports = Gitlab
