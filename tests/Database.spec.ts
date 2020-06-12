import { File } from '../src/model/Models'
import { fileToItem, itemToFile } from '../src/database/Database'

describe('Transform functions', () => {
  const file: File = {
    downloaded: false,
    downloadPath: 'https://branch-demo-data-export-scheduler-dev-exports-bucket.s3.amazonaws.com/545541699229733113-2019-09-10-eo_custom_event-v2-28caae5790f83991ede4aac18dd55ed3fc50061d1ca3f76d3016d75fe9a3e2ea-63dzUe.csv',
    pathAvailable: true,
    type: 'daily'
  }

  it('Converts file to database item and reverses it correctly', () => {
    const item = fileToItem(file)
    const reverse = itemToFile(item)
    Object.keys(reverse).forEach( key => {
      expect(file[key]).toEqual(reverse[key])
    })
  })
})