import fs from 'fs'
import util from 'util'
import { EventEmitter } from 'events'
const FSwriteFile = util.promisify(fs.writeFile)
/**
 *
 *
 * @class Options
 * @extends {EventEmitter}
 */
class Options extends EventEmitter {
  constructor() {
    super()
    // 根据npm start参数不同设置不同路径
    this._dirname = __dirname + (process.env.npm_package_scripts_start === 'node build/app.js' ? '/../..' : '/..')
    // 检查是否有options目录
    const hasDir = fs.existsSync(this._dirname + '/options/')
    if (!hasDir) fs.mkdirSync(this._dirname + '/options/')
    // 复制默认设置文件到用户设置文件
    const hasFile = fs.existsSync(this._dirname + '/options/options.json')
    if (!hasFile) fs.copyFileSync(this._dirname + '/bilive/options.default.json', this._dirname + '/options/options.json')
    // 读取默认设置文件
    const defaultOptionBuffer = fs.readFileSync(this._dirname + '/bilive/options.default.json')
    const defaultOption = <options>JSON.parse(defaultOptionBuffer.toString())
    // 读取用户设置文件
    const userOptionBuffer = fs.readFileSync(this._dirname + '/options/options.json')
    const userOption = <options>JSON.parse(userOptionBuffer.toString())
    if (defaultOption === undefined || userOption === undefined) throw new TypeError('文件格式化失败')
    defaultOption.server = Object.assign({}, defaultOption.server, userOption.server)
    defaultOption.config = Object.assign({}, defaultOption.config, userOption.config)
    for (const uid in userOption.user)
      defaultOption.user[uid] = Object.assign({}, defaultOption.newUserData, userOption.user[uid])
    this._ = defaultOption
  }
  public _: options
  private _dirname: string
  public async save() {
    const blacklist = ['newUserData', 'info']
    const error = await FSwriteFile(this._dirname + '/options/options.json'
      , JSON.stringify(this._, (key, value) => blacklist.includes(key) ? undefined : value, 2))
    if (error !== undefined) console.error(`${new Date().toString().slice(4, 24)} :`, error)
    return this._
  }
}
export default new Options()