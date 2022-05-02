# CLI-DEVOPS

A Cli Library For Devops

## Installation

```bash
# 全局使用
npm install @yangin/cli-devops -g
# 项目中使用
npm install @yangin/cli-devops -D
```

## Usage

```bash
# 查看相关命令信息
devops --help

# 管理Jenkins
devops jenkins

# 管理Gitlab
devops gitlab

# 管理auth
devops auth

# 管理本地git
devops git
```

## Table of Contents

### Jenkins

基于Jenkins API, 管理Jenkins

* 导出所有配置信息（1个文件夹，包含一个完整配置信息的config.xml）
* 导出Git配置信息(包含git.json、no-git.json)
* 输出当前已自动化构建的项目
* 批量更新Git Branch(基于配置文件，配置文件样本会在执行失败时会自动生成)
* 基于JobName添加Git自动化构建配置(同步到Gitlab)
* 拷贝并创建一个新项目

### Gitlab

基于GitLab API，管理Gitlab

* 批量更新分支
* 导出所有仓库信息

### Auth

管理Sever登录授权（包括Jenkins、Gitlab）

```bash
# 登录auth
devops auth login
# 注销auth
devops auth logout
# 查看当前已登录auth清单
devops auth list
```

### Git

管理本地的Git操作
```bash
# 基于package.json version打tag
devops git tag
# 基于package.json version打tag并push到远程
devops git tag-push
# 删除本地与远程上的指定tag
devops git tag-delete <version>
```
