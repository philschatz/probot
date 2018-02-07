import * as Logger from 'bunyan'

// Return a function that defaults to "info" level, and has properties for
// other levels:
//
//     robot.log("info")
//     robot.log.trace("verbose details");
//
export default function wrapLogger (logger: Logger, baseLogger: Logger): Logger {
  const fn = logger.info.bind(logger);

  // Add level methods on the logger
  fn.trace = logger.trace.bind(logger)
  fn.debug = logger.debug.bind(logger)
  fn.info = logger.info.bind(logger)
  fn.warn = logger.warn.bind(logger)
  fn.error = logger.error.bind(logger)
  fn.fatal = logger.fatal.bind(logger)

  // Expose `child` method for creating new wrapped loggers
  fn.child = (attrs: Object) => wrapLogger(logger.child(attrs, true), baseLogger)

  // Expose target logger
  fn.target = baseLogger

  return fn
}
