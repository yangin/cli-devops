const { execSync } = require('child_process')
const { isExistFileInDir } = require('./file')
/**
 * 检测当前是否在git仓库中
 * @return {boolean} [是否在git仓库中]
 */
const isInGitDir = () => {
  const gitDir = process.cwd()
  return isExistFileInDir('.git', gitDir)
}

/**
 * 检查是否有未提交的修改
 * @return {array|string} 排除检查的文件名或集合
 * @return {boolean}
 */
const isEditing = (excludes) => {
  if (!excludes) {
    const stdout = execSync('git status').toString()
    return !stdout.includes('nothing to commit, working tree clean')
  }

  const stdout = execSync(`git status --porcelain`).toString()
  const files = stdout.split('\n').filter(file => file.trim())

  if (typeof excludes === 'string') {
    // 当前修改目录下只有一条记录，且为指定排除内容，则说明没有修改
    if (files.length === 1 && files[ 0 ].endsWith(excludes)) return false
    return true
  }

  if (Array.isArray(excludes)) {
    if (excludes.length < files.length) return true
    // 检查files中的文件是否都是excludes中的文件
    const isExists = files.every(file => excludes.some(exclude => file.endsWith(exclude)))
    return !isExists
  }

  return false
}

/**
 * 筛选出localBranches 和 remoteBranches
 * @return {Object} {localBranches: ['master', 'dev'], remoteBranches: ['master', 'dev']}
 */
const getBranches = () => {
  const localBranches = []
  const remoteBranches = []

  const stdout = execSync('git branch --all').toString()
  const branches = stdout.split('\n')

  branches.forEach(branch => {
    if (!branch) return
    if (branch.includes('remotes/origin/')) {
      if (branch.includes('remotes/origin/HEAD')) return
      remoteBranches.push(branch.replace('remotes/origin/', '').trim())
    } else {
      localBranches.push(branch.replace('*', '').trim())
    }
  })

  return { localBranches, remoteBranches }
}

/**
 * 获取当前branch
 * @return {string} [当前branch]
 */
const getCurrentBranch = () => {
  const stdout = execSync('git branch --show-current').toString()
  return stdout
}

/**
 * fetch git仓库
 */
const fetchGit = async () => {
  execSync('git fetch')
}

/**
 * push git仓库
 * @param {array} branch 要push的分支数组集合，如['master', 'dev']
 */
const pushBranches = async (branches) => {
  execSync(`git push origin ${branches.join(' ')}`)
}

/**
 * git push --force
 * @param {array} branch 要push的分支数组集合，如['master', 'dev']
 */
const pushBranchesForce = async (branches) => {
  execSync(`git push origin ${branches.join(' ')} -f`)
}

/**
 * 切换到指定的分支
 */
const switchBranch = async (branch) => {
  execSync(`git checkout ${branch}`).toString()
}

/**
 * 基于当前分支创建新分支
 * @param {string} branch 新分支名称
 */
const createBranch = async (branch) => {
  execSync(`git checkout -b ${branch}`).toString()
}

/**
 * 基于当前分支覆盖创建新分支
 * @param {string} branch 新分支名称
 */
const coverCreateBranch = async (branch) => {
  execSync(`git checkout -B ${branch}`).toString()
}

/**
 * 基于目标分支创建新分支
 * @param {string} newBranch 新分支名称
 * @param {string} targetBranch 目标分支名称
 */
const createBranchByTarget = async (targetBranch, newBranch) => {
  execSync(`git branch ${newBranch} ${targetBranch}`)
}

/**
 * 基于目标分支覆盖创建新分支
 * @param {string} newBranch 新分支名称
 * @param {string} targetBranch 目标分支名称
 */
const coverCreateBranchByTarget = async (targetBranch, newBranch) => {
  execSync(`git branch ${newBranch} ${targetBranch} -f`)
}

/**
 * 覆盖当前分支
 * @param {string} branch 用来覆盖的分支
 */
const coverBranch = async (branch) => {
  execSync(`git reset ${branch} --hard`).toString()
}

/**
 * stash
 */
const stash = async () => {
  execSync('git add . && git stash')
}

/**
 * stash pop
 */
const stashPop = async () => {
  execSync('git stash pop')
}

module.exports = {
  GitCheck: {
    isInGitDir,
    isEditing
  },
  GitGet: {
    getBranches,
    getCurrentBranch
  },
  GitAction: {
    fetchGit,
    pushBranches,
    pushBranchesForce,
    switchBranch,
    createBranch,
    coverCreateBranch,
    createBranchByTarget,
    coverCreateBranchByTarget,
    coverBranch,
    stash,
    stashPop
  }
}
