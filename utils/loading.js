const ora = require('ora')

const success = (text, spinner) => {
  spinner ? spinner.succeed(text) : ora(text).succeed()
}

const failed = (text, spinner) => {
  spinner ? spinner.fail(text) : ora(text).fail()
}

const loading = (text) => {
  const spinner = ora(text).start()
  return spinner
}

module.exports = {
  success,
  failed,
  loading
}
