import fs from 'fs'
import ws from 'ws'
import http from 'http'
import { randomBytes } from 'crypto'
import tools from './lib/tools'
import Options from './options'
/**
 * WebSocket服务
 *
 * @class WSServer
 */
class WSServer {
  private _wsServer!: ws.Server
  private _clients: Map<string, Set<ws>> = new Map()
  private _adminClient!: ws
  //@ts-ignore
  private _loop: NodeJS.Timer
  /**
   * 启动HTTP以及WebSocket服务
   *
   * @memberof WSServer
   */
  public async Start() {
    this._HttpServer()
  }
  /**
   * HTTP服务
   *
   * @private
   * @memberof Options
   */
  private _HttpServer() {
    // 直接跳转到github.io, 为防以后变更使用302
    const server = http.createServer((req, res) => {
      req.on('error', error => tools.ErrorLog('req', error))
      res.on('error', error => tools.ErrorLog('res', error))
      res.writeHead(302, { 'Location': '//github.halaal.win/bilive_client/' })
      res.end()
    }).on('error', error => tools.ErrorLog('http', error))
    // 监听地址优先支持Unix Domain Socket
    const listen = Options._.server
    if (listen.path === '') {
      const host = process.env.HOST === undefined ? listen.hostname : process.env.HOST
      const port = process.env.PORT === undefined ? listen.port : Number.parseInt(<string>process.env.PORT)
      server.listen(port, host, () => {
        this._WebSocketServer(server)
        tools.Log(`已监听 ${host}:${port}`)
      })
    }
    else {
      if (fs.existsSync(listen.path)) fs.unlinkSync(listen.path)
      server.listen(listen.path, () => {
        fs.chmodSync(listen.path, '666')
        this._WebSocketServer(server)
        tools.Log(`已监听 ${listen.path}`)
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
      server,
      verifyClient: (info: { origin: string, req: http.IncomingMessage, secure: boolean }) => {
        const protocol = <string | undefined>info.req.headers['sec-websocket-protocol']
        if (protocol === undefined) return false
        const adminProtocol = Options._.server.protocol
        const userData = Options._.user[protocol]
        if (protocol === adminProtocol || (userData !== undefined && userData.status)) return true
        else return false
      }
    })
    this._wsServer
      .on('error', error => tools.ErrorLog('websocket', error))
      .on('connection', (client: ws, req: http.IncomingMessage) => {
        // 使用Nginx可能需要
        const remoteAddress = req.headers['x-real-ip'] === undefined
          ? `${req.connection.remoteAddress}:${req.connection.remotePort}`
          : `${req.headers['x-real-ip']}:${req.headers['x-real-port']}`
        const useragent = req.headers['user-agent']
        const protocol = client.protocol
        const adminProtocol = Options._.server.protocol
        let user: string
        if (protocol === adminProtocol) {
          user = '管理员'
          this._AdminConnectionHandler(client, remoteAddress)
        }
        else {
          user = `用户: ${client.protocol}`
          this._WsConnectionHandler(client, remoteAddress)
        }
        tools.Log(`${user} 地址: ${remoteAddress} 已连接. user-agent: ${useragent}`)
      })
    this._loop = setInterval(() => this._WebSocketPing(), 60 * 1000)
  }
  /**
   * 管理员连接
   *
   * @private
   * @param {ws} client
   * @param {string} remoteAddress
   * @memberof WSServer
   */
  private _AdminConnectionHandler(client: ws, remoteAddress: string) {
    // 限制同时只能连接一个客户端
    if (this._adminClient !== undefined) this._adminClient.close(1001, JSON.stringify({ cmd: 'close', msg: 'too many connections' }))
    client
      .on('error', err => {
        delete tools.logs.onLog
        this._destroyClient(client)
        tools.ErrorLog(client.protocol, remoteAddress, err)
      })
      .on('close', (code, reason) => {
        delete tools.logs.onLog
        this._destroyClient(client)
        tools.Log(`管理员 地址: ${remoteAddress} 已断开`, code, reason)
      })
      .on('message', async (msg: string) => {
        const message = await tools.JSONparse<adminMessage>(msg)
        if (message !== undefined && message.cmd !== undefined && message.ts !== undefined) this._onCMD(message)
        else this._sendtoadmin({ cmd: 'error', ts: 'error', msg: '消息格式错误' })
      })
    this._adminClient = client
    // 日志
    tools.logs.onLog = data => this._sendtoadmin({ cmd: 'log', ts: 'log', msg: data })
  }
  /**
   * 处理连接事件
   *
   * @private
   * @param {ws} client
   * @param {string} remoteAddress
   * @memberof WSServer
   */
  private _WsConnectionHandler(client: ws, remoteAddress: string) {
    const protocol = client.protocol
    const userData = Options._.user[protocol]
    // 分protocol存储
    if (this._clients.has(protocol)) {
      const clients = <Set<ws>>this._clients.get(protocol)
      clients.add(client)
    }
    else {
      const clients = new Set([client])
      this._clients.set(protocol, clients)
    }
    let timeout: NodeJS.Timer
    const setTimeoutError = () => {
      timeout = setTimeout(() => {
        client.emit('close', 4000, 'timeout')
      }, 2 * 60 * 1000)
    }
    client
      .on('error', err => {
        this._destroyClient(client)
        tools.ErrorLog(protocol, remoteAddress, err)
      })
      .on('close', (code, reason) => {
        this._destroyClient(client)
        const clients = <Set<ws>>this._clients.get(protocol)
        clients.delete(client)
        if (clients.size === 0) this._clients.delete(protocol)
        tools.Log(`用户: ${protocol} 地址: ${remoteAddress} 已断开`, code, reason)
      })
      .on('pong', () => {
        clearTimeout(timeout)
        setTimeoutError()
      })
    setTimeoutError()
    // 连接成功消息
    const welcome: message = {
      cmd: 'sysmsg',
      msg: userData.welcome
    }
    client.send(JSON.stringify(welcome), err => { if (err !== undefined) tools.ErrorLog(err) })
  }
  /**
   * 销毁
   *
   * @private
   * @param {ws} client
   * @memberof WSServer
   */
  private _destroyClient(client: ws) {
    client.close()
    client.terminate()
    client.removeAllListeners()
  }
  /**
   * Ping/Pong
   *
   * @private
   * @memberof WSServer
   */
  private _WebSocketPing() {
    this._wsServer.clients.forEach(client => client.ping())
  }
  /**
   * 消息广播
   *
   * @param {string} msg
   * @param {string} [protocol]
   * @memberof WSServer
   */
  public SysMsg(msg: string, protocol?: string) {
    const systemMessage: systemMessage = {
      cmd: 'sysmsg',
      msg
    }
    this._Broadcast(systemMessage, 'sysmsg', protocol)
  }
  /**
   * 节奏风暴
   *
   * @param {beatStormInfo} beatStormInfo
   * @param {string} [protocol]
   * @memberof WSServer
   */
  public BeatStorm(beatStormInfo: message, protocol?: string) {
    this._Broadcast(beatStormInfo, 'beatStorm', protocol)
  }
  /**
   * 小电视
   *
   * @param {raffleMessage} raffleMessage
   * @param {string} [protocol]
   * @memberof WSServer
   */
  public SmallTV(raffleMessage: raffleMessage, protocol?: string) {
    this._Broadcast(raffleMessage, 'smallTV', protocol)
  }
  /**
   * 抽奖raffle
   *
   * @param {raffleMessage} raffleMessage
   * @param {string} [protocol]
   * @memberof WSServer
   */
  public Raffle(raffleMessage: raffleMessage, protocol?: string) {
    this._Broadcast(raffleMessage, 'raffle', protocol)
  }
  /**
   * 抽奖lottery
   *
   * @param {lotteryMessage} lotteryMessage
   * @param {string} [protocol]
   * @memberof WSServer
   */
  public Lottery(lotteryMessage: message, protocol?: string) {
    this._Broadcast(lotteryMessage, 'lottery', protocol)
  }
  /**
   * 广播消息
   *
   * @private
   * @param {message} message
   * @param {string} key
   * @param {string} [protocol]
   * @memberof WSServer
   */
  private _Broadcast(message: message, key: string, protocol?: string) {
    this._clients.forEach((clients, userprotocol) => {
      if (protocol !== undefined && protocol !== userprotocol) return
      const userData = Options._.user[userprotocol]
      if (userData !== undefined && (key === 'sysmsg' || userData[key])) {
        clients.forEach(client => {
          if (client.readyState === ws.OPEN) client.send(JSON.stringify(message), error => { if (error !== undefined) tools.Log(error) })
        })
      }
    })
  }
  /**
   * 监听客户端发来的消息, CMD为关键字
   *
   * @private
   * @param {adminMessage} message
   * @memberof WSServer
   */
  private async _onCMD(message: adminMessage) {
    const { cmd, ts } = message
    switch (cmd) {
      // 获取log
      case 'getLog': {
        const data = tools.logs.data
        this._sendtoadmin({ cmd, ts, data })
      }
        break
      // 获取设置
      case 'getConfig': {
        const data = Options._.config
        this._sendtoadmin({ cmd, ts, data })
      }
        break
      // 保存设置
      case 'setConfig': {
        const config = Options._.config
        const sysmsg = config.sysmsg
        const setConfig = <config>message.data || {}
        let msg = ''
        for (const i in config) {
          if (typeof config[i] !== typeof setConfig[i]) {
            // 一般都是自用, 做一个简单的验证就够了
            msg = i + '参数错误'
            break
          }
        }
        if (msg === '') {
          // 防止setConfig里有未定义属性, 不使用Object.assign
          for (const i in config) config[i] = setConfig[i]
          Options.save()
          this._sendtoadmin({ cmd, ts, data: config })
          if (sysmsg !== config.sysmsg) this.SysMsg(config.sysmsg)
        }
        else this._sendtoadmin({ cmd, ts, msg, data: config })
      }
        break
      // 获取参数描述
      case 'getInfo': {
        const data = Options._.info
        this._sendtoadmin({ cmd, ts, data })
      }
        break
      // 获取uid
      case 'getAllUID': {
        const data = Object.keys(Options._.user)
        this._sendtoadmin({ cmd, ts, data })
      }
        break
      // 获取用户设置
      case 'getUserData': {
        const user = Options._.user
        const getUID = message.uid
        if (typeof getUID === 'string' && user[getUID] !== undefined) this._sendtoadmin({ cmd, ts, uid: getUID, data: user[getUID] })
        else this._sendtoadmin({ cmd, ts, msg: '未知用户' })
      }
        break
      // 保存用户设置
      case 'setUserData': {
        const user = Options._.user
        const setUID = message.uid
        if (setUID !== undefined && user[setUID] !== undefined) {
          const userData = user[setUID]
          const usermsg = userData.usermsg
          const setUserData = <userData>message.data || {}
          let msg = ''
          for (const i in userData) {
            if (typeof userData[i] !== typeof setUserData[i]) {
              msg = i + '参数错误'
              break
            }
          }
          if (msg === '') {
            for (const i in userData) { if (i !== 'userHash') userData[i] = setUserData[i] }
            Options.save()
            this._sendtoadmin({ cmd, ts, uid: setUID, data: userData })
            // 删除已连接用户
            if (!userData.status) {
              if (this._clients.has(setUID)) {
                const clients = <Set<ws>>this._clients.get(setUID)
                clients.forEach(client => this._destroyClient(client))
                this._clients.delete(setUID)
              }
            }
            else if (usermsg !== userData.usermsg) this.SysMsg(userData.usermsg, setUID)
          }
          else this._sendtoadmin({ cmd, ts, uid: setUID, msg, data: userData })
        }
        else this._sendtoadmin({ cmd, ts, uid: setUID, msg: '未知用户' })
      }
        break
      // 删除用户设置
      case 'delUserData': {
        const user = Options._.user
        const delUID = message.uid
        if (delUID !== undefined && user[delUID] !== undefined) {
          const userData = user[delUID]
          delete Options._.user[delUID]
          Options.save()
          this._sendtoadmin({ cmd, ts, uid: delUID, data: userData })
          // 删除已连接用户
          if (this._clients.has(delUID)) {
            const clients = <Set<ws>>this._clients.get(delUID)
            clients.forEach(client => this._destroyClient(client))
            this._clients.delete(delUID)
          }
        }
        else this._sendtoadmin({ cmd, ts, uid: delUID, msg: '未知用户' })
      }
        break
      // 新建用户设置
      case 'newUserData': {
        // 虽然不能保证唯一性, 但是这都能重复的话可以去买彩票
        const uid = randomBytes(16).toString('hex')
        const data = Object.assign({}, Options._.newUserData)
        data.userHash = uid
        Options._.user[uid] = data
        Options.save()
        this._sendtoadmin({ cmd, ts, uid, data })
      }
        break
      // 未知命令
      default:
        this._sendtoadmin({ cmd, ts, msg: '未知命令' })
        break
    }
  }
  /**
   * 向客户端发送消息
   *
   * @private
   * @param {adminMessage} message
   * @memberof WebAPI
   */
  private _sendtoadmin(message: adminMessage) {
    if (this._adminClient.readyState === ws.OPEN) this._adminClient.send(JSON.stringify(message))
  }
}

export default WSServer