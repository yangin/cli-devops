
const prettier = require('prettier')

/**
 * Json String to Json Object format
 */
const jsonFormat = (jsonString) => prettier.format(jsonString, { semi: false, parser: 'json' })

module.exports = {
  jsonFormat
}
