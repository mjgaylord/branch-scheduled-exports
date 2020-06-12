import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import { fields } from '../config/includedFields'
import axios from 'axios'
import 'source-map-support/register'
import moment from 'moment'
// @ts-ignore
import dotenv, { config } from 'dotenv'
import {
  Response,
  File,
  CustomExportRequestStatus,
  CustomExportRequest,
  CustomExportRequestResponse,
  StatusResponse,
} from '../model/Models'
import { Database } from '../database/Database'
import { getSecret, Secret } from '../utils/Secrets'
import { reportTypes, branchAppId } from '../utils/Config'
import { customExportRequestStatusFromValue } from '../functions/Functions'
import { downloadFiles } from './CheckDownloads'

export const run: APIGatewayProxyHandler = async (
  _event: any = {},
  _context: Context,
  _callback: Callback
): Promise<any> => {
  dotenv.config()
  try {
    console.info(`Fetching exports on: ${moment().format()}`)
    axios.defaults.headers.common = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    const database = new Database()
    // filter out requests we cannot retrieve (older than 7 days)
    const sevenDaysOld = moment().subtract(10, 'days')

    // list all unsuccessful requests
    let requests =
      (await database.listUnsuccessfulCustomExportRequests()).filter((value) => {
        return value.rangeRequested.startDate.isAfter(sevenDaysOld)
      }) || []
    console.debug(`Unsuccessful custom request count: ${requests.length}`)

    // get the new requests that need to be made
    const newRequests = await Promise.all(reportTypes().map((type) => createRequest(type, database)))
    console.debug(`New requests created...`)
    requests = requests.concat(...newRequests.filter((r) => !!r))
    console.debug(`New custom request count: ${newRequests.length}`)

    // update or make the requests
    const files = (await Promise.all(requests.map((request) => updateOrMakeRequest(database, request)))).filter(
      (f) => !!f
    )
    if (files.length > 0) {
      await database.saveFiles(files)
      console.debug('Files saved successfully in database - downloading...')
      const bucket = process.env.EXPORTS_BUCKET
      await downloadFiles(files, bucket)
    }
    return {
      statusCode: 200,
      body: JSON.stringify(files),
      isBase64Encoded: false,
    }
  } catch (error) {
    console.error('Export files failed', error.message)
    const failed: Response = {
      statusCode: 400,
      body: error.message || 'Unknown error',
      isBase64Encoded: false,
    }
    return failed
  }
}

async function createRequest(reportType: string, database: Database): Promise<CustomExportRequest | undefined> {
  console.debug(`Creating new request for type: ${reportType}`)
  const mostRecent = await database.mostRecentCustomExportRequest(reportType)
  console.debug(`Most recent request for ${reportType} -> ${JSON.stringify(mostRecent)}`)
  const startDate = mostRecent?.rangeRequested.endDate || moment().subtract(1, 'days').startOf('hour')
  const endDate = moment().subtract(2, 'hours').startOf('hour')
  if (endDate.isSameOrBefore(startDate)) {
    console.debug(
      `Ignoring request for: ${reportType} because it is before the start date of the most recent request: ${JSON.stringify(
        mostRecent
      )}`
    )
    return
  }
  console.debug(`request start date: ${startDate} and endate: ${endDate}`)
  const request = {
    rangeRequested: { startDate, endDate },
    status: CustomExportRequestStatus.None,
    statusUrl: '',
    reportType,
  }
  await database.saveCustomExportRequest(request)
  return request
}

async function updateOrMakeRequest(database: Database, request: CustomExportRequest): Promise<File | undefined> {
  try {
    console.debug(`Initiating custom request for: ${JSON.stringify(request)}`)
    let { statusUrl } = request
    // if the export request does not have a statusUrl we need to get one
    if (!statusUrl || statusUrl.length === 0) {
      statusUrl = await requestExportUrl(request)
      request.statusUrl = statusUrl
    }

    // otherwise we need to call the statusUrl
    console.debug(`Custom Exports requested successfully. Checking ${request.reportType} status for: ${statusUrl}`)
    const { response_url, status } = await getStatus(statusUrl)
    request.status = customExportRequestStatusFromValue(status)
    console.debug(`Custom export status: ${status} for report type: ${request.reportType}`)
    await database.saveCustomExportRequest(request)

    if (!response_url) {
      console.debug(`Files not yet available yet...`)
      return
    }

    return {
      downloadPath: response_url,
      downloaded: false,
      pathAvailable: true,
      type: 'custom',
    }
  } catch (error) {
    console.error(`updateOrMakeRequest failed with error: ${JSON.stringify(error)}`)
    request.status = CustomExportRequestStatus.Failed
    await database.saveCustomExportRequest(request)
  }
}

async function requestExportUrl(request: CustomExportRequest): Promise<string> {
  console.info('Requesting status url from custom export API...')
  const api = axios.create({
    baseURL: 'https://api2.branch.io/v2',
  })
  const formatDate = (date: moment.Moment) => {
    return date.format('YYYY-MM-DDTHH:mm:ss')
  }
  const {
    rangeRequested: { startDate, endDate },
    reportType,
  } = request
  const payload = {
    report_type: reportType,
    start_date: `${formatDate(startDate)}Z`,
    end_date: `${formatDate(endDate)}Z`,
    limit: 2000000,
    fields,
  }
  const headers = await getHeaders()
  const response = await api.post<CustomExportRequestResponse>(`/logs?app_id=${branchAppId}`, payload, {
    headers,
  })
  const { export_job_status_url } = response.data
  return export_job_status_url
}

export async function getStatus(statusUrl: string | undefined): Promise<StatusResponse> {
  if (!statusUrl) {
    throw new Error('export_job_status_url not found on Branch response')
  }
  const headers = await getHeaders()
  const { data } = await axios.get<StatusResponse>(statusUrl, { headers })
  return data
}

async function getHeaders() {
  const accessToken = await getSecret(Secret.BranchAccessToken)
  return {
    'Access-Token': accessToken,
  }
}
