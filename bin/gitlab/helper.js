/**
 * 检查update-branch配置文件数据是否有效
 * 检查项目id与项目名称是否匹配，不匹配，则不更新，并报错
 * 检查原分支是否存在，不存在则不更新，并报错
 * 检查新分支是否已存在，已存在则询问是否覆盖，若不覆盖，则不更新，并报错
 * @param {Object} config 配置文件
 * @param {Gitlab} gitlab
 * @return {Object} { errorList, pendingList }
 */
const validateUpdateBranchConfig = async (configList, gitlab) => {
  const requestList = configList.map(async config => {
    let projectInfo = {}
    const { projectId, projectName, branches } = config
    // 第一步：检查项目id是否存在，项目id与项目名称是否匹配
    try {
      const res = await gitlab.Projects.show(projectId)
      if (res.name !== projectName) {
        projectInfo = { projectId, success: false, msg: `项目 ${projectName} 与projectId:${projectId} 不匹配` }
      } else {
        projectInfo = { projectId, success: true, defaultBranch: res.default_branch }
      }
    } catch (e) {
      projectInfo = { projectId, success: false, msg: `项目 ${projectName} projectId:${projectId} 不存在, 或没有权限` }
    }

    // 第二步：检查原分支是否存在, 检查新分支是否已存在, 检查新分支是数据是否有效
    if (projectInfo.success) {
      const repeatOldBranch = []
      const repeatNewBranch = []
      const invalidNewBranch = []
      const emptyNewBranch = []

      const currentBranches = await gitlab.Branches.all(projectId)
      const branchNames = currentBranches.map(branch => branch.name)

      branches.forEach(({ oldBranch, newBranch }) => {
        !branchNames.includes(oldBranch) && repeatOldBranch.push(oldBranch)
        branchNames.includes(newBranch) && repeatNewBranch.push(newBranch)
        !newBranch.trim() && emptyNewBranch.push(newBranch)
        !/^[a-zA-Z0-9_-]+$/.test(newBranch) && invalidNewBranch.push(newBranch)
      })

      if (repeatOldBranch.length > 0) { projectInfo = { projectId, success: false, msg: `项目 ${projectName} 原分支 ${repeatOldBranch.join(',')} 不存在` } }
      if (repeatNewBranch.length > 0) { projectInfo = { projectId, success: true, branches: repeatNewBranch, msg: `项目 ${projectName} 新分支 ${repeatNewBranch.join(',')} 已存在` } }
      if (invalidNewBranch.length > 0) { projectInfo = { projectId, success: false, msg: `项目 ${projectName} 新分支名 ${repeatNewBranch.join(',')} 无效` } }
      if (emptyNewBranch.length > 0) { projectInfo = { projectId, success: false, msg: `项目 ${projectName} 存在为空的newBranch` } }
    }

    return new Promise((resolve, reject) => {
      resolve(projectInfo)
    })
  })

  const responseList = await Promise.all(requestList)
  const errorList = responseList.filter(res => !res.success)
  // 新分支名已存在时，需要覆盖提醒
  const pendingList = responseList.filter(res => res.success && !!res.msg)

  return { errorList, pendingList }
}

/**
 * newBranch是否已存在
 * @return {Boolean}
 */
const isRepeatNewBranch = (projectId, newBranch, pendingList) => pendingList.some(pending => pending.projectId === projectId && pending.branches.includes(newBranch))

module.exports = {
  validateUpdateBranchConfig,
  isRepeatNewBranch
}
