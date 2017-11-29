import * as mongoose from 'mongoose'

let RoomIDSchema = new mongoose.Schema({
  shortRoomID: Number,
  roomID: Number
})

export let RoomIDModel = mongoose.model<roomID>('roomID', RoomIDSchema, 'roomID')

interface roomID extends mongoose.Document {
  shortRoomID: number
  roomID: number
}