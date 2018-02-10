import * as Octokit  from '@octokit/rest'
import * as Logger  from 'bunyan'
const Bottleneck = require('bottleneck')

/**
 * the [github Node.js module](https://github.com/octokit/node-github),
 * which wraps the [GitHub API](https://developer.github.com/v3/) and allows
 * you to do almost anything programmatically that you can do through a web
 * browser.
 * @typedef github
 * @see {@link https://github.com/octokit/node-github}
 */

const defaultCallback = (response: Octokit.AnyResponse, done: () => void) => response

async function paginate (octokit: OctokitWithPagination, responsePromise: Promise<Octokit.AnyResponse>, callback = defaultCallback) {
  let collection: Array<any> = []
  let getNextPage = true
  let done = () => {
    getNextPage = false
  }
  let response = await responsePromise
  collection = collection.concat(await callback(response, done))
 // eslint-disable-next-line no-unmodified-loop-condition
  while (getNextPage && octokit.hasNextPage(response)) {
    response = await octokit.getNextPage(response)
    collection = collection.concat(await callback(response, done))
  }
  return collection
}

function EnhancedGitHubClient (options: Options) {
  const octokit = <OctokitWithPagination> new Octokit(options)
  const noop = () => Promise.resolve()
  const logger = options.logger
  const limiter = options.limiter || new Bottleneck({ maxConcurrent: 1, minTime: 1000 })

  octokit.hook.before('request', limiter.schedule.bind(limiter, noop))
  octokit.hook.error('request', (error, options) => {
    const {method, url, headers, ...params} = options
    const msg = `GitHub request: ${method} ${url} - ${error.code} ${error.status}`
    logger.debug({params}, msg)
    throw error
  })
  octokit.hook.after('request', (result, options) => {
    const {method, url, headers, ...params} = options
    const msg = `GitHub request: ${method} ${url} - ${result.meta.status}`
    logger.debug({params}, msg)
  })
  octokit.paginate = paginate.bind(null, octokit)

  return octokit
}

module.exports = EnhancedGitHubClient

interface Options extends Octokit.Options {
  logger: Logger
  limiter?: any
}

interface OctokitRequestOptions {
  method: string
  url: string
  headers: any
}

interface OctokitResult {
  meta: {
    status: string
  }
}

interface OctokitError {
  code: number
  status: string
}

interface OctokitWithPagination extends Octokit {
  paginate: (res: Promise<Octokit.AnyResponse>, callback: (results: Octokit.AnyResponse) => void) => void
  // The following are added because Octokit does not expose the hook.error, hook.before, and hook.after methods
  hook: {
    error: (when: 'request', callback: (error: OctokitError, options: OctokitRequestOptions) => void) => void
    before: (when: 'request', callback: (result: OctokitResult, options: OctokitRequestOptions) => void) => void
    after: (when: 'request', callback: (result: OctokitResult, options: OctokitRequestOptions) => void) => void
  }
}
