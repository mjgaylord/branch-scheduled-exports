import { ExportRequestStatus } from '../model/Models'

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

export function exportRequestStatusFromValue(value: string) {
  if (value === exportRequestStatusToString(ExportRequestStatus.Empty)) {
    return ExportRequestStatus.Empty
  }
  if (value === exportRequestStatusToString(ExportRequestStatus.Failed)) {
    return ExportRequestStatus.Failed
  }
  return ExportRequestStatus.Success
}