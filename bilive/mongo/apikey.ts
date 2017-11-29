import * as mongoose from 'mongoose'

let ApiKeySchema = new mongoose.Schema({
  apiKey: String,
  status: { type: Boolean, default: false },
  welcome: { type: String, default: '连接成功' },
  sysmsg: { type: Boolean, default: true },
  smallTV: { type: Boolean, default: false },
  raffle: { type: Boolean, default: false },
  beatStorm: { type: Boolean, default: false },
  debug: { type: Boolean, default: true }
})

export let ApiKeyModel = mongoose.model<apiKey>('apiKey', ApiKeySchema, 'apiKey')

export interface apiKey extends mongoose.Document {
  [index: string]: any
  apiKey: string
  status: boolean
  welcome: string
  sysmsg: boolean
  smallTV: boolean
  raffle: boolean
  beatStorm: boolean
  debug: boolean
}