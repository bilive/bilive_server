import * as mongoose from 'mongoose'

let RoomListSchema = new mongoose.Schema({
  roomID: Number,
  masterID: Number,
  beatStorm: { type: Number, default: 0 },
  smallTV: { type: Number, default: 0 },
  raffle: { type: Number, default: 0 },
  updateTime: { type: Number, default: 0 }
})

export let RoomListModel = mongoose.model<roomList>('roomList', RoomListSchema, 'roomList')

export interface roomList extends mongoose.Document {
  roomID: number
  masterID: number
  beatStorm: number
  smallTV: number
  raffle: number
  updateTime: number
}