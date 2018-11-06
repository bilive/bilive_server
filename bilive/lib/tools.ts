import util from 'util'
import crypto from 'crypto'
import request from 'request'
import Options from '../options'
/**
 * 请求头
 *
 * @param {string} platform
 * @returns {request.Headers}
 */
function getHeaders(platform: string): request.Headers {
  switch (platform) {
    case 'Android':
      return {
        'Connection': 'Keep-Alive',
        'User-Agent': 'Mozilla/5.0 BiliDroid/5.30.0 (bbcallen@gmail.com)'
      }
    case 'WebView':
      return {
        'Accept': 'application/json, text/javascript, */*',
        'Accept-Language': 'zh-CN',
        'Connection': 'keep-alive',
        'Cookie': 'l=v',
        'Origin': Options._.config.liveOrigin,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; G8142 Build/47.1.A.12.270; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.91 Mobile Safari/537.36 BiliApp/5300000',
        'X-Requested-With': 'tv.danmaku.bili'
      }
    default:
      return {
        'Accept': 'application/json, text/javascript, */*',
        'Accept-Language': 'zh-CN',
        'Connection': 'keep-alive',
        'Cookie': 'l=v',
        'DNT': '1',
        'Origin': Options._.config.liveOrigin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
      }
  }
}
/**
 * 添加request头信息
 *
 * @template T
 * @param {request.OptionsWithUri} options
 * @param {('PC' | 'Android' | 'WebView')} [platform='PC']
 * @returns {Promise<response<T> | undefined>}
 */
function XHR<T>(options: request.OptionsWithUri, platform: 'PC' | 'Android' | 'WebView' = 'PC'): Promise<XHRresponse<T> | undefined> {
  return new Promise<XHRresponse<T> | undefined>(resolve => {
    options.gzip = true
    // 添加头信息
    const headers = getHeaders(platform)
    options.headers = options.headers === undefined ? headers : Object.assign(headers, options.headers)
    if (options.method === 'POST')
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
    // 返回异步request
    request(options, (error, response, body) => {
      if (error === null) resolve({ response, body })
      else {
        ErrorLog(options.uri, error)
        resolve()
      }
    })
  })
}
/**
 * 格式化JSON
 *
 * @template T
 * @param {string} text
 * @param {((key: any, value: any) => any)} [reviver]
 * @returns {Promise<T | undefined>}
 */
function JSONparse<T>(text: string, reviver?: ((key: any, value: any) => any)): Promise<T | undefined> {
  return new Promise<T | undefined>(resolve => {
    try {
      const obj = JSON.parse(text, reviver)
      return resolve(obj)
    }
    catch (error) {
      ErrorLog('JSONparse', error)
      return resolve()
    }
  })
}
/**
 * Hash
 *
 * @param {string} algorithm
 * @param {(string | Buffer)} data
 * @returns {string}
 */
function Hash(algorithm: string, data: string | Buffer): string {
  return crypto.createHash(algorithm).update(data).digest('hex')
}
/**
 * 格式化输出, 配合PM2凑合用
 *
 * @param {...any[]} message
 */
function Log(...message: any[]) {
  const log = util.format(`${new Date().toString().slice(4, 24)} :`, ...message)
  if (logs.data.length > 500) logs.data.shift()
  if (typeof logs.onLog === 'function') logs.onLog(log)
  logs.data.push(log)
  console.log(log)
}
const logs: { data: string[], onLog?: (data: string) => void } = {
  data: []
}
/**
 * 格式化输出, 配合PM2凑合用
 *
 * @param {...any[]} message
 */
function ErrorLog(...message: any[]) {
  console.error(`${new Date().toString().slice(4, 24)} :`, ...message)
}
/**
 * sleep
 *
 * @param {number} ms
 * @returns {Promise<'sleep'>}
 */
function Sleep(ms: number): Promise<'sleep'> {
  return new Promise<'sleep'>(resolve => setTimeout(() => resolve('sleep'), ms))
}
export default { XHR, JSONparse, Hash, Log, logs, ErrorLog, Sleep }