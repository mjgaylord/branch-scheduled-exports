import * as AWS from 'aws-sdk'

export const s3 = new AWS.S3({
  region: process.env.REGION
})

export const lambda = new AWS.Lambda({
  region: process.env.REGION
});

export const secretsManager = new AWS.SecretsManager({
  region: process.env.REGION
})

export const templatesBucket = process.env.TEMPLATES_BUCKET
export const reportReceivers = process.env.EMAIL_RECEIVERS
export const reportSender = process.env.EMAIL_SENDER
export const exportsTableName = process.env.DOWNLOADS_TABLE
export const batchUploadTableName = process.env.BATCH_UPLOAD_TABLE
export const exportRequestStatusTableName = process.env.EXPORT_REQUEST_TABLE

export function includeOrganic(): Boolean {
  const value = process.env.INCLUDE_ORGANIC
  return (value === 'true')
}
