import * as mongoose from 'mongoose'

let ApiPathSchema = new mongoose.Schema({
  origin: String,
  smallTV: String,
  raffle: String,
  lighten: String
})

export let ApiPathModel = mongoose.model<apiPath>('apiPath', ApiPathSchema, 'apiPath')

export interface apiPath extends mongoose.Document {
  origin: string
  smallTV: string
  raffle: string
  lighten: string
}
