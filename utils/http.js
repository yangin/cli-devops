const { exec } = require('child_process')
const { networkInterfaces } = require('os')

/**
 * 网络相关工具类
 */
class HttpUtils {
  /**
   * 检查指定端口是否被占用
   * @param port 端口号
   * @returns {Promise<boolean>} true: 被占用, false: 未被占用
   */
  static isExistsPort (port) {
    return new Promise((resolve) => {
      exec(`lsof -i:${port}`, (err, stdout) => {
        if (err) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  /**
   * 指定范围内获取可用的端口号
   * @param startPort 起始端口号
   * @returns {Promise<number>} 可用的端口号
   */
  static getAvailablePort (startPort) {
    const endPort = startPort + 100
    return new Promise((resolve) => {
      for (let i = startPort; i <= endPort; i++) {
        this.isExistsPort(i).then((isExists) => {
          if (!isExists) {
            resolve(i)
          }
        })
      }
    })
  }

  /**
   * 获取ip地址
   * @returns {string} ip地址
   */
  static getIPAddress () {
    const interfaces = networkInterfaces()
    for (const devName in interfaces) {
      const iface = interfaces[ devName ]
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[ i ]
        if (alias.family === 'IPv4' && alias.address !== '' && !alias.internal) {
          return alias.address
        }
      }
    }
  }
}

module.exports = HttpUtils
