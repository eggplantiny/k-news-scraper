import { scrapPage } from './yhnews'
import { Article, Options } from '../types'
import { getExponentiallyUniform } from '../helpers/random'
import { delay } from '../helpers/asyncUtils'
import moment from 'moment'
import { Moment } from 'moment'
import * as fs from 'fs'

function writeJson (name: string, data: any) {
  fs.writeFileSync(name, JSON.stringify(data, null, 2))
}

function generateDateRange (options: Options, date: Moment) {
  const from = moment(date)
    .subtract(options.dateRange.amount, options.dateRange.unit)
    .format(options.dateFormat)
  const to = moment(date).format(options.dateFormat)
  return { from, to }
}

async function runner (
  options: Options,
  from: string,
  to: string,
  pageNo: number = 1,
  successList: Article[] = [],
  failedList: string[] = []
): Promise<any> {
  console.log(`> [${from} ~ ${to}] scraping ${pageNo} page with query '${options.query}'`)
  const { success, failed } = await scrapPage(options.query, pageNo, from, to)

  successList.push(...success)
  failedList.push(...failed)
  console.log(`> success: ${successList.length}`)
  console.log(`> failed: ${failedList.length}`)

  const ms = getExponentiallyUniform(options.delay)
  await delay(ms)

  if (pageNo > options.maximumPage || (success.length + failed.length) === 0) {
    return { successList, failedList }
  }

  return runner(options, from, to, pageNo + 1, successList, failedList)
}

export default async function run (options: Options) {
  const startDate = moment(options.startDate)
  const cursorDate = moment()
  const success = []
  const failed = []

  console.log(`start scraping with query ${options.query}.`)
  console.time('time')
  do {
    const { from, to } = generateDateRange(options, cursorDate)
    const { successList, failedList } = await runner(options, from, to)
    success.push(...successList)
    failed.push(...failedList)
    cursorDate.subtract(options.dateRange.amount, options.dateRange.unit)
    console.log(`success: ${success.length}, failed: ${failed.length}`)
  } while (startDate.diff(cursorDate, options.endCondition.unit) < options.endCondition.amount)
  console.log(`complete scraping with query ${options.query}`)
  console.timeEnd('time')

  writeJson(`${options.query}_success.data.json`, success)
  writeJson(`${options.query}_failed.data.json`, failed)
}

