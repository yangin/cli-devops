/**
 * 为Jenkins添加git push后自动构建配置
 * dataJson.project.triggers = git_webhook_triggers
 * 根据job不同修改regexpFilterExpression
 */
const GIT_WEBHOOK_TRIGGERS = {
  'org.jenkinsci.plugins.gwt.GenericTrigger': {
    '_attributes': {
      'plugin': 'generic-webhook-trigger@1.83'
    },
    'spec': {

    },
    'genericVariables': {
      'org.jenkinsci.plugins.gwt.GenericVariable': [
        {
          'expressionType': {
            '_text': 'JSONPath'
          },
          'key': {
            '_text': 'branch'
          },
          'value': {
            '_text': '$.ref'
          },
          'regexpFilter': {
            '_text': 'refs/heads/'
          },
          'defaultValue': {
            '_text': 'default'
          }
        },
        {
          'expressionType': {
            '_text': 'JSONPath'
          },
          'key': {
            '_text': 'project_name'
          },
          'value': {
            '_text': '$.project.name'
          },
          'regexpFilter': {

          },
          'defaultValue': {

          }
        },
        {
          'expressionType': {
            '_text': 'JSONPath'
          },
          'key': {
            '_text': 'merge_target_branch'
          },
          'value': {
            '_text': '$.object_attributes.target_branch'
          },
          'regexpFilter': {

          },
          'defaultValue': {
            '_text': 'default'
          }
        }
      ]
    },
    'regexpFilterText': {
      '_text': '$project_name-$branch-$merge_target_branch'
    },
    'regexpFilterExpression': {
      '_text': '^pplmc-storage-h5-(test-default|default-test)$'
    },
    'printPostContent': {
      '_text': 'false'
    },
    'printContributedVariables': {
      '_text': 'false'
    },
    'causeString': {
      '_text': 'Generic Cause'
    },
    'token': {

    },
    'tokenCredentialId': {

    },
    'silentResponse': {
      '_text': 'false'
    },
    'overrideQuietPeriod': {
      '_text': 'false'
    }
  }
}

module.exports = {
  GIT_WEBHOOK_TRIGGERS
}
