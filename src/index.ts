#!/usr/bin/env node

import minimist from 'minimist'
import moment from 'moment'
import run from './news/runner'
import { Options } from './types'

const args = process.argv.slice(2)

function parseArgs (args: string[]): Options {
  const parsedArgs = minimist(args, {
    default: {
      a: 1,
      u: 'm',
      d: null
    }
  })

  if (!parsedArgs.q) {
    throw new Error('-q [query] argument have to entered.')
  }

  if (!['y', 'm', 'w', 'd'].includes(parsedArgs.u)) {
    throw new Error('-u [unit] argument must be one of "y", "m", "w" or "d"')
  }

  const query = parsedArgs.q
  const startDate = moment(parsedArgs.d ?? undefined).format('YYYYMMDD')
  const endCondition = {
    amount: parsedArgs.a,
    unit: parsedArgs.u
  }

  return {
    query,
    startDate,
    endCondition,
    dateRange: {
      amount: 1,
      unit: 'w'
    },
    maximumPage: 50,
    delay: 80,
    dateFormat: 'YYYYMMDD'
  }
}

function main () {
  try {
    const options = parseArgs(args)
    run(options)
  } catch (e) {
    console.error(e)
  }
}

(() => {
  main()
})()
