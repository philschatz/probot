import * as Logger from 'bunyan'

export default (opts: WebhookProxyOptions) => {
  try {
    const SmeeClient = require('smee-client')

    const smee = new SmeeClient({
      source: opts.url,
      target: `http://localhost:${opts.port}${opts.path}`,
      logger: opts.logger
    })
    return smee.start()
  } catch (err) {
    opts.logger.warn('Run `npm install --save-dev smee-client` to proxy webhooks to localhost.')
  }
}

interface WebhookProxyOptions {
  url: string
  port: number
  path: string
  logger: Logger
}
