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
  liveOrigin: string
  apiVCOrigin: string
  apiLiveOrigin: string
  excludeCMD: string[]
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
  pklottery: boolean
  beatStorm: boolean
}
interface optionsInfo {
  [index: string]: configInfoData
  liveOrigin: configInfoData
  apiVCOrigin: configInfoData
  apiLiveOrigin: configInfoData
  smallTVPathname: configInfoData
  rafflePathname: configInfoData
  lotteryPathname: configInfoData
  excludeCMD: configInfoData
  sysmsg: configInfoData
  status: configInfoData
  userHash: configInfoData
  welcome: configInfoData
  usermsg: configInfoData
  smallTV: configInfoData
  raffle: configInfoData
  lottery: configInfoData
  pklottery: configInfoData
  beatStorm: configInfoData
}
interface configInfoData {
  description: string
  tip: string
  type: string
  cognate?: string
}
/*******************
 ****** User ******
 *******************/
interface AppClient {
  readonly actionKey: string
  readonly platform: string
  readonly appKey: string
  readonly build: string
  readonly device: string
  readonly mobiApp: string
  readonly TS: number
  readonly RND: number
  readonly DeviceID: string
  readonly baseQuery: string
  signQuery(params: string, ts?: boolean): string
  signQueryBase(params?: string): string
  readonly status: typeof status
  captcha: string
  userName: string
  passWord: string
  biliUID: number
  accessToken: string
  refreshToken: string
  cookieString: string
  headers: Headers
  init(): Promise<void>
  getCaptcha(): Promise<captchaResponse>
  login(): Promise<loginResponse>
  logout(): Promise<logoutResponse>
  refresh(): Promise<loginResponse>
}
/*******************
 **** dm_client ****
 *******************/
declare enum dmErrorStatus {
  'client' = 0,
  'danmaku' = 1,
  'timeout' = 2
}
interface DMclientOptions {
  roomID?: number
  userID?: number
  protocol?: DMclientProtocol
}
type DMclientProtocol = 'socket' | 'flash' | 'ws' | 'wss'
type DMerror = DMclientError | DMdanmakuError
interface DMclientError {
  status: dmErrorStatus.client | dmErrorStatus.timeout
  error: Error
}
interface DMdanmakuError {
  status: dmErrorStatus.danmaku
  error: TypeError
  data: Buffer
}
// 弹幕服务器
interface danmuInfo {
  code: number
  message: string
  ttl: number
  data: danmuInfoData
}
interface danmuInfoData {
  refresh_row_factor: number
  refresh_rate: number
  max_delay: number
  token: string
  host_list: danmuInfoDataHostList[]
  ip_list: danmuInfoDataIPList[]
}
interface danmuInfoDataHostList {
  host: string
  port: number
  wss_port: number
  ws_port: number
}
interface danmuInfoDataIPList {
  host: string
  port: number
}
/*******************
 *** app_client ****
 *******************/
declare enum appStatus {
  'success' = 0,
  'captcha' = 1,
  'error' = 2,
  'httpError' = 3
}
/**
 * 公钥返回
 *
 * @interface getKeyResponse
 */
interface getKeyResponse {
  ts: number
  code: number
  data: getKeyResponseData
}
interface getKeyResponseData {
  hash: string
  key: string
}
/**
 * 验证返回
 *
 * @interface authResponse
 */
interface authResponse {
  ts: number
  code: number
  data: authResponseData
}
interface authResponseData {
  status: number
  token_info: authResponseTokeninfo
  cookie_info: authResponseCookieinfo
  sso: string[]
}
interface authResponseCookieinfo {
  cookies: authResponseCookieinfoCooky[]
  domains: string[]
}
interface authResponseCookieinfoCooky {
  name: string
  value: string
  http_only: number
  expires: number
}
interface authResponseTokeninfo {
  mid: number
  access_token: string
  refresh_token: string
  expires_in: number
}
/**
 * 注销返回
 *
 * @interface revokeResponse
 */
interface revokeResponse {
  message: string
  ts: number
  code: number
}
/**
 * 登录返回信息
 */
type loginResponse = loginResponseSuccess | loginResponseCaptcha | loginResponseError | loginResponseHttp
interface loginResponseSuccess {
  status: appStatus.success
  data: authResponse
}
interface loginResponseCaptcha {
  status: appStatus.captcha
  data: authResponse
}
interface loginResponseError {
  status: appStatus.error
  data: authResponse
}
interface loginResponseHttp {
  status: appStatus.httpError
  data: XHRresponse<getKeyResponse> | XHRresponse<authResponse> | undefined
}
/**
 * 登出返回信息
 */
type logoutResponse = revokeResponseSuccess | revokeResponseError | revokeResponseHttp
interface revokeResponseSuccess {
  status: appStatus.success
  data: revokeResponse
}
interface revokeResponseError {
  status: appStatus.error
  data: revokeResponse
}
interface revokeResponseHttp {
  status: appStatus.httpError
  data: XHRresponse<revokeResponse> | undefined
}
/**
 * 验证码返回信息
 */
