import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  hotel: mongoose.Types.ObjectId;
  roomIds: mongoose.Types.ObjectId[];
  roomNumbers: string[];
  /** @deprecated Use roomIds — kept for reading legacy documents */
  roomId?: mongoose.Types.ObjectId;
  /** @deprecated Use roomNumbers — kept for reading legacy documents */
  roomNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "confirmed" | "reserved" | "cancelled" | "completed";
  specialRequests?: string;
  idDocument?: string;
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
    roomIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Room" }],
      required: [true, "At least one room is required"],
      validate: {
        validator: function (rooms: mongoose.Types.ObjectId[]) {
          return Array.isArray(rooms) && rooms.length > 0;
        },
        message: "At least one room is required",
      },
    },
    roomNumbers: {
      type: [String],
      required: [true, "Room numbers are required"],
      validate: {
        validator: function (numbers: string[]) {
          return Array.isArray(numbers) && numbers.length > 0;
        },
        message: "At least one room number is required",
      },
    },
    // Legacy fields (optional) for older documents
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: false,
    },
    roomNumber: {
      type: String,
      trim: true,
      required: false,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    customerPhone: {
      type: String,
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
          const checkIn = this.checkIn || (this as any).get("checkIn");
          if (!checkIn) return true;

          const checkInDate = new Date(checkIn);
          checkInDate.setHours(0, 0, 0, 0);
          const checkOutDate = new Date(value);
          checkOutDate.setHours(0, 0, 0, 0);

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
          const bookingSource =
            this.bookingSource || (this as any).get("bookingSource");
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
