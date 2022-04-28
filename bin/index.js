#!/usr/bin/env node

const chalk = require('chalk')
const { Command } = require('commander')
const Auth = require('./auth')
const Gitlab = require('./gitlab')
const Jenkins = require('./jenkins')

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

program.parse()
