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

export const exportsTableName = process.env.DOWNLOADS_TABLE
export const batchUploadTableName = process.env.BATCH_UPLOAD_TABLE
export const exportRequestStatusTableName = process.env.EXPORT_REQUEST_TABLE
export const customExportRequestStatusTableName = process.env.CUSTOM_EXPORT_REQUEST_TABLE
export const mostRecentCustomRequestTableName = process.env.MOST_RECENT_REQUEST_TABLE
export const branchAppId = process.env.BRANCH_APP_ID

export const reportTypes = function(): string[] {
  return process.env.REPORT_TYPES.split(',').map(s => s.trim()).filter(s => s.length > 0)
}

export function includeOrganic(): Boolean {
  const value = process.env.INCLUDE_ORGANIC
  return (value === 'true')
}
