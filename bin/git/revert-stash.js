const { exec } = require('child_process')

/**
 * 筛选出所有的dangling commit的id, 排除dangling blob
 * @returns [ "67337de1dd301d2c", "61661f0cb82e47b7f882", ...]
 */
function qryStashIds () {
  return new Promise((resolve, reject) => {
    exec('git fsck --lost-found', { encoding: 'utf8' }, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      // 筛选出dangling commit的id
      let matches = stdout.match(/commit\s+([^\s\r\n]+)/g)
      if (matches) {
        matches = matches.map(m => m.replace(/commit\s+/, ''))
        resolve(matches)
      }
    })
  })
}

/**
 *
 * @param {*} date
 * @param {*} id
 * @returns
 */
function taskGenertor (startDate, endDate, id) {
  return new Promise((resolve) => {
    exec(`git show ${id}`, { encoding: 'utf8' }, (err, log) => {
      if (err) {
        return resolve()
      }
      // 经过观察每个log都会带有下面这种日期标识，我们只要根据 传入的日期，筛选出符合的即可
      // Author: bighamD <******2@qq.com>
      // Date:   Sun Sep 19 16:26:29 2021 +0800
      const match = log.match(/Date:\s+([^+\r\n]+)/)
      if (match) {
        const stashDate = match[ 1 ].trim()
        // 说明这个记录是符合
        if (new Date(stashDate) > startDate && new Date(stashDate) < endDate) {
          resolve(id)
        }
      }
      resolve()
    })
  })
}

async function matchRevertStashId (startDate, endDate) {
  const stashIds = await qryStashIds()
  return (await Promise.all(stashIds.map(id => taskGenertor(startDate, endDate, id)))).filter(Boolean)
}

// 比如我是2022-9-19执行了stash save操作
async function runMain () {
  const match = await matchRevertStashId(new Date('2022-9-20'), new Date('2022-9-24'))
  console.log(match)
}

runMain()
