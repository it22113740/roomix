import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  hotel: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  roomNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "confirmed" | "reserved" | "cancelled" | "completed";
  specialRequests?: string;
  idDocument?: string; // Cloudinary URL for NIC/Driver License
  bookingSource?: "manual" | "website" | "call";
  websiteUrl?: string;
  checkedInAt?: Date;
  discountType?: "percentage" | "fixed" | "none";
  discountValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
      validate: {
        validator: function (this: IBooking, value: Date) {
          // Get checkIn from the document (works for both new and existing documents)
          const checkIn = this.checkIn || (this as any).get("checkIn");
          if (!checkIn) return true; // Let required validation handle missing checkIn
          
          // Normalize both dates to start of day for comparison
          const checkInDate = new Date(checkIn);
          checkInDate.setHours(0, 0, 0, 0);
          const checkOutDate = new Date(value);
          checkOutDate.setHours(0, 0, 0, 0);
          
          // Check if checkOut is at least 1 day after checkIn
          const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          return daysDiff > 0;
        },
        message: "Check-out date must be after check-in date",
      },
    },
    numberOfGuests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "Number of guests must be at least 1"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price must be positive"],
    },
    status: {
      type: String,
      enum: ["confirmed", "reserved", "cancelled", "completed"],
      default: "confirmed",
    },
    bookingSource: {
      type: String,
      enum: ["manual", "website", "call"],
      default: "call",
      required: [true, "Booking source is required"],
    },
    websiteUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: any, value: string) {
          const bookingSource = this.bookingSource || (this as any).get("bookingSource");
          if (bookingSource === "website") {
            return typeof value === "string" && value.trim().length > 0;
          }
          return true;
        },
        message: "Website URL is required for website bookings",
      },
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    idDocument: {
      type: String,
      trim: true,
    },
    checkedInAt: {
      type: Date,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "none"],
      default: "none",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, "Discount value cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Clear cached model to ensure schema updates are applied
if (mongoose.models.Booking) {
  delete (mongoose.connection.models as any).Booking;
}

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
