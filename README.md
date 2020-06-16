
# Overview

This software makes scheduled requests to the Branch Custom Export API or Daily Export API and downloads raw log level data to S3.

Please open a PR or report any issues on Github.

# Features
  - Simple interactive CLI setup
  - Low cost - runs on Lambda, DynamoDB and S3
  - Automatic retry
  - Securely stores all API keys in AWS Secrets Manager

Note: Custom Exports API functionality supports files up to 2 000 000 rows, if you need to support more rows, please increase the request frequency

# Setup

Before starting ensure that you have access to the [Branch Data Feeds](https://docs.branch.io/exports/data-feeds-overview/) product

Install Homebrew

Run `brew install node`

Install serverless `npm -g install serverless`
Install typescript `npm install -g typescript`

Then run `npm install` from the root folder to install dependencies

Test by running `serverless --help`

Note: You may need to install Docker for deployment to work if you have not installed it already. The simplest is to install Docker Desktop: https://docs.docker.com/install/

Run `npm run install` to configure your serverless environment (note you may need to add your AWS Access Key ID and Secret to the package.json setup script)

If you want to use the Daily Exports API and not the Custom Exports API, please ensure that you have enabled the *Daily Export API* on the Branch dashboard
![Daily Exports](docs/dailyExports.png)

If you want to avoid the prompts you can create a `.env` file in the root of your project and add the following:

```
{
  "appName": // your app name - this needs to be unique,
  "stage": // either dev, stg or prd,
  "region": // AWS region e.g. us-east-1,
  "awsAccessKeyId": // AWS key id used to create buckets and upload files,
  "awsSecretKey": // AWS secret key,
  /* Required for Daily Exports API */
  "branchKey": // Branch key off of the Branch dashboard https://branch.dashboard.branch.io/account-settings
  "branchSecret": // Branch secret off of the Branch dashboard https://branch.dashboard.branch.io/account-settings

  /* Required for Custom Exports API */
  "branchAccessToken" : // Your Branch account access token https://branch.dashboard.branch.io/account-settings/user
  "branchAppId": // Your Branch App ID https://branch.dashboard.branch.io/account-settings/profile

  /* You can limit the reports you would like to request by changing editing this list */
  "reportTypes": "eo_user_lifecycle_event,eo_reinstall,eo_content_event,eo_open,eo_web_session_start,eo_click,eo_custom_event,eo_commerce_event,eo_install"
}
```

# AWS Setup

If you don't already have an AWS account visit: https://aws.amazon.com to create one.

Next create an IAM User with programmatic access and the following policy permissions:

- SecretsManagerReadWrite
- AWSLambdaFullAccess
- AmazonDynamoDBFullAccess
- AmazonAPIGatewayAdministrator
- AWSCodeDeployRoleForLambda
- AWSDeepRacerCloudFormationAccessPolicy
- IAMFullAccess

Save the AWS key and secret for later use

Install the AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

*Note:* if you already have the AWS CLI installed make sure the credentials in the `~/.aws/credentials` file match the use you just created above.

# Deployment & Updating

Run `npm run update`

## Changing the Custom Export API request schedule

You can change this schedule either by updating the CloudWatch Events Log or changing the `serverless.yaml` handler `startCustom`. Note that there is a limitation of 2 000 000 rows per request with the Custom Export API, so longer schedules need to take this into account

All setup at this point should be complete.
