import * as tools from './lib/tools'
import * as request from 'request'
import { EventEmitter } from 'events'
import { RoomIDModel } from './mongo/roomid'
import { options } from './index'
import { smallTVInfo, raffleInfo, lightenInfo } from './roomlistener'
import { CommentClient } from './lib/comment_client'
import { SYS_MSG, SYS_GIFT } from './lib/danmaku.type'
/**
 * 监听系统消息
 * 
 * @export
 * @class SYSMSGListener
 * @extends {EventEmitter}
 */
export class SYSMSGListener extends EventEmitter {
  constructor() {
    super()
  }
  /**
   * 用于接收系统消息
   * 
   * @private
   * @type {CommentClient}
   * @memberof SYSMSGListener
   */
  private _CommentClient: CommentClient
  /**
   * 开始监听系统消息
   * 
   * @memberof SYSMSGListener
   */
  public Start() {
    this._CommentClient = new CommentClient({ protocol: 'ws' })
    this._CommentClient
      .on('SYS_MSG', this._SYSMSGHandler.bind(this))
      .on('SYS_GIFT', this._SYSGiftHandler.bind(this))
      .on('serverError', tools.Log)
      .Connect()
  }
  /**
   * 监听系统消息
   * 
   * @private
   * @param {SYS_MSG} dataJson
   * @memberof SYSMSGListener
   */
  private _SYSMSGHandler(dataJson: SYS_MSG) {
    if (dataJson.real_roomid == null || dataJson.tv_id == null) return
    let smallTVInfo: smallTVInfo = {
      roomID: dataJson.real_roomid,
      id: parseInt(dataJson.tv_id),
      rawData: dataJson
    }
    this.emit('smallTV', smallTVInfo)
  }
  /**
   * 监听系统礼物消息
   * 
   * @private
   * @param {SYS_GIFT} dataJson
   * @memberof SYSMSGListener
   */
  private async _SYSGiftHandler(dataJson: SYS_GIFT) {
    if (dataJson.real_roomid != null && dataJson.giftId === 103) {
      let roomID = dataJson.real_roomid
        , check: request.Options = {
          uri: `${options.origin}/${options.raffle}/check?roomid=${roomID}&_=${Date.now()}`,
          json: true,
          headers: {
            'Referer': `https://live.bilibili.com/${roomID}`
          }
        }
        , raffle = await tools.XHR<raffleCheck>(check).catch(tools.Error)
      if (raffle != null && raffle.body != null) {
        let raffleCheck = raffle.body
        if (raffleCheck.code === 0 && raffleCheck.data.length > 0) {
          raffleCheck.data.forEach(value => {
            let raffleInfo: raffleInfo = {
              roomID,
              id: value.raffleId,
              rawData: dataJson
            }
            this.emit('raffle', raffleInfo)
          })
        }
      }
    }
    else if (dataJson.real_roomid != null && dataJson.giftId === 84) {
      let apiData = await RoomIDModel.findOne({ shortRoomID: dataJson.roomid }).exec().catch(tools.Error)
        , roomID = apiData ? apiData.roomID : dataJson.roomid
        , check: request.Options = {
          uri: `${options.origin}/${options.lighten}/getLiveInfo?roomid=${roomID}&_=${Date.now()}`,
          json: true,
          headers: {
            'Referer': `https://live.bilibili.com/${roomID}`
          }
        }
        , lighten = await tools.XHR<lightenCheck>(check).catch(tools.Error)
      if (lighten != null && lighten.body != null) {
        let lightenCheck = lighten.body
        if (lightenCheck.code === 0 && lightenCheck.data.length > 0) {
          lightenCheck.data.forEach(value => {
            let lightenInfo: lightenInfo = {
              roomID,
              id: value.lightenId,
              rawData: dataJson
            }
            this.emit('lighten', lightenInfo)
          })
        }
      }
    }
    else if (dataJson.msg_text != null) {
      let roomID = dataJson.msg_text.match(/直播间(\d+)内/)
      if (roomID != null) this.emit('sysGift', parseInt(roomID[1]))
    }
  }
}
/**
 * 抽奖检查
 * 
 * @export
 * @interface raffleCheck
 */
export interface raffleCheck {
  code: number
  msg: string
  message: string
  data: raffleCheck_Data[]
}
export interface raffleCheck_Data {
  form: string
  raffleId: number
  status: boolean
  time: number
  type: string
}
/**
 * 快速抽奖检查
 * 
 * @export
 * @interface lightenCheck
 */
export interface lightenCheck {
  code: number
  msg: string
  message: string
  data: lightenCheck_Data[]
}
export interface lightenCheck_Data {
  type: string
  lightenId: number
  time: number
  status: boolean
}