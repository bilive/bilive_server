import * as http from 'http'
import * as fs from 'fs'
import * as ws from 'ws'
import * as tools from './lib/tools'
import { ApiKeyModel, apiKey } from './mongo/apikey'
import { beatStormInfo, smallTVInfo, raffleInfo, lightenInfo } from './roomlistener'
import { options } from './index'
/**
 * WebSocket服务
 * 
 * @export
 * @class WSServer
 */
export class WSServer {
  private _wsServer: ws.Server
  private _clients: Map<string, Set<ws>> = new Map()
  private _apiKeys: Map<string, apiKey> = new Map()
  /**
   * 启动WebSocket服务
   * 
   * @memberof WSServer
   */
  public async Start() {
    await this._Loop()
    this._HttpServer()
  }
  /**
   * 循环
   * 
   * @private
   * @memberof WSServer
   */
  private async _Loop() {
    let apiKeys = await ApiKeyModel.find().exec().catch(tools.Error)
    if (apiKeys != null) {
      apiKeys.forEach(apiKey => {
        if (apiKey.status) this._apiKeys.set(apiKey.apiKey, apiKey)
        if (!apiKey.status && this._apiKeys.has(apiKey.apiKey)) this._apiKeys.delete(apiKey.apiKey)
      })
    }
    setTimeout(() => {
      this._Loop()
    }, 6e+4) // 60秒
  }
  /**
   * HTTP服务
   * 
   * @private
   * @memberof Options
   */
  private _HttpServer() {
    let server = http.createServer((req, res) => {
      req.on('error', tools.Error)
      res.on('error', tools.Error)
      res.writeHead(200)
      res.end('All glory to WebSockets!\n')
    })
    server.on('error', tools.Error)
    if (options.path === '') {
      server.listen(options.port, options.hostname === '' ? undefined : options.hostname, () => {
        this._WebSocketServer(server)
        tools.Log(`${options.hostname}:${options.port}`)
      })
    }
    else {
      if (fs.existsSync(options.path)) fs.unlinkSync(options.path)
      server.listen(options.path, () => {
        fs.chmodSync(options.path, '666')
        this._WebSocketServer(server)
        tools.Log(options.path)
      })
    }
  }
  /**
   * WebSocket服务
   * 
   * @private
   * @param {http.Server} server 
   * @memberof WSServer
   */
  private _WebSocketServer(server: http.Server) {
    // 不知道子协议的具体用法
    this._wsServer = new ws.Server({
      server: server,
      handleProtocols: (protocols: string[]) => {
        let protocol: string = protocols[0]
        if (this._apiKeys.has(protocol)) return protocol
        else return false
      }
    })
    this._wsServer.on('connection', this._WsConnectionHandler.bind(this))
    this._WebSocketPing()
  }
  /**
   * 处理连接事件
   * 
   * @private
   * @param {ws} client 
   * @param {http.IncomingMessage} req 
   * @memberof WSServer
   */
  private _WsConnectionHandler(client: ws, req: http.IncomingMessage) {
    let remoteAddress = req.headers['x-real-ip'] == null ? `${req.connection.remoteAddress}:${req.connection.remotePort}` : `${req.headers['x-real-ip']}:${req.headers['x-real-port']}`
      , useragent = req.headers['user-agent']
      , apiKey = client.protocol
    if (this._apiKeys.has(apiKey)) {
      let apiData = <apiKey>this._apiKeys.get(apiKey)
      // 分api存储
      if (this._clients.has(apiKey)) {
        let clients = this._clients.get(apiKey)
        if (clients == null) clients = new Set([client])
        else clients.add(client)
      }
      else {
        let clients = new Set([client])
        this._clients.set(apiKey, clients)
      }
      let destroy = () => {
        client.close()
        client.terminate()
        client.removeAllListeners()
        tools.Log('closed', apiKey, remoteAddress, useragent)
      }
      client
        .on('close', () => {
          destroy()
          let clients = this._clients.get(apiKey)
          if (clients != null) clients.delete(client)
        })
        .on('error', (data) => {
          destroy()
          tools.Error(data)
        })
      // 记录连接地址
      tools.Log('connected', apiKey, remoteAddress, useragent)
      // 连接成功消息
      let message: message = {
        cmd: 'sysmsg',
        msg: apiData.welcome
      }
      client.send(JSON.stringify(message), error => { if (error != null) tools.Log(error) })
    }
  }
  /**
   * Ping/Pong
   * 
   * @private
   * @memberof WSServer
   */
  private _WebSocketPing() {
    this._wsServer.clients.forEach(client => {
      if (client.readyState === ws.OPEN) client.ping()
    })
    setTimeout(() => {
      this._WebSocketPing()
    }, 6e+4) // 60秒
  }
  /**
   * 消息广播
   * 
   * @param {string} msg 
   * @param {string} [apiKey] 
   * @memberof WSServer
   */
  public SysMsg(msg: string, apiKey?: string) {
    let message: message = {
      cmd: 'sysmsg',
      msg: msg
    }
    this._Broadcast(message, 'sysmsg', apiKey)
  }
  /**
   * 节奏风暴
   * 
   * @param {beatStormInfo} beatStormInfo
   * @param {string} [apiKey]
   * @memberof WSServer
   */
  public BeatStorm(beatStormInfo: beatStormInfo, apiKey?: string) {
    let message: message = {
      cmd: 'beatStorm',
      data: beatStormInfo
    }
    this._Broadcast(message, 'beatStorm', apiKey)
  }
  /**
   * 小电视
   * 
   * @param {smallTVInfo} smallTVInfo
   * @param {string} [apiKey]
   * @memberof WSServer
   */
  public SmallTV(smallTVInfo: smallTVInfo, apiKey?: string) {
    let message: message = {
      cmd: 'smallTV',
      data: smallTVInfo
    }
    this._Broadcast(message, 'smallTV', apiKey)
  }
  /**
   * 抽奖
   * 
   * @param {raffleInfo} raffleInfo
   * @param {string} [apiKey]
   * @memberof WSServer
   */
  public Raffle(raffleInfo: raffleInfo, apiKey?: string) {
    let message: message = {
      cmd: 'raffle',
      data: raffleInfo
    }
    this._Broadcast(message, 'raffle', apiKey)
  }
  /**
   * 快速抽奖
   * 
   * @param {lightenInfo} lightenInfo
   * @param {string} [apiKey]
   * @memberof WSServer
   */
  public Lighten(lightenInfo: lightenInfo, apiKey?: string) {
    let message: message = {
      cmd: 'lighten',
      data: lightenInfo
    }
    this._Broadcast(message, 'raffle', apiKey)
  }
  /**
   * 调试模式
   * 
   * @param {debugInfo} debugInfo
   * @param {string} [apiKey]
   * @memberof WSServer
   */
  public Debug(debugInfo: debugInfo, apiKey?: string) {
    let message: message = {
      cmd: 'debug',
      data: debugInfo
    }
    this._Broadcast(message, 'debug', apiKey)
  }
  /**
   * 广播消息
   * 
   * @private
   * @param {message} message 
   * @param {string} key 
   * @param {string} [apikey] 
   * @memberof WSServer
   */
  private _Broadcast(message: message, key: string, apikey?: string) {
    this._clients.forEach((clients, apiKey) => {
      if (apikey != null && apikey !== apiKey) return
      if (this._apiKeys.has(apiKey)) {
        let apiData = <apiKey>this._apiKeys.get(apiKey)
        if (apiData[key]) {
          clients.forEach(client => {
            if (client.readyState === ws.OPEN) client.send(JSON.stringify(message), error => { if (error != null) tools.Log(error) })
          })
        }
      }
    })
  }
}
/**
 * 消息格式
 * 
 * @interface message
 */
interface message {
  cmd: string
  msg?: string
  data?: smallTVInfo | beatStormInfo | raffleInfo | lightenInfo | debugInfo
}
/**
 * api消息格式
 * 
 * @interface message
 */
interface apiMessage extends message {
  apiKey?: string
  key?: string
  value?: string | boolean | number
}
/**
 * 远程调试
 * 
 * @export
 * @interface debugInfo
 */
export interface debugInfo {
  driver: string
  url: string
  method: string
  body: string
}