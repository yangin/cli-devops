/**
 * 管理缓存
 */
const path = require('path')
const { exec } = require('child_process') // child_process负责执行shell
const chalk = require('chalk')
const figlet = require('figlet')

const Nginx = require('../../utils/nginx')
const HttpUtils = require('../../utils/http')
const { getProcessDir } = require('../../utils/path')
const { loading, success, failed } = require('../../utils/loading')

/**
 * 启动nginx server
 * @param {string} configPath
 */
const start = async (configPath, logo) => {
  const nginxConfFile = path.resolve(getProcessDir(), configPath)
  const hasExistNginx = await Nginx.isExist()
  if (!hasExistNginx) {
    console.log(chalk.red('Nginx is not installed, please install it first'))
    return
  }

  const spinner = loading('start nginx ...')

  await exec(`killall nginx`)

  exec(`nginx -c ${nginxConfFile}`, async (error, stdout, stderr) => {
    if (error) {
      console.log(`\r\n${stderr}`)
      failed('nginx start failed', spinner)
      return
    }

    success('nginx start success', spinner)

    // 使用 figlet 绘制 Logo
    logo && console.log(`\r\n${figlet.textSync(logo)}`)

    const ip = HttpUtils.getIPAddress()
    const port = await Nginx.getProxyPort(nginxConfFile) // nginx的启动端口

    console.log(`
    \r\n App running at:
    \r\n -Local:     http://localhost:${chalk.cyan(port)}
    \r\n -Network:   http://${ip}:${chalk.cyan(port)}
    \r\n Happy hacking!`)
  })
}

module.exports = {
  start
}
