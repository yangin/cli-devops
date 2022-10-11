/**
 * nginx配置修改工具类：https://github.com/tmont/nginx-conf
 */
const { exec } = require('child_process')
const { NginxConfFile } = require('nginx-conf')
/**
 * nginx相关操作
 */
class Nginx {
  constructor () {
    this.conf = null
  }

  /**
   * 初始化nginx配置文件
   * @param {string} configPath 配置文件路径
   * @param {object} conf 配置文件内容
   * @example
   * const conf = await nginx.init('/usr/local/etc/nginx/nginx.conf')
   */
  static init (configPath) {
    return new Promise((resolve) => {
      if (!configPath) {
        console.log('请先初始化nginx配置文件')
        resolve(null)
      }

      if (this.conf) resolve(this.conf)

      NginxConfFile.create(configPath, function (err, conf) {
        if (err || !conf) {
          console.log(err)
          resolve(null)
        }
        resolve(conf)
      })
    })
  }

  /**
   * 检查nginx是否安装
   */
  static isExist () {
    return new Promise((resolve) => {
      exec('nginx -v', (error, stdout, stderr) => {
        if (error) {
          resolve(false)
          return
        }
        resolve(true)
      })
    })
  }

  /**
   * 清理所有nginx
   */
  static async clear () {
    await exec(`killall nginx`)
  }

  /**
   * 启动nginx
   */
  static async start (configPath) {
    await exec(`nginx -c ${configPath}`)
  }

  /**
   * 重启nginx
   */
  static async reload () {
    await exec('nginx -s reload')
  }

  /**
   * 获取配置文件中nginx代理的端口
   */
  static async getProxyPort (configPath) {
    const config = await this.init(configPath)
    if (!config) return
    const http = config.nginx.http
    const listen = http[ 0 ].server[ 0 ].listen[ 0 ].toString().split(' ')[ 1 ].replace(';', '')
    return listen
  }
}

module.exports = Nginx
