var _ = require('lodash')

var singleLineModuleRegex = /(module\s*\w*\([^\)]*\)[\w\n]*)([^{};]*);/gm
var singleLineModuleReplacement = '$1 {$2;};'
var multiLineCommentRegex = /((?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:\/\/.*))/gm

function stripString (s) {
  if (/^\".*\"$/.test(s)) {
    return s.match(/^\"(.*)\"$/)[1]
  } else {
    return s
  }
}

function convertForStrFunction (val) {
  if (_.isString(val)) {
    return stripString(val)
  }

  if (_.isArray(val)) {
    var mapped = _.map(val, function (value, key, list) {
      return convertForStrFunction(value)
    })

    return '[' + mapped.join(',') + ']'
  }

  return val
}

function preParse (text) {
  return text
    .replace(multiLineCommentRegex, '')
    .replace(singleLineModuleRegex, singleLineModuleReplacement)
}

const modules_to_import = {}

/**
 * Cache used modules and function names to generate imports
 * @param {string} moduleName module name to import from @jscad/modeling
 * @param  {...string} fnNames function names to import from module
 */
function addJscadImport (moduleName, ...fnNames) {
  modules_to_import[moduleName] = modules_to_import[moduleName] || {}
  for (const fnName of fnNames) {
    modules_to_import[moduleName][fnName] = 1
  }
}

module.exports =  {
  DEFAULT_RESOLUTION: 16,
  DEFAULT_2D_RESOLUTION: 16,
  FN_DEFAULT: 0,
  FS_DEFAULT: 2.0,
  FA_DEFAULT: 12.0,
  module_stack: [],
  context_stack: [],
  modules_to_import,
  addJscadImport,
  stripString,
  convertForStrFunction,
  preParse,
  importedObjectRegex: /import\([^\"]*\"([^\)]*)\"[,]?.*\);?/gm,
  usedLibraryRegex: /use <([^>]*)>;?/gm,
  includedLibraryRegex: /include <([^>]*)>;?/gm
}