type captchaResponse = captchaResponseSuccess | captchaResponseError
interface captchaResponseSuccess {
  status: appStatus.success
  data: Buffer
}
interface captchaResponseError {
  status: appStatus.error
  data: XHRresponse<Buffer> | undefined
}
/*******************
 ****** tools ******
 *******************/
/**
 * XHR返回
 *
 * @interface response
 * @template T
 */
interface XHRresponse<T> {
  response: {
    statusCode: number
  }
  body: T
}
/**
 * 客户端消息
 *
 * @interface systemMSG
 */
interface systemMSG {
  message: string
  options: options
}
/**
 * Server酱
 *
 * @interface serverChan
 */
interface serverChan {
  errno: number
  errmsg: string
  dataset: string
}
/*******************
 ******* db ********
 *******************/
/**
 * db.roomList
 *
 * @interface roomList
 */
interface roomList {
  roomID: number
  masterID: number
  beatStorm: number
  smallTV: number
  raffle: number
  updateTime: number
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
  cmd: 'raffle'
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
  cmd: 'lottery' | 'pklottery'
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
 **** listener *****
 *******************/
/**
 * 统一抽奖信息
 *
 * @interface lotteryInfo
 */
interface lotteryInfo {
  code: number
  message: string
  ttl: number
  data: lotteryInfoData
}
interface lotteryInfoData {
  activity_box: null
  bls_box: null
  gift_list: lotteryInfoDataGiftList[]
  guard: lotteryInfoDataGuard[]
  pk: lotteryInfoDataPk[]
  slive_box: lotteryInfoDataSliveBox
  storm: lotteryInfoDataStorm
}
interface lotteryInfoDataGiftList {
  raffleId: number
  title: string
  type: string
  payflow_id: number
  from_user: lotteryInfoDataGiftListFromUser
  time_wait: number
  time: number
  max_time: number
  status: number
  asset_animation_pic: string
  asset_tips_pic: string
  sender_type: number
}
interface lotteryInfoDataGiftListFromUser {
  uname: string
  face: string
}
interface lotteryInfoDataGuard {
  id: number
  sender: lotteryInfoDataGuardSender
  keyword: string
  privilege_type: number
  time: number
  status: number
  payflow_id: string
}
interface lotteryInfoDataGuardSender {
  uid: number
  uname: string
  face: string
}
interface lotteryInfoDataPk {
  id: number
  pk_id: number
  room_id: number
  time: number
  status: number
  asset_icon: string
  asset_animation_pic: string
  title: string
  max_time: number
}
interface lotteryInfoDataSliveBox {
  minute: number
  silver: number
  time_end: number
  time_start: number
  times: number
  max_times: number
  status: number
}
interface lotteryInfoDataStorm {
  id: number
  num: number
  time: number
  content: string
  hadJoin: number
  storm_gif: string
}
/**
 * 获取直播列表
 *
 * @interface getAllList
 */
interface getAllList {
  code: number
  msg: string
  message: string
  data: getAllListData
}
interface getAllListData {
  interval: number
  module_list: getAllListDataList[]
}
type getAllListDataList = getAllListDataModules | getAllListDataRooms
interface getAllListDataModules {
  module_info: getAllListDataModuleInfo
  list: getAllListDataModuleList[]
}
interface getAllListDataRooms {
  module_info: getAllListDataRoomInfo
  list: getAllListDataRoomList[]
}
interface getAllListDataBaseInfo {
  id: number
  type: number
  pic: string
  title: string
  link: string
}
interface getAllListDataModuleInfo extends getAllListDataBaseInfo {
  count?: number
}
interface getAllListDataRoomInfo extends getAllListDataBaseInfo {
  type: 6 | 9
}
interface getAllListDataModuleList {
  id: number
  pic: string
  link: string
  title: string
}
interface getAllListDataRoomList {
  roomid: number
  title: string
  uname: string
  online: number
  cover: string
  link: string
  face: string
  area_v2_parent_id: number
  area_v2_parent_name: string
  area_v2_id: number
  area_v2_name: string
  play_url: string
  current_quality: number
  accept_quality: number[]
  broadcast_type: number
  pendent_ld: string
  pendent_ru: string
  rec_type: number
  pk_id: number
}
/*******************
 ** roomlistener ***
 *******************/
/**
 * 房间信息
 *
 * @interface roomInit
 */
interface roomInit {
  code: number
  msg: string
  message: string
  data: roomInitDataData
}
interface roomInitDataData {
  room_id: number
  short_id: number
  uid: number
  need_p2p: number
  is_hidden: boolean
  is_locked: boolean
  is_portrait: boolean
  live_status: number
  hidden_till: number
  lock_till: number
  encrypted: boolean
  pwd_verified: boolean
}
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