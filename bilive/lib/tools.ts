import util from 'util'
import { EventEmitter } from 'events'
/**
 * 一些工具, 供全局调用
 *
 * @class Tools
 * @extends {EventEmitter}
 */
class Tools extends EventEmitter {
  constructor() {
    super()
    this.on('systemMSG', (data: systemMSG) => this.Log(data.message))
  }
  /**
   * 格式化JSON
   *
   * @template T
   * @param {string} text
   * @param {((key: any, value: any) => any)} [reviver]
   * @returns {(Promise<T | undefined>)}
   * @memberof tools
   */
  public JSONparse<T>(text: string, reviver?: ((key: any, value: any) => any)): Promise<T | undefined> {
    return new Promise<T | undefined>(resolve => {
      try {
        const obj = JSON.parse(text, reviver)
        return resolve(obj)
      }
      catch (error) {
        this.ErrorLog('JSONparse', error)
        return resolve()
      }
    })
  }
  /**
   * 当前系统时间
   *
   * @returns {string}
   * @memberof Tools
   */
  public Date(): string {
    return new Date().toString().slice(4, 24)
  }
  /**
   * 格式化输出, 配合PM2凑合用
   *
   * @param {...any[]} message
   * @memberof tools
   */
  public Log(...message: any[]) {
    const log = util.format(`${this.Date()} :`, ...message)
    if (this.logs.length > 500) this.logs.shift()
    this.emit('log', log)
    this.logs.push(log)
    console.log(log)
  }
  public logs: string[] = []
  /**
   * 格式化输出, 配合PM2凑合用
   *
   * @param {...any[]} message
   * @memberof tools
   */
  public ErrorLog(...message: any[]) {
    console.error(`${this.Date()} :`, ...message)
  }
  /**
   * sleep
   *
   * @param {number} ms
   * @returns {Promise<'sleep'>}
   * @memberof tools
   */
  public Sleep(ms: number): Promise<'sleep'> {
    return new Promise<'sleep'>(resolve => setTimeout(() => resolve('sleep'), ms))
  }
}
export default new Tools()