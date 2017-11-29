import * as tools from './lib/tools'
import { EventEmitter } from 'events'
import { RoomListModel } from './mongo/roomlist'
import { CommentClient } from './lib/comment_client'
import { SYS_MSG, SYS_GIFT, SPECIAL_GIFT, TV_START, RAFFLE_START, LIGHTEN_START } from './lib/danmaku.type'
/**
 * 监听房间消息
 * 
 * @export
 * @class RoomListener
 * @extends {EventEmitter}
 */
export class RoomListener extends EventEmitter {
  constructor() {
    super()
  }
  /**
   * 监控房间
   * 
   * @type {Map<number, CommentClient>}
   * @memberof RoomListener
   */
  public roomList: Map<number, CommentClient> = new Map()
  /**
   * 开始监听
   * 
   * @memberof RoomListener
   */
  public Start() {
    this._AddDBRoom()
  }
  /**
   * 添加数据库内房间
   * 
   * @private
   * @param {number} [beatStorm=0] 
   * @param {number} [date=2.592e+9] 
   * @memberof RoomListener
   */
  private async _AddDBRoom(beatStorm = 0, date = 2.592e+9) {
    let roomList = await RoomListModel.find({ 'beatStorm': { '$gt': beatStorm }, 'updateTime': { '$gt': Date.now() - date } }).exec().catch(tools.Error)
    if (roomList != null) {
      let liveList: Set<number> = new Set()
      roomList.forEach(room => liveList.add(room.roomID))
      liveList.forEach(roomID => this.AddRoom(roomID))
      this.roomList.forEach((commentClient, roomID) => {
        if (liveList.has(roomID)) return
        commentClient
          .removeAllListeners()
          .Close()
        this.roomList.delete(roomID)
      })
    }
    setTimeout(() => {
      this._AddDBRoom()
    }, 6.048e+8) // 7天
  }
  /**
   * 添加直播房间
   * 
   * @param {number} roomID 
   * @memberof RoomListener
   */
  public AddRoom(roomID: number) {
    if (this.roomList.has(roomID)) return
    let commentClient = new CommentClient({ roomID, protocol: 'ws' })
    commentClient
      .on('SPECIAL_GIFT', this._SpecialGiftHandler.bind(this))
      .on('TV_START', this._SmallTVHandler.bind(this))
      .on('RAFFLE_START', this._RaffleStartHandler.bind(this))
      .on('LIGHTEN_START', this._LightenStartHandler.bind(this))
      .Connect({ server: 'broadcastlv.chat.bilibili.com', port: 2244 })
    this.roomList.set(roomID, commentClient)
  }
  /**
   * 监听特殊礼物消息
   * 
   * @private
   * @param {SPECIAL_GIFT} dataJson
   * @memberof RoomListener
   */
  private _SpecialGiftHandler(dataJson: SPECIAL_GIFT) {
    for (let giftID in dataJson.data) {
      switch (giftID) {
        case '39':
          this._BeatStormHandler(dataJson)
          break
        default:
          break
      }
    }
  }
  /**
   * 监听节奏风暴消息
   * 
   * @private
   * @param {SPECIAL_GIFT} dataJson
   * @memberof RoomListener
   */
  private _BeatStormHandler(dataJson: SPECIAL_GIFT) {
    let beatStormData = dataJson.data['39']
    if (beatStormData.content != null) {
      let beatStormInfo: beatStormInfo = {
        roomID: dataJson._roomid,
        content: beatStormData.content,
        id: parseInt(beatStormData.id),
        rawData: dataJson
      }
      this.emit('beatStorm', beatStormInfo)
    }
  }
  /**
   * 监听小电视消息
   * 
   * @private
   * @param {TV_START} dataJson
   * @memberof RoomListener
   */
  private _SmallTVHandler(dataJson: TV_START) {
    let smallTVInfo: smallTVInfo = {
      roomID: dataJson._roomid,
      id: parseInt(dataJson.data.id),
      rawData: dataJson.data.msg
    }
    this.emit('smallTV', smallTVInfo)
  }
  /**
   * 监听抽奖
   * 
   * @private
   * @param {RAFFLE_START} dataJson
   * @memberof RoomListener
   */
  private _RaffleStartHandler(dataJson: RAFFLE_START) {
    if (dataJson.data == null || dataJson.data.raffleId == null) return
    let raffleInfo: raffleInfo = {
      roomID: dataJson._roomid,
      id: dataJson.data.raffleId,
      rawData: dataJson
    }
    this.emit('raffle', raffleInfo)
  }
  /**
   * 监听快速抽奖
   * 
   * @private
   * @param {LIGHTEN_START} dataJson
   * @memberof RoomListener
   */
  private _LightenStartHandler(dataJson: LIGHTEN_START) {
    if (dataJson.data == null || dataJson.data.lightenId == null) return
    let lightenInfo: lightenInfo = {
      roomID: dataJson._roomid,
      id: dataJson.data.lightenId,
      rawData: dataJson
    }
    this.emit('lighten', lightenInfo)
  }
}
/**
 * 节奏风暴信息
 * 
 * @export
 * @interface beatStormInfo
 */
export interface beatStormInfo {
  roomID: number
  content: string
  id: number
  rawData: SPECIAL_GIFT
}
/**
 * 小电视信息
 * 
 * @export
 * @interface smallTVInfo
 */
export interface smallTVInfo {
  roomID: number
  id: number
  pathname?: string
  rawData: SYS_MSG
}
/**
 * 抽奖信息
 * 
 * @export
 * @interface raffleInfo
 */
export interface raffleInfo {
  roomID: number
  id: number
  pathname?: string
  rawData: SYS_GIFT | RAFFLE_START
}
/**
 * 快速抽奖信息
 * 
 * @export
 * @interface LightenInfo
 */
export interface lightenInfo {
  roomID: number
  id: number
  pathname?: string
  rawData: SYS_GIFT | LIGHTEN_START
}