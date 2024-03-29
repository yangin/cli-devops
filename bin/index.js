#!/usr/bin/env node

const chalk = require('chalk')
const { Command } = require('commander')
const { isEmptyObject } = require('../utils/object')
const Cache = require('./cache')
const Auth = require('./auth')
const Gitlab = require('./gitlab')
const Jenkins = require('./jenkins')
const Git = require('./git')
const Local = require('./files')
const Nginx = require('./nginx')

const program = new Command()

/**
 * Gitlab、Jenkins等授权管理
 * command: devops auth
 */
program
  .command('auth')
  .description('manager cli auth, include jenkins, gitlab')
  .argument('<command>', 'login | logout | list')
  .action((command) => {
    switch (command) {
      case 'login': Auth.login(); break
      case 'logout': Auth.logout(); break
      case 'list': Auth.list(); break
      default: console.log(chalk.red('command not found')); break
    }
  })

/**
 * Jenkins管理
 * command: devops jenkins
 */
program
  .command('jenkins')
  .description('manager jenkins, include chat')
  .action(() => { Jenkins.action() })

/**
 * Gitlab管理
 * command: devops gitlab
 */
program
  .command('gitlab')
  .description('manager gitlab, include chat')
  .action(() => { Gitlab.action() })

/**
 * 本地git管理
 * command: devops git tag | tag-push
 */
program
  .command('git')
  .description('manager local git, include tag, tag-push, tag-delete')
  .argument('<command>', 'tag | tag-push | tag-delete version')
  .argument('[tag]', 'version')
  .action((command, tag) => {
    switch (command) {
      case 'tag': Git.tag(); break
      case 'tag-push': Git.tagPush(); break
      case 'tag-delete': Git.deleteTag(tag); break
      default: console.log(chalk.red('command not found')); break
    }
  })

/**
 * zip
 * command: devops zip dist | devops zip dist -d
 */
program
  .command('zip')
  .description('zip directory')
  .argument('<dir>', 'tag | tag-push | tag-delete version')
  .option('-d, --date', 'name by date')
  .option('-t, --time', 'name by time')
  .option('-n, --name', 'name by name')
  .option('-v, --version', 'name by version')
  .action((dir, options) => {
    const type = (!options || isEmptyObject(options)) ? undefined : Object.keys(options)[ 0 ]
    Local.zip(dir, type)
  })

/**
 * cache
 */
program
  .command('cache')
  .description('manager cache')
  .argument('<command>', 'clear')
  .action((action) => {
    if (action === 'clear') Cache.clear()
  })

/**
 * nginx
 * command: devops nginx -c ./nginx.conf -l logo
 */
program
  .command('nginx')
  .description('manager nginx')
  .option('-c, --config <char>', 'config file path')
  .option('-l, --logo <char>', 'show logo string')
  .action((options) => {
    const { config, logo } = options
    Nginx.start(config, logo)
  })

program.parse()
