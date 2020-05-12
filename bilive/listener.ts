import { EventEmitter } from 'events'
import tools from './lib/tools'
import AppClient from './lib/app_client'
import DMclient from './dm_client_re'
import RoomListener from './roomlistener'
/**
 * 监听服务器消息
 *
 * @class Listener
 * @extends {EventEmitter}
 */
class Listener extends EventEmitter {
  constructor() {
    super()
  }
  /**
   * 用于接收弹幕消息
   *
   * @private
   * @type {Map<number, DMclient>}
   * @memberof Listener
   */
  private _DMclient: Map<number, DMclient> = new Map()
  /**
   * 抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _raffleID: Set<number> = new Set()
  /**
   * 快速抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _lotteryID: Set<number> = new Set()
  /**
   * 大乱斗抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _pklotteryID: Set<number> = new Set()
  /**
   * 节奏风暴ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _beatStormID: Set<number> = new Set()
  /**
   * 天选时刻ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _anchorLotID: Set<number> = new Set()
  /**
   * 宝箱抽奖ID
   *
   * @private
   * @type {Set<number>}
   * @memberof Listener
   */
  private _boxActivityID: Set<number> = new Set()
  /**
   * 消息缓存
   *
   * @private
   * @type {Set<string>}
   * @memberof Listener
   */
  private _MSGCache: Set<string> = new Set()
  /**
   * 抽奖更新时间
   *
   * @private
   * @type {number}
   * @memberof Listener
   */
  private _lastUpdate: number = Date.now()
  /**
   * 房间监听
   *
   * @private
   * @type {RoomListener}
   * @memberof Listener
   */
  private _RoomListener!: RoomListener
  //@ts-ignore
  private _loop: NodeJS.Timer
  //@ts-ignore
  private _updateRoomTimer: NodeJS.Timer
  /**
   * 开始监听
   *
   * @memberof Listener
   */
  public Start() {
    this.updateAreaRoom()
    // 3s清空一次消息缓存
    this._loop = setInterval(() => this._MSGCache.clear(), 3 * 1000)
    // 10min更新一次房间
    this._updateRoomTimer = setInterval(() => {
      this.updateAreaRoom()
    }, 10 * 60 * 1000)
    // 房间
    this._RoomListener = new RoomListener()
    this._RoomListener
      .on('raffle', (raffleMessage: raffleMessage) => this._RaffleHandler(raffleMessage))
      .on('lottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
      .on('pklottery', (lotteryMessage: lotteryMessage) => this._RaffleHandler(lotteryMessage))
      .on('beatStorm', (beatStormMessage: beatStormMessage) => this._RaffleHandler(beatStormMessage))
      .on('anchorLot', (anchorLotMessage: anchorLotMessage) => this._RaffleHandler(anchorLotMessage))
      .on('boxActivity', (boxActivityMessage: boxActivityMessage) => this._RaffleHandler(boxActivityMessage))
      .Start()
  }
  /**
   * 更新分区房间
   *
   * @memberof Listener
   */
  public async updateAreaRoom() {
    // 获取直播列表
    const getAllList = await tools.XHR<getAllList>({
      uri: `https://api.live.bilibili.com/room/v2/AppIndex/getAllList?${AppClient.signQueryBase()}`,
      json: true
    }, 'Android')
    if (getAllList !== undefined && getAllList.response.statusCode === 200 && getAllList.body.code === 0) {
      const roomIDs: Set<number> = new Set()
      // 获取房间列表
      getAllList.body.data.module_list.forEach(modules => {
        if (modules.module_info.type === 9 && modules.list.length > 2) {
          for (let i = 0; i < 3; i++) roomIDs.add((<getAllListDataRoomList>modules.list[i]).roomid)
        }
      })
      // 添加房间
      roomIDs.forEach(roomID => {
        if (this._DMclient.has(roomID)) return
        const newDMclient = new DMclient({ roomID })
        newDMclient
          .on('NOTICE_MSG', dataJson => this._RaffleCheck(dataJson))
          .Connect()
        this._DMclient.set(roomID, newDMclient)
      })
      // 移除房间
      this._DMclient.forEach((roomDM, roomID) => {
        if (roomIDs.has(roomID)) return
        roomDM.removeAllListeners().Close()
        this._DMclient.delete(roomID)
      })
    }
  }
  /**
   * 清空所有ID缓存
   *
   * @memberof Listener
   */
  public clearAllID() {
    if (Date.now() - this._lastUpdate < 3 * 60 * 1000) return
    this._beatStormID.clear()
    this._raffleID.clear()
    this._lotteryID.clear()
  }
  /**
   * 检查房间抽奖raffle信息
   *
   * @private
   * @param {NOTICE_MSG} dataJson
   * @memberof Listener
   */
  private async _RaffleCheck(dataJson: NOTICE_MSG) {
    if (dataJson.real_roomid === undefined || this._MSGCache.has(dataJson.msg_common)) return
    this._MSGCache.add(dataJson.msg_common)
    const roomID = dataJson.real_roomid
    // 等待3s, 防止土豪刷屏
    await tools.Sleep(3000)
    const _lotteryInfo: XHRoptions = {
      uri: `https://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfo?${AppClient.signQueryBase(`roomid=${roomID}`)}`,
      json: true
    }
    const lotteryInfo = await tools.XHR<lotteryInfo>(_lotteryInfo, 'Android')
    if (lotteryInfo !== undefined && lotteryInfo.response.statusCode === 200
      && lotteryInfo.body.code === 0 && lotteryInfo.body.data.gift_list.length > 0) {
      lotteryInfo.body.data.gift_list.forEach(data => {
        const message: message = {
          cmd: 'raffle',
          roomID,
          id: +data.raffleId,
          type: data.type,
          title: data.title,
          time: +data.time_wait,
          max_time: +data.max_time,
          time_wait: +data.time_wait,
          raw: ''
        }
        this._RaffleHandler(message)
      })
    }
  }
  /**
   * 监听抽奖消息
   *
   * @private
   * @param {raffleMessage | lotteryMessage | beatStormMessage | anchorLotMessage | boxActivityMessage} raffleMessage
   * @memberof Listener
   */
  private _RaffleHandler(raffleMessage: raffleMessage | lotteryMessage | beatStormMessage | anchorLotMessage | boxActivityMessage) {
    const { cmd, id, roomID } = raffleMessage
    switch (cmd) {
      case 'raffle':
        if (this._raffleID.has(id)) return
        this._raffleID.add(id)
        break
      case 'lottery':
        if (this._lotteryID.has(id)) return
        this._lotteryID.add(id)
        break
      case 'pklottery':
        if (this._pklotteryID.has(id)) return
        this._pklotteryID.add(id)
        break
      case 'beatStorm':
        if (this._beatStormID.has(id)) return
        this._beatStormID.add(id)
        break
      case 'anchorLot':
        if (this._anchorLotID.has(id)) return
        this._anchorLotID.add(id)
        break
      case 'boxActivity':
        if (this._boxActivityID.has(id)) return
        this._boxActivityID.add(id)
        break
      default:
        return
    }
    // 更新时间
    this._lastUpdate = Date.now()
    this.clearAllID()
    this.emit(cmd, raffleMessage)
    this._RoomListener.AddRoom(roomID)
    tools.Log(`房间 ${roomID} 开启了第 ${id} 轮${raffleMessage.title}`)
    this._RoomListener.UpdateDB(roomID, cmd)
  }
}
export default Listener