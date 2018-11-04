import nedb from 'nedb'

class myDB {
  constructor(path: string) {
    this._path = path
  }
  private __db!: nedb
  protected _path: string
  /**
   * 加载
   *
   * @returns {(Promise<Error | null>)}
   * @memberof newdb
   */
  public load(): Promise<Error | null> {
    return new Promise(resolve => {
      this.__db = new nedb({
        filename: this._path, autoload: true, onload: err => {
          if (err === null) this.__db.persistence.setAutocompactionInterval(60 * 60 * 1000)
          resolve(err)
        }
      })
    })
  }
  /**
   * 查找
   *
   * @template T
   * @param {*} query
   * @returns {(Promise<Error | T[]>)}
   * @memberof newdb
   */
  public find<T>(query: any): Promise<Error | T[]> {
    return new Promise(resolve => {
      this.__db.find(query, (err: Error | null, documents: T[]) => err === null ? resolve(documents) : resolve(err))
    })
  }
  /**
   * 查找一个
   *
   * @template T
   * @param {*} query
   * @returns {(Promise<Error | T>)}
   * @memberof newdb
   */
  public findOne<T>(query: any): Promise<Error | T | null> {
    return new Promise(resolve => {
      this.__db.findOne(query, (err: Error | null, document: T) => err === null ? resolve(document) : resolve(err))
    })
  }
  /**
   * 更新
   *
   * @param {*} query
   * @param {*} updateQuery
   * @param {Nedb.UpdateOptions} [options]
   * @returns {(Promise<Error | null>)}
   * @memberof newdb
   */
  public update(query: any, updateQuery: any, options?: Nedb.UpdateOptions): Promise<Error | null> {
    return new Promise(resolve => {
      this.__db.update(query, updateQuery, options, (err: Error | null) => resolve(err))
    })
  }
}

const dbPath = __dirname + (process.env.npm_package_scripts_start === 'node build/app.js' ? '/../..' : '/..') + '/options'
const db = { roomList: new myDB(dbPath + '/roomList.db') }

export default db