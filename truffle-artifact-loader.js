const loaderUtils = require('loader-utils')

module.exports = function (source) {
    this.cacheable && this.cacheable()
    let value = typeof source === 'string' ? JSON.parse(source) : source
    const options = loaderUtils.getOptions(this)
    let excludedKeys = options.exclude
    if (excludedKeys != null) {
        excludedKeys = excludedKeys.split(',')
        for (let key of excludedKeys) {
            delete value[key]
        }
    }
    return value
}
