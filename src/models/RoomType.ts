import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoomType extends Document {
  hotel: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema: Schema = new Schema(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    name: {
      type: String,
      required: [true, "Room type name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Delete the model if it exists to force recompilation with new schema
if (mongoose.models.RoomType) {
  delete mongoose.models.RoomType;
}

const RoomType: Model<IRoomType> = mongoose.model<IRoomType>("RoomType", RoomTypeSchema);

export default RoomType;
