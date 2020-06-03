export interface File {
  downloadPath: string
  pathAvailable: boolean
  downloaded: boolean
  batchCount?: number
  eventCount?: number
}

export interface DownloadDatabaseItem {
  downloaded: string
  downloadPath: string
  pathAvailable: string
}

export enum ExportRequestStatus {
  Empty,
  Success,
  Failed
}

export enum CustomExportRequestStatus {
  None,
  Failed,
  Pending,
  Running,
  Complete
}

export interface ExportRequestDatabaseItem {
  dateRequested: string,
  status: string,
}

export interface CustomExportRequest {
  reportType: string,
  rangeRequested: RequestRange,
  statusUrl: string,
  status: CustomExportRequestStatus,
}

export interface RequestRange {
  startDate: Date,
  endDate: Date,
}

export interface CustomExportRequestDataItem {
  reportType: string,
  startDate: string,
  endDate: string,
  statusUrl: string,
  status: string,
}

export interface ExportRequest {
  dateRequested: Date,
  status: ExportRequestStatus
}

export interface Response {
  statusCode: number
  body: string
  isBase64Encoded: boolean
}

export interface CustomExportRequestResponse {
  handle: string,
  export_job_status_url: string,
}

export interface StatusResponse {
    "status": string,
    "response_url": string | null | undefined
}