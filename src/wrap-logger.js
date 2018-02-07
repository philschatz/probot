// Return a function that defaults to "info" level, and has properties for
// other levels:
//
//     robot.log("info")
//     robot.log.trace("verbose details");
//
module.exports = function wrapLogger (logger, baseLogger) {
  const fn = logger.info.bind(logger);

  // Add level methods on the logger
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(level => {
    fn[level] = logger[level].bind(logger)
  })

  // Expose `child` method for creating new wrapped loggers
  fn.child = (attrs) => wrapLogger(logger.child(attrs, true), baseLogger)

  // Expose target logger
  fn.target = baseLogger

  return fn
}
