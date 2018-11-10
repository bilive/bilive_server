import util from 'util'
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
export default { JSONparse, Log, logs, ErrorLog }