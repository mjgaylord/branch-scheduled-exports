import { DynamoDB } from 'aws-sdk'
import {
  File,
  DownloadDatabaseItem,
  ExportRequest,
  ExportRequestDatabaseItem,
  ExportRequestStatus,
  CustomExportRequest,
  CustomExportRequestStatus,
  CustomExportRequestDataItem,
} from '../model/Models'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// @ts-ignore
import dotenv from 'dotenv'
import {
  exportRequestStatusToString,
  exportRequestStatusFromValue,
  customExportRequestStatusToString,
  customExportRequestStatusFromValue,
} from '../functions/Functions'
import {
  batchUploadTableName,
  exportsTableName,
  exportRequestStatusTableName,
  customExportRequestStatusTableName,
} from '../utils/Config'
import moment from 'moment'

export class Database {
  dynamoDb: DocumentClient
  downloadTable = exportsTableName
  batchUploadTable = batchUploadTableName
  exportRequestStatusTable = exportRequestStatusTableName
  customExportRequestStatusTable = customExportRequestStatusTableName

  constructor() {
    AWS.config.update({ region: process.env.REGION })
    dotenv.config()
    // if we're running offline we need to specify the endpoint as localhost
    const endpoint = process.env.OFFLINE ? { endpoint: 'http://localhost:8000' } : {}
    this.dynamoDb = new DynamoDB.DocumentClient({
      region: process.env.REGION,
      ...endpoint,
    })
  }

  saveFiles(files: File[]): Promise<void[]> {
    console.info(`Saving ${files.length} to database`)
    return Promise.all(
      files.map((file) => {
        return this.saveFile(file)
      })
    )
  }

  async saveFile(file: File): Promise<void> {
    const { downloadTable, dynamoDb } = this
    const result = await dynamoDb
      .put({
        TableName: downloadTable,
        Item: fileToItem(file),
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
          ':l': '0',
        },
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
    files.forEach((file) => (file.downloaded = true))
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
    const data = await dynamoDb
      .scan({
        TableName: downloadTable,
        FilterExpression: expression,
        ExpressionAttributeValues: {
          ':l': param,
        },
      })
      .promise()
    if (!data.Items) {
      return []
    }
    return data.Items.map((item) => {
      return itemToFile(item)
    })
  }

  async saveExportRequest(request: ExportRequest): Promise<void> {
    const { exportRequestStatusTable, dynamoDb } = this
    const item = exportRequestToItem(request)
    const result = await dynamoDb
      .put({
        TableName: exportRequestStatusTable,
        Item: item,
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)}`)
  }

  async saveCustomExportRequest(request: CustomExportRequest): Promise<void> {
    const { exportRequestStatusTable, dynamoDb } = this
    const item = customExportRequestToItem(request)
    const result = await dynamoDb
      .put({
        TableName: exportRequestStatusTable,
        Item: item,
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)}`)
  }

  async listUnsuccessfulCustomExportRequests(): Promise<CustomExportRequest[]> {
    const { customExportRequestStatusTable } = this
    const param = {
      TableName: customExportRequestStatusTable,
      FilterExpression: 'request_status = :failed OR #request_status = :none OR #request_status = :pending OR #request_status = :running',
      ExpressionAttributeValues: {
        ':failed': customExportRequestStatusToString(CustomExportRequestStatus.Failed),
        ':pending': customExportRequestStatusToString(CustomExportRequestStatus.Pending),
        ':none': customExportRequestStatusToString(CustomExportRequestStatus.None),
        ':running': customExportRequestStatusToString(CustomExportRequestStatus.Running),
      },
      ExpressionAttributeNames: {
        '#request_status': 'status',
      },
    }
    return this.list<CustomExportRequest>(param, itemToCustomExportRequest)
  }

  async mostRecentCustomExportRequest(reportType: string): Promise<CustomExportRequest | undefined> {
    const param = {
      TableName: this.customExportRequestStatusTable,
      KeyConditionExpression: 'endDate < :endDate AND reportType = :reportType',
      ExpressionAttributeValues: {
        ':endDate': moment().subtract(10, 'days').toDate().getTime(),
        ':reportType': reportType,
      },
      ScanIndexForward: false,
      ConsistentRead: false,
      Limit: 1
    }
    const exports = await this.list<CustomExportRequest>(param, itemToCustomExportRequest)[0]
    return exports.length > 0 ? exports[0] : undefined
  }

  async listUnsuccessfulExportRequests(): Promise<ExportRequest[]> {
    const { exportRequestStatusTable } = this
    const param = {
      TableName: exportRequestStatusTable,
      FilterExpression: '#request_status = :failed OR #request_status = :empty',
      ExpressionAttributeValues: {
        ':failed': exportRequestStatusToString(ExportRequestStatus.Failed),
        ':empty': exportRequestStatusToString(ExportRequestStatus.Empty),
      },
      ExpressionAttributeNames: {
        '#request_status': 'status',
      },
    }
    return this.list<ExportRequest>(param, itemToExportRequest)
  }

  async list<T>(params: DocumentClient.ScanInput, transform: (item: DocumentClient.AttributeMap) => T): Promise<T[]> {
    const { dynamoDb } = this
    const data = await dynamoDb.scan(params).promise()
    if (!data.Items) {
      return []
    }
    return Promise.all(
      data.Items.map((item) => {
        return transform(item)
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
    eventCount: Number.isInteger(item.eventCount) ? parseInt(item.eventCount) : undefined,
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
    status: exportRequestStatusToString(status),
  }
}

export function customExportRequestToItem(request: CustomExportRequest): CustomExportRequestDataItem {
  const { rangeRequested: {startDate, endDate}, status, statusUrl, reportType } = request
  return {
    startDate: `${startDate.getTime()}`,
    endDate: `${endDate.getTime()}`,
    status: customExportRequestStatusToString(status),
    statusUrl,
    reportType
  }
}

export function itemToExportRequest(item: DocumentClient.AttributeMap): ExportRequest {
  const { dateRequested, status } = item
  return {
    dateRequested: moment(dateRequested, 'YYYY-MM-DD').toDate(),
    status: exportRequestStatusFromValue(status),
  }
}

export function itemToCustomExportRequest(item: DocumentClient.AttributeMap): CustomExportRequest {
  const { startDate, endDate, statusUrl, status, reportType } = item
  return {
    rangeRequested: {
      startDate: moment(parseInt(startDate)).toDate(), 
      endDate: moment(parseInt(endDate)).toDate()
    },
    statusUrl,
    status: customExportRequestStatusFromValue(status),
    reportType,
  }
}
