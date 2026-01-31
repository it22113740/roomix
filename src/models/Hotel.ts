import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHotel extends Document {
  name: string;
  address: string;
  phone: string;
  description?: string;
  logo?: string; // Cloudinary URL for hotel logo
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Delete cached model if it exists to prevent schema redefinition errors
// But only in development to allow schema updates
if (mongoose.models.Hotel && process.env.NODE_ENV === "development") {
  delete (mongoose.connection.models as any).Hotel;
}

// Always ensure the model is registered
const Hotel: Model<IHotel> =
  mongoose.models.Hotel || mongoose.model<IHotel>("Hotel", HotelSchema);

export default Hotel;
