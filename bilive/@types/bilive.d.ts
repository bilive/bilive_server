/*******************
 ****** index ******
 *******************/
/**
 * 应用设置
 *
 * @interface options
 */
interface options {
  server: server
  config: config
  user: userCollection
  newUserData: userData
  info: optionsInfo
}
interface server {
  path: string
  hostname: string
  port: number
  protocol: string
}
interface config {
  [index: string]: string | string[]
  serverURL: string
  sysmsg: string
}
interface userCollection {
  [index: string]: userData
}
interface userData {
  [index: string]: string | boolean
  status: boolean
  userHash: string
  welcome: string
  usermsg: string
  smallTV: boolean
  raffle: boolean
  lottery: boolean
  beatStorm: boolean
}
interface optionsInfo {
  [index: string]: configInfoData
  serverURL: configInfoData
  sysmsg: configInfoData
  status: configInfoData
  userHash: configInfoData
  welcome: configInfoData
  usermsg: configInfoData
  smallTV: configInfoData
  raffle: configInfoData
  lottery: configInfoData
  beatStorm: configInfoData
}
interface configInfoData {
  description: string
  tip: string
  type: string
  cognate?: string
}
/*******************
 ** bilive_client **
 *******************/
/**
 * 消息格式
 *
 * @interface raffleMessage
 */
interface raffleMessage {
  cmd: 'smallTV' | 'raffle'
  roomID: number
  id: number
  type: string
  title: string
  time: number
  max_time: number
  time_wait: number
}
/**
 * 消息格式
 *
 * @interface lotteryMessage
 */
interface lotteryMessage {
  cmd: 'lottery'
  roomID: number
  id: number
  type: string
  title: string
  time: number
}
/**
 * 消息格式
 *
 * @interface beatStormMessage
 */
interface beatStormMessage {
  cmd: 'beatStorm'
  roomID: number
  id: number
  type: string
  title: string
  time: number
}
/**
 * 消息格式
 *
 * @interface systemMessage
 */
interface systemMessage {
  cmd: 'sysmsg'
  msg: string
}
type message = raffleMessage | lotteryMessage | beatStormMessage | systemMessage
/*******************
 ***** wsserver ****
 *******************/
/**
 * WebSocket消息
 *
 * @interface clientMessage
 */
interface adminMessage {
  cmd: string
  ts: string
  msg?: string
  uid?: string
  data?: config | optionsInfo | string[] | userData
}