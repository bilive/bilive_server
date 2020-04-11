import tools from './lib/tools'
import Client from './client_re'
import WSServer from './wsserver'
import Options from './options'
/**
 * 主程序
 *
 * @export
 * @class BiLive
 */
class BiLive {
  constructor() {
  }
  private _WSServer!: WSServer
  /**
   * 开始主程序
   *
   * @memberof BiLive
   */
  public async Start() {
    // 开启监听
    this._WSServer = new WSServer()
    this._WSServer.Start()
    this.Listener()
  }
  /**
   * 监听系统消息
   *
   * @memberof BiLive
   */
  public Listener() {
    const { 0: server, 1: protocol } = Options._.config.serverURL.split('#')
    if (protocol !== undefined && protocol !== '') this._RoomListener(server, protocol)
    // 房间监控
    tools.on('roomListener', (message: message) => {
      switch (message.cmd) {
        case 'raffle':
          this._WSServer.Raffle(message)
          break
        case 'lottery':
          this._WSServer.Lottery(message)
          break
        case 'pklottery':
          this._WSServer.PKLottery(message)
          break
        case 'beatStorm':
          this._WSServer.BeatStorm(message)
          break
        case 'anchorLot':
          this._WSServer.AchorLot(message)
          break
        case 'boxActivity':
          this._WSServer.BoxActivity(message)
          break
        case 'sysmsg':
          tools.Log('服务器消息:', message.msg)
          break
      }
    })
  }
  /**
   * 房间监听
   *
   * @private
   * @param {string} server
   * @param {string} protocol
   * @memberof BiLive
   */
  private _RoomListener(server: string, protocol: string) {
    const client = new Client(server, protocol)
    client.Connect()
    Options.on('clientUpdate', () => client.Update())
  }
}

export default BiLive