import db from './db'
import tools from './lib/tools'
import DMclient from './dm_client_re'
import Options from './options'
import { EventEmitter } from 'events'
/**
 * 监听房间消息
 *
 * @class RoomListener
 * @extends {EventEmitter}
 */
class RoomListener extends EventEmitter {
  constructor() {
    super()
    // 防止api访问过快
    this.Timer = setInterval(() => {
      const roomID = this._roomList.shift()
      if (roomID !== undefined) this._AddRoom(roomID)
    }, 100)
  }
  public Timer: NodeJS.Timer
  /**
   * 监控房间
   *
   * @type {Map<number, DMclient>}
   * @memberof RoomListener
   */
  public roomList: Map<number, DMclient> = new Map()
  protected _roomList: number[] = []
  /**
   * 开始监听
   *
   * @memberof RoomListener
   */
  public async Start() {
    const load = await db.roomList.load()
    if (load === null) {
      tools.Log('roomList was loaded')
      this._AddDBRoom()
    }
    else tools.ErrorLog(load)
  }
  /**
   * 添加数据库内房间
   *
   * @private
   * @param {number} [date=30 * 24 * 60 * 60 * 1000]
   * @memberof RoomListener
   */
  private async _AddDBRoom(date = 30 * 24 * 60 * 60 * 1000) {
    const roomList = await db.roomList.find<roomList>({ updateTime: { $gt: Date.now() - date } })
    if (roomList instanceof Error) tools.ErrorLog('读取数据库失败', roomList)
    else {
      const liveList: Set<number> = new Set()
      roomList.forEach(room => {
        liveList.add(room.roomID)
        this.AddRoom(room.roomID, room.masterID)
      })
      this.roomList.forEach((commentClient, roomID) => {
        if (liveList.has(roomID)) return
        commentClient
          .removeAllListeners()
          .Close()
        this.roomList.delete(roomID)
      })
    }
    setTimeout(() => this._AddDBRoom(), 7 * 24 * 60 * 60 * 1000)
  }
  /**
   * 添加直播房间
   *
   * @param {number} roomID
   * @param {number} [_userID=0]
   * @memberof RoomListener
   */
  public AddRoom(roomID: number, _userID: number = 0) {
    if (this._roomList.includes(roomID) || this.roomList.has(roomID)) return
    this._roomList.push(roomID)
  }
  protected _AddRoom(roomID: number, _userID: number = 0) {
    if (this.roomList.has(roomID)) return
    const commentClient = new DMclient({ roomID })
    commentClient
      .on('TV_START', dataJson => this._RaffleStartHandler(dataJson))
      .on('RAFFLE_START', dataJson => this._RaffleStartHandler(dataJson))
      .on('LOTTERY_START', dataJson => this._LotteryStartHandler(dataJson))
      .on('PK_LOTTERY_START', dataJson => this._PKLotteryStartHandler(dataJson))
      .on('GUARD_LOTTERY_START', dataJson => this._LotteryStartHandler(dataJson))
      .on('SPECIAL_GIFT', dataJson => this._SpecialGiftHandler(dataJson))
      .on('ANCHOR_LOT_START', dataJson => this._AnchorLotHandler(dataJson))
      .on('BOX_ACTIVITY_START', dataJson => this._BoxActivityHandler(dataJson))
      .on('ALL_MSG', dataJson => {
        if (!Options._.config.excludeCMD.includes(dataJson.cmd)) {
          Options._.config.excludeCMD.push(dataJson.cmd)
          tools.Log(JSON.stringify(dataJson))
        }
      })
      .Connect()
    this.roomList.set(roomID, commentClient)
  }
  /**
   * 监听抽奖
   *
   * @private
   * @param {RAFFLE_START} dataJson
   * @memberof RoomListener
   */
  private _RaffleStartHandler(dataJson: RAFFLE_START) {
    if (dataJson.data === undefined || dataJson.data.raffleId === undefined) return
    const raffleMessage: raffleMessage = {
      cmd: 'raffle',
      roomID: dataJson._roomid,
      id: +dataJson.data.raffleId,
      type: dataJson.data.type,
      title: dataJson.data.title,
      time: +dataJson.data.time,
      max_time: +dataJson.data.max_time,
      time_wait: +dataJson.data.time_wait,
      raw: dataJson
    }
    this.emit('raffle', raffleMessage)
  }
  /**
   * 监听快速抽奖
   *
   * @private
   * @param {LOTTERY_START} dataJson
   * @memberof RoomListener
   */
  private _LotteryStartHandler(dataJson: LOTTERY_START) {
    if (dataJson.data === undefined || dataJson.data.id === undefined) return
    const lotteryMessage: lotteryMessage = {
      cmd: 'lottery',
      roomID: dataJson._roomid,
      id: +dataJson.data.id,
      type: dataJson.data.type,
      title: '舰队抽奖',
      time: +dataJson.data.lottery.time,
      raw: dataJson
    }
    this.emit('lottery', lotteryMessage)
  }
  /**
   * 监听大乱斗抽奖
   *
   * @private
   * @param {PK_LOTTERY_START} dataJson
   * @memberof RoomListener
   */
  private _PKLotteryStartHandler(dataJson: PK_LOTTERY_START) {
    if (dataJson.data === undefined || dataJson.data.id === undefined) return
    const raffleMessage: lotteryMessage = {
      cmd: 'pklottery',
      roomID: dataJson._roomid,
      id: +dataJson.data.id,
      type: 'pk',
      title: dataJson.data.title,
      time: +dataJson.data.time,
      raw: dataJson
    }
    this.emit('pklottery', raffleMessage)
  }
  /**
   * 监听特殊礼物消息
   *
   * @private
   * @param {SPECIAL_GIFT} dataJson
   * @memberof RoomListener
   */
  private _SpecialGiftHandler(dataJson: SPECIAL_GIFT) {
    if (dataJson.data['39'] !== undefined) this._BeatStormHandler(dataJson)
  }
  /**
   * 监听节奏风暴消息
   *
   * @private
   * @param {SPECIAL_GIFT} dataJson
   * @memberof RoomListener
   */
  private _BeatStormHandler(dataJson: SPECIAL_GIFT) {
    const beatStormData = dataJson.data['39']
    // @ts-ignore
    if (beatStormData.content !== undefined) {
      const beatStormMessage: beatStormMessage = {
        cmd: 'beatStorm',
        roomID: dataJson._roomid,
        id: +beatStormData.id,
        type: 'beatStorm',
        title: '节奏风暴',
        // @ts-ignore
        time: beatStormData.time,
        raw: dataJson
      }
      this.emit('beatStorm', beatStormMessage)
    }
  }
  /**
   * 监听天选时刻消息
   *
   * @private
   * @param {ANCHOR_LOT_START} dataJson
   * @memberof RoomListener
   */
  private _AnchorLotHandler(dataJson: ANCHOR_LOT_START) {
    if (dataJson.data === undefined || dataJson.data.id === undefined) return
    const anchorLotMessage: anchorLotMessage = {
      cmd: 'anchorLot',
      roomID: dataJson._roomid,
      id: +dataJson.data.id,
      title: dataJson.data.award_name,
      raw: dataJson
    }
    this.emit('anchorLot', anchorLotMessage)
  }
  /**
   * 监听宝箱抽奖消息
   *
   * @private
   * @param {BOX_ACTIVITY_START} dataJson
   * @memberof RoomListener
   */
  private _BoxActivityHandler(dataJson: BOX_ACTIVITY_START) {
    if (dataJson.data === undefined || dataJson.data.activity_id === undefined) return
    const boxActivityMessage: boxActivityMessage = {
      cmd: 'boxActivity',
      roomID: dataJson._roomid,
      id: +dataJson.data.activity_id,
      title: dataJson.data.title,
      raw: dataJson
    }
    this.emit('boxActivity', boxActivityMessage)
  }
  /**
   * 写入数据库
   *
   * @param {number} roomID
   * @param {string} cmd
   * @memberof RoomListener
   */
  public async UpdateDB(roomID: number, cmd: string) {
    const $inc: { [index: string]: number } = {}
    $inc[cmd] = 1
    const roomInfo = await db.roomList.findOne<roomList>({ roomID })
    let $set
    if (!(roomInfo instanceof Error) && (roomInfo === null || roomInfo.masterID === 0)) {
      const masterID = await this._getMasterID(roomID)
      $set = { masterID, updateTime: Date.now() }
    }
    if ($set === undefined) $set = { updateTime: Date.now() }
    const update = await db.roomList.update({ roomID }, { $inc, $set }, { upsert: true })
    if (update instanceof Error) tools.ErrorLog('更新数据库失败', update)
  }
  /**
   * 获取masterID
   *
   * @private
   * @param {number} roomID
   * @returns {Promise<number>}
   * @memberof RoomListener
   */
  private async _getMasterID(roomID: number): Promise<number> {
    const getRoomInit: XHRoptions = {
      uri: `https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=${roomID}}`,
      json: true
    }
    const roomInit = await tools.XHR<roomInit>(getRoomInit, 'Android')
    if (roomInit !== undefined && roomInit.response.statusCode === 200)
      return roomInit.body.data.uid
    return 0
  }
}
export default RoomListener