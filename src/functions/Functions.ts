import { ExportRequestStatus, CustomExportRequestStatus } from '../model/Models'

export function exportRequestStatusToString(type: ExportRequestStatus) {
  switch (type) {
    case ExportRequestStatus.Empty:
      return 'Empty'
    case ExportRequestStatus.Failed:
      return 'Failed'
    case ExportRequestStatus.Success:
      return 'Success'
  }
}

export function customExportRequestStatusToString(type: CustomExportRequestStatus) {
  switch (type) {
    case CustomExportRequestStatus.None:
      return 'none'
    case CustomExportRequestStatus.Failed:
      return 'failed'
    case CustomExportRequestStatus.Running:
      return 'running'
    case CustomExportRequestStatus.Complete:
      return 'complete'
    case CustomExportRequestStatus.Pending:
      return 'pending'
  }
}

export function customExportRequestStatusFromValue(value: string) {
  if (value === customExportRequestStatusToString(CustomExportRequestStatus.None)) {
    return CustomExportRequestStatus.None
  }
  if (value === customExportRequestStatusToString(CustomExportRequestStatus.Failed)) {
    return CustomExportRequestStatus.Failed
  }
  if (value === customExportRequestStatusToString(CustomExportRequestStatus.Pending)) {
    return CustomExportRequestStatus.Pending
  }
  if (value === customExportRequestStatusToString(CustomExportRequestStatus.Running)) {
    return CustomExportRequestStatus.Running
  }
  if (value === customExportRequestStatusToString(CustomExportRequestStatus.Complete)) {
    return CustomExportRequestStatus.Complete
  }
  return CustomExportRequestStatus.Pending
}

export function exportRequestStatusFromValue(value: string) {
  if (value === exportRequestStatusToString(ExportRequestStatus.Empty)) {
    return ExportRequestStatus.Empty
  }
  if (value === exportRequestStatusToString(ExportRequestStatus.Failed)) {
    return ExportRequestStatus.Failed
  }
  return ExportRequestStatus.Success
}