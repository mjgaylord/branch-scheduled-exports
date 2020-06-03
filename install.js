const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const prompt = require('prompt')
const prompts = require('./prompts')

const templatesBucketSuffix = 'data-export-transform-templates'

module.exports.install = async function () {
  //add keys
  const result = await initialiseConfig()
  console.log(`Configured keys: ${JSON.stringify(Object.keys(result))}`)

  let awsConfig = {
    accessKeyId: result["awsAccessKeyId"],
    secretAccessKey: result["awsSecretKey"],
    region: result["region"],
    branchAppId: result["branchAppId"],
    reportTypes: result["reportTypes"]
  }

  //create AWS Secrets Manager entries for the keys
  const secretKeys = [
    "awsAccessKeyId", 
    "awsSecretKey", 
    "branchAccessToken",
    "branchKey", 
    "branchSecret"
  ]
  let secrets = {}
  Object.keys(result)
    .filter(k => secretKeys.find(p => p === k) && result[k].length > 0)
    .forEach(k => secrets[k] = result[k])

  try {
    const uploadResults = await this.uploadSecrets(secrets, result)
    console.log(`Secrets uploaded to Secrets Manager: ${JSON.stringify(uploadResults)}`)
  } catch (error) {
    console.log(JSON.stringify(error))
  }

  let userConfig = {}
  Object.keys(result)
    .filter(k => !secretKeys.find(p => p === k) && result[k].length > 0)
    .forEach(k => userConfig[k] = result[k])
  await this.saveConfig(userConfig)
}

const initialiseConfig = async () => {
  const envPath = path.join(__dirname, '.env')
  console.log(`envPath: ${envPath}`)
  try {
    const result = await this.readFile(envPath)
    
    return JSON.parse(result.toString())
  } catch (error) {
    console.log(`.env not found or invalid: ${error}`)
    console.log('Loading config from prompts:')
  }
  prompt.start()
  const result = await new Promise((resolve, reject) => {
    prompt.get(prompts.prompts(), function (err, result) {
      if (!!err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
  return result
}

module.exports.uploadSecrets = async function (secrets, config) {
  console.log(`Uploading secrets: ${JSON.stringify(secrets)}`)
  const secretsManager = new AWS.SecretsManager({
    accessKeyId: config["awsAccessKeyId"],
    secretAccessKey: config["awsSecretKey"],
    region: config["region"]
  })
  const { appName, stage, region } = config
  return Promise.all(Object.keys(secrets).map(async key => {
    const secretName = `${appName}-${stage}-${region}-${key}`
    const value = secrets[key]
    console.log(`Uploading secret: ${key}`)
    try {
      const result = await secretsManager.putSecretValue({
        SecretId: secretName,
        SecretString: value
      }).promise()
      return result
    } catch (error) {
      if (error.code !== "ResourceNotFoundException") {
        console.log(`Error updating secret: ${JSON.stringify(error)}`)
      }
    }
    return secretsManager.createSecret({
      Name: secretName,
      SecretString: value
    }).promise()
  }))
}

module.exports.saveConfig = async function (config) {
  const filePath = path.join(__dirname, 'config.json')
  console.log(`Saving ${filePath}: ${JSON.stringify(config)}`)
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(config), function (err) {
      if (!!err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

module.exports.readFile = async function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

module.exports.readDir = async function (path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, async (err, files) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}