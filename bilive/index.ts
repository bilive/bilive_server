import WSServer from './wsserver'
import Listener from './listener'

/**
 * 主程序
 *
 * @export
 * @class BiLive
 */
class BiLive {
  constructor() {
  }
  private _Listener!: Listener
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
    this._Listener = new Listener()
    this._Listener
      .on('smallTV', raffleMessage => this._WSServer.SmallTV(raffleMessage))
      .on('raffle', raffleMessage => this._WSServer.Raffle(raffleMessage))
      .on('lottery', lotteryMessage => this._WSServer.Lottery(lotteryMessage))
      .on('beatStorm', beatStormMessage => this._WSServer.BeatStorm(beatStormMessage))
      .Start()
  }
}

export default BiLive