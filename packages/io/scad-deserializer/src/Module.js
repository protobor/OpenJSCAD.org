var _ = require('lodash')
var Context = require('./Context')
var Globals = require('./Globals')

function Module (name) {
  this.name = name
  this.children = []
  this.assignments_var = {}
  this.functions = {}
  this.modules = []
  this.argnames = []
  this.argexpr = []
};

Module.prototype.evaluate = function (parentContext, inst) {
  var lines = []

  // TODO: arguments
  if (this.name !== 'root') {
    lines.push ('\nfunction ' + this.name + '() {')
  }

  var context = new Context(parentContext)

  if (parentContext === undefined) {
    context.setVariable('$fn', Globals.DEFAULT_RESOLUTION)
    context.setVariable('$fs', 2.0)
    context.setVariable('$fa', 12.0)
  }

  if (inst !== undefined) {
    context.args(this.argnames, this.argexpr, inst.argnames, inst.argvalues)
    context.setVariable('$children', inst.children.length)
  }

  context.inst_p = inst
  context.functions_p = this.functions
  context.modules_p = this.modules

  lines.push (this.modules.map (module => module.evaluate (context)))

  if (this.name === 'root') {

    lines.push ('\nfunction main() {')
  }

  _.each(this.assignments_var, function (value, key, list) {
    context.setVariable(key, value.evaluate(context))
  })

  var controlChildren = _.filter(this.children, function (child) {
    return child && child.name == 'echo'
  })

  _.each(controlChildren, function (child, index, list) {
    child.evaluate(context)
  })

  var nonControlChildren = _.reject(this.children, function (child) {
    return !child || child.name == 'echo'
  })

  var evaluatedLines = []
  _.each(nonControlChildren, function (child, index, list) {
    var evaluatedChild = child.evaluate(context)
    if (evaluatedChild == undefined || (_.isArray(evaluatedChild) && _.isEmpty(evaluatedChild))) {
      // ignore
    } else {
      evaluatedLines.push(evaluatedChild)
    }
  })

  var cleanedLines = _.compact(evaluatedLines)
  if (cleanedLines.length == 1) {
    lines.push('\treturn ' + cleanedLines[0])
  } else if (cleanedLines.length > 1) {
    lines.push('\treturn [', context.indentList(cleanedLines), '\t]')
  }

  lines.push ('\n}\n')

  if (this.name === 'root') {
    for (const k of Object.keys(Globals.modules_to_import)) {
      lines.unshift (`const { ${Object.keys(Globals.modules_to_import[k])} } = ${k}`)
    }
    lines.unshift(`const { ${Object.keys(Globals.modules_to_import).join()} } = jscad;`)
    lines.unshift('const jscad = require(\'@jscad/modeling\') // modeling comes from the included MODELING library')
    lines.push ('module.exports = {main};')
  }

  return lines
}

module.exports = Module
