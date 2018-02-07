import * as GitHubApi from 'github'
import * as Logger from 'bunyan'
const path = require('path')
const yaml = require('js-yaml')

/**
 * Helpers for extracting information from the webhook event, which can be
 * passed to GitHub API calls.
 *
 * @property {github} github - An authenticated GitHub API client
 * @property {payload} payload - The webhook event payload
 * @property {logger} log - A logger
 */
class Context {
  id?: string // Is this used? It is assumed in robot
  github: GitHubApi
  log: Logger
  payload: WebhookPayloadWithRepository
  constructor (event: any, github: GitHubApi, log: Logger) {
    Object.assign(this, event)
    this.github = github
    this.log = log
  }

  /**
   * Return the `owner` and `repo` params for making API requests against a
   * repository.
   *
   * @param {object} [object] - Params to be merged with the repo params.
   *
   * @example
   *
   * const params = context.repo({path: '.github/stale.yml'})
   * // Returns: {owner: 'username', repo: 'reponame', path: '.github/stale.yml'}
   *
   */
  repo (object?: PossibleReposGetContentParams) {
    const repo = this.payload.repository

    return Object.assign({
      owner: repo.owner.login || repo.owner.name,
      repo: repo.name
    }, object) as GitHubApi.ReposGetContentParams
  }

  /**
   * Return the `owner`, `repo`, and `number` params for making API requests
   * against an issue or pull request. The object passed in will be merged with
   * the repo params.
   *
   * @example
   *
   * const params = context.issue({body: 'Hello World!'})
   * // Returns: {owner: 'username', repo: 'reponame', number: 123, body: 'Hello World!'}
   *
   * @param {object} [object] - Params to be merged with the issue params.
   */
  issue (object: PossibleReposGetContentParams) {
    const payload = this.payload
    return Object.assign({
      number: (payload.issue || payload.pull_request || payload).number
    }, this.repo(), object)
  }

  /**
   * Returns a boolean if the actor on the event was a bot.
   * @type {boolean}
   */
  get isBot () {
    return this.payload.sender.type === 'Bot'
  }

  /**
   * Reads the app configuration from the given YAML file in the `.github`
   * directory of the repository.
   *
   * @example <caption>Contents of <code>.github/myapp.yml</code>.</caption>
   *
   * close: true
   * comment: Check the specs on the rotary girder.
   *
   * @example <caption>App that reads from <code>.github/myapp.yml</code>.</caption>
   *
   * // Load config from .github/myapp.yml in the repository
   * const config = await context.config('myapp.yml')
   *
   * if (config.close) {
   *   context.github.issues.comment(context.issue({body: config.comment}))
   *   context.github.issues.edit(context.issue({state: 'closed'}))
   * }
   *
   * @example <caption>Using a <code>defaultConfig</code> object.</caption>
   *
   * // Load config from .github/myapp.yml in the repository and combine with default config
   * const config = await context.config('myapp.yml', {comment: 'Make sure to check all the specs.'})
   *
   * if (config.close) {
   *   context.github.issues.comment(context.issue({body: config.comment}));
   *   context.github.issues.edit(context.issue({state: 'closed'}))
   * }
   *
   * @param {string} fileName - Name of the YAML file in the `.github` directory
   * @param {object} [defaultConfig] - An object of default config options
   * @return {Promise<Object>} - Configuration object read from the file
   */
  async config<T> (fileName: string, defaultConfig: T) {
    const params = this.repo({path: path.posix.join('.github', fileName)})

    try {
      const res = await this.github.repos.getContent(params)
      const config = yaml.safeLoad(Buffer.from(res.data.content, 'base64').toString()) || {}
      return Object.assign({}, defaultConfig, config)
    } catch (err) {
      if (err.code === 404) {
        if (defaultConfig) {
          return defaultConfig
        }
        return null
      } else {
        throw err
      }
    }
  }
}

interface PossibleReposGetContentParams {
  path: string
}

export interface PayloadRepository {
  full_name: string
  name: string
  owner: {
    login: string
    name: string
  }
}

export interface WebhookPayloadWithRepository {
  repository: PayloadRepository
  issue: {
    number: number
  }
  pull_request: {
    number: number
  }
  sender: {
    type: string
  }
  action: string
  installation: {
    id: number
  }

}

export default Context
