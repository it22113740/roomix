import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAmenity extends Document {
  hotel: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AmenitySchema: Schema = new Schema(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    name: {
      type: String,
      required: [true, "Amenity name is required"],
      trim: true,
    },
    icon: {
      type: String,
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

const Amenity: Model<IAmenity> =
  mongoose.models.Amenity || mongoose.model<IAmenity>("Amenity", AmenitySchema);

export default Amenity;
