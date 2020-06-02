import { DynamoDB } from 'aws-sdk'
import {
  File,
  DownloadDatabaseItem,
  ExportRequest,
  ExportRequestDatabaseItem,
  ExportRequestStatus
} from '../model/Models'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// @ts-ignore
import dotenv from 'dotenv'
import { exportRequestStatusToString, exportRequestStatusFromValue } from '../functions/Functions'
import { batchUploadTableName, exportsTableName, exportRequestStatusTableName } from '../utils/Config'
import moment from 'moment'

export class Database {
  dynamoDb: DocumentClient
  downloadTable = exportsTableName
  batchUploadTable = batchUploadTableName
  exportRequestStatusTable = exportRequestStatusTableName

  constructor() {
    AWS.config.update({ region: process.env.REGION })
    dotenv.config()
    // if we're running offline we need to specify the endpoint as localhost
    const endpoint = process.env.OFFLINE ? { endpoint: 'http://localhost:8000' } : {}
    this.dynamoDb = new DynamoDB.DocumentClient({
      region: process.env.REGION,
      ...endpoint
    })
  }

  saveFiles(files: File[]): Promise<void[]> {
    console.info(`Saving ${files.length} to database`)
    return Promise.all(
      files.map(file => {
        return this.saveFile(file)
      })
    )
  }

  async saveFile(file: File): Promise<void> {
    const { downloadTable, dynamoDb } = this
    const result = await dynamoDb
      .put({
        TableName: downloadTable,
        Item: fileToItem(file)
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)} for file: ${JSON.stringify(file)}`)
  }

  async listDownloads(): Promise<File[]> {
    const { downloadTable, dynamoDb } = this
    const data = await dynamoDb
      .scan({
        TableName: downloadTable,
        FilterExpression: 'downloaded = :l',
        ExpressionAttributeValues: {
          ':l': '0'
        }
      })
      .promise()
    if (!data.Items) {
      return []
    }
    return data.Items.map(
      (item): File => {
        return itemToFile(item)
      }
    )
  }

  async downloadCompleted(path: string): Promise<void[]> {
    const files = await this.listFilesByDownloadPath(path)
    files.forEach(file => (file.downloaded = true))
    return this.saveFiles(files)
  }

  async listFilesByDownloadPath(path: string): Promise<File[]> {
    return this.listFilesByFilterExpression('downloadPath = :l', path)
  }

  // private async listFilesByFilename(filename: string): Promise<File[]> {
  //   return this.listFilesByFilterExpression('contains(downloadPath, :l)', filename)
  // }

  private async listFilesByFilterExpression(expression: string, param: string): Promise<File[]> {
    const { downloadTable, dynamoDb } = this
    const data = await dynamoDb.scan(
        {
          TableName: downloadTable,
          FilterExpression: expression,
          ExpressionAttributeValues: {
            ':l': param
          }
        }
    ).promise()
    if (!data.Items) {
        return []
    }
    return data.Items.map(item => {
        return itemToFile(item)
      })
  }

  async saveExportRequest(request: ExportRequest): Promise<void> {
    const { exportRequestStatusTable, dynamoDb } = this
    const item = exportRequestToItem(request)
    const result = await dynamoDb
      .put({
        TableName: exportRequestStatusTable,
        Item: item
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)}`)
  }

  async listUnsuccessfulExportRequests(): Promise<ExportRequest[]> {
    const { exportRequestStatusTable, dynamoDb } = this
    var param = {
      TableName: exportRequestStatusTable,
      FilterExpression: "#request_status = :failed OR #request_status = :empty",
      ExpressionAttributeValues: {
        ":failed": exportRequestStatusToString(ExportRequestStatus.Failed),
        ":empty": exportRequestStatusToString(ExportRequestStatus.Empty),
      },
      ExpressionAttributeNames: {
        "#request_status": "status"
      }
    };
    const data = await dynamoDb
      .scan(param)
      .promise()
    if (!data.Items) {
      return []
    }
    return Promise.all(
      data.Items.map(item => {
        return itemToExportRequest(item)
      })
    )
  }
}

export function itemToFile(item: any): File {  
  return {
    downloaded: item.downloaded === '1' ? true : false,
    downloadPath: item.downloadPath as string,
    pathAvailable: true, // TODO: Change for custom exports...
    batchCount: Number.isInteger(item.batchCount) ? parseInt(item.batchCount) : undefined,
    eventCount: Number.isInteger(item.eventCount) ? parseInt(item.eventCount) : undefined
  }
}

export function fileToItem(file: File): DownloadDatabaseItem {
  return {
    downloaded: `${file.downloaded ? '1' : '0'}`,
    downloadPath: `${file.downloadPath}`,
    pathAvailable: `${file.pathAvailable ? '1' : '0'}`,
  }
}

export function exportRequestToItem(request: ExportRequest): ExportRequestDatabaseItem {
  const { dateRequested, status } = request
  const dateString = moment(dateRequested).format('YYYY-MM-DD')
  return {
    dateRequested: dateString,
    status: exportRequestStatusToString(status)
  }
}

export function itemToExportRequest(item: any): ExportRequest {
  const { dateRequested, status } = item
  return {
    dateRequested: moment(dateRequested, 'YYYY-MM-DD').toDate(),
    status: exportRequestStatusFromValue(status)
  }
}

