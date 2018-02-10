/**
 * A logger backed by [bunyan](https://github.com/trentm/node-bunyan)
 *
 * The default log level is `info`, but you can change it by setting the
 * `LOG_LEVEL` environment variable to `trace`, `debug`, `info`, `warn`,
 * `error`, or `fatal`.
 *
 * By default, logs are formatted for readability in development. If you intend
 * to drain logs to a logging service, set `LOG_FORMAT=json`.
 *
 * **Note**: All execptions reported with `logger.error` will be forwarded to
 * [sentry](https://github.com/getsentry/sentry) if the `SENTRY_DSN` environment
 * variable is set.
 *
 * @typedef logger
 *
 * @example
 *
 * robot.log("This is an info message");
 * robot.log.debug("…so is this");
 * robot.log.trace("Now we're talking");
 * robot.log.info("I thought you should know…");
 * robot.log.warn("Woah there");
 * robot.log.error("ETOOMANYLOGS");
 * robot.log.fatal("Goodbye, cruel world!");
 */

import * as Logger from 'bunyan'
import * as bunyanFormat from 'bunyan-format'
import serializers from './serializers'

function toBunyanLogLevel (level: string) {
  switch (level) {
    case 'info':
    case 'trace':
    case 'debug':
    case 'warn':
    case 'error':
    case 'fatal':
    case undefined:
      return level
    default:
      throw new Error('Invalid log level')
  }
}

function toBunyanFormat (format: string) {
  switch (format) {
    case 'short':
    case 'long':
    case 'simple':
    case 'json':
    case 'bunyan':
    case undefined:
      return format
    default:
      throw new Error('Invalid log format')
  }
}

const logger = new Logger({
  name: 'probot',
  level: toBunyanLogLevel(process.env.LOG_LEVEL || 'info'),
  stream: new bunyanFormat({outputMode: toBunyanFormat(process.env.LOG_FORMAT || 'short')}),
  serializers
})

export default logger
