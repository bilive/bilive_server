import * as mongoose from 'mongoose'
import * as request from 'request'
import * as tools from './lib/tools'
import { RoomListModel } from './mongo/roomlist'
import { ApiPathModel, apiPath } from './mongo/apipath'
import { RoomListener, beatStormInfo, smallTVInfo, raffleInfo, lightenInfo } from './roomlistener'
import { SYSMSGListener } from './sysmsglistener'
import { WSServer } from './wsserver'
/**
 * 主程序
 * 
 * @export
 * @class BiLive
 */
export class BiLive {
  constructor() {
  }
  public RoomListener: RoomListener
  public SYSMSGListener: SYSMSGListener
  private _WSServer: WSServer
  private _smallTVID: number = 0
  private _raffleID: number = 0
  private _lightenID: number = 0
  private _beatStormID: number = 0
  /**
   * 开始主程序
   * 
   * @memberof BiLive
   */
  public async Start() {
    options = await tools.Options();
    // 数据库
    (<any>mongoose).Promise = global.Promise
    mongoose.connect(options.mongodb, {
      useMongoClient: true,
      promiseLibrary: global.Promise
    })
    mongoose.connection
      .on('error', tools.Log)
      .once('open', async () => {
        // 更新api地址
        await this._Loop()
        // 开启监听
        this._WSServer = new WSServer()
        this._WSServer.Start()
        this.SRoomListener()
        this.SSYSMSGListener()
        tools.Log('mongodb opened')
      })
  }
  /**
   * 循环
   * 
   * @private
   * @memberof BiLive
   */
  private async _Loop() {
    let apiPath = await ApiPathModel.findOne().exec().catch(tools.Error)
    if (apiPath != null) Object.assign(options, apiPath)
    setTimeout(() => {
      this._Loop()
    }, 6e+4) // 60秒
  }
  /**
   * 监听房间消息
   * 
   * @memberof BiLive
   */
  public SRoomListener() {
    this.RoomListener = new RoomListener()
    this.RoomListener
      .on('beatStorm', this._BeatStormHandler.bind(this))
      .on('smallTV', this._SmallTVHandler.bind(this))
      .on('lighten', this._LightenHandler.bind(this))
      .on('raffle', this._RaffleHandler.bind(this))
      .Start()
  }
  /**
   * 监听系统消息
   * 
   * @memberof BiLive
   */
  public SSYSMSGListener() {
    this.SYSMSGListener = new SYSMSGListener()
    this.SYSMSGListener
      .on('smallTV', this._SmallTVHandler.bind(this))
      .on('lighten', this._LightenHandler.bind(this))
      .on('raffle', this._RaffleHandler.bind(this))
      .on('sysGift', roomID => { this.RoomListener.AddRoom(roomID) })
      .Start()
  }
  /**
   * 监听节奏风暴事件
   * 
   * @private
   * @param {beatStormInfo} beatStormInfo
   * @memberof BiLive
   */
  private _BeatStormHandler(beatStormInfo: beatStormInfo) {
    if (this._beatStormID >= beatStormInfo.id) return
    this._WSServer.BeatStorm(beatStormInfo)
    this._UpdateDB(beatStormInfo.roomID, 'beatStorm')
  }
  /**
   * 监听小电视事件
   * 
   * @private
   * @param {smallTVInfo} smallTVInfo
   * @memberof BiLive
   */
  private _SmallTVHandler(smallTVInfo: smallTVInfo) {
    if (this._smallTVID >= smallTVInfo.id) return
    this.RoomListener.AddRoom(smallTVInfo.roomID)
    this._WSServer.SmallTV(smallTVInfo)
    this._UpdateDB(smallTVInfo.roomID, 'smallTV')
  }
  /**
   * 监听抽奖事件
   * 
   * @private
   * @param {raffleInfo} raffleInfo
   * @memberof BiLive
   */
  private _RaffleHandler(raffleInfo: raffleInfo) {
    if (this._raffleID >= raffleInfo.id) return
    this.RoomListener.AddRoom(raffleInfo.roomID)
    raffleInfo.pathname = options.raffle
    this._WSServer.Raffle(raffleInfo)
    this._UpdateDB(raffleInfo.roomID, 'raffle')
  }
  /**
   * 监听快速抽奖事件
   * 
   * @private
   * @param {lightenInfo} lightenInfo
   * @memberof BiLive
   */
  private _LightenHandler(lightenInfo: lightenInfo) {
    if (this._lightenID >= lightenInfo.id) return
    this.RoomListener.AddRoom(lightenInfo.roomID)
    this._WSServer.Lighten(lightenInfo)
    this._UpdateDB(lightenInfo.roomID, 'raffle')
  }
  /**
   * 写入数据库
   * 
   * @private
   * @param {number} roomID 
   * @param {string} cmd 
   * @memberof BiLive
   */
  private async _UpdateDB(roomID: number, cmd: string) {
    let $inc: { [index: string]: number } = {}
      , $set
      , roomInfo = await RoomListModel.findOne({ roomID }).exec().catch(tools.Error)
    $inc[cmd] = 1
    if (roomInfo == null) {
      let getRoomInit: request.Options = {
        uri: `${options.origin}/room/v1/Room/room_init?id=${roomID}}`,
        json: true,
        headers: {
          'Referer': `https://live.bilibili.com/${roomID}`
        }
      }
        , roomInit = await tools.XHR<roomInit>(getRoomInit).catch(tools.Error)
      if (roomInit != null && roomInit.body.data != null) {
        let masterID = roomInit.body.data.uid
        $set = { masterID, 'updateTime': Date.now() }
      }
    }
    if ($set == null) $set = { 'updateTime': Date.now() }
    RoomListModel.findOneAndUpdate({ roomID }, { $inc, $set }, { upsert: true }).exec().catch(tools.Error)
  }
}
export let options: options
/**
 * 应用设置
 * 
 * @export
 * @interface options
 */
export interface options extends apiPath {
  mongodb: string
  path: string
  hostname: string
  port: number
}
interface roomInit {
  code: number
  msg: string
  message: string
  data: roomInit_Data
}
interface roomInit_Data {
  encrypted: boolean
  hidden_till: number
  is_hidden: boolean
  is_locked: boolean
  lock_till: number
  need_p2p: number
  pwd_verified: boolean
  room_id: number
  short_id: number
  uid: number
}