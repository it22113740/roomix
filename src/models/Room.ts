import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoom extends Document {
  hotel: mongoose.Types.ObjectId;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  status: "available" | "occupied" | "maintenance";
  images: string[]; // Array of Cloudinary image URLs (max 5)
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 5;
        },
        message: "Maximum 5 images allowed",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
