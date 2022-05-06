/**
 * Object相关方法
 */
const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0
}

module.exports = {
  isEmptyObject
}
