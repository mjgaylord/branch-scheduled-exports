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

export enum Destinations {
  Segment,
  Amplitude,
  mParticle
}

export enum ExportRequestStatus {
  Empty,
  Success,
  Failed
}

export interface ExportRequestDatabaseItem {
  dateRequested: string,
  status: string
}

export interface ExportRequest {
  dateRequested: Date,
  status: ExportRequestStatus
}

// export enum EventTopic {
//   Click = 'eo_click',
//   View = 'eo_branch_cta_view',
//   Commerce = 'eo_commerce_event',
//   Content = 'eo_content_event',
//   Install = 'eo_install',
//   Open = 'eo_open',
//   PageView = 'eo_pageview',
//   Reinstall = 'eo_reinstall',
//   SMSSent = 'eo_sms_sent',
//   UserLifecycleEvent = 'eo_user_lifecycle_event',
//   WebSessionStart = 'eo_web_session_start',
//   WebToAppAutoRedirect = 'eo_web_to_app_auto_redirect'
// }

export interface Response {
  statusCode: number
  body: string
  isBase64Encoded: boolean
}