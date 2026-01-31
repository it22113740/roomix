import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import mongoose from "mongoose";

// Helper to serialize booking
const serializeBooking = (booking: any) => ({
  ...booking,
  _id: booking._id.toString(),
  id: booking._id.toString(),
  hotel: booking.hotel?.toString() || booking.hotel,
  roomId: typeof booking.roomId === "object" && booking.roomId?._id
    ? booking.roomId._id.toString()
    : booking.roomId?.toString() || booking.roomId,
});

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper querying
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const bookings = await Booking.find({ hotel: hotelObjectId })
      .populate("roomId", "roomNumber roomType price")
      .sort({ createdAt: -1 })
      .lean();
    
    // Convert MongoDB documents to plain objects with string IDs
    const serializedBookings = bookings.map(serializeBooking);
    
    return NextResponse.json(
      { success: true, data: serializedBookings },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to check for overlapping bookings
const checkRoomAvailability = async (
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  hotelId: mongoose.Types.ObjectId,
  excludeBookingId?: string
): Promise<{ available: boolean; conflictingBooking?: any }> => {
  // Normalize dates to start of day for comparison
  const checkInStart = new Date(checkIn);
  checkInStart.setHours(0, 0, 0, 0);
  const checkOutStart = new Date(checkOut);
  checkOutStart.setHours(0, 0, 0, 0);

  // Build query to find overlapping bookings
  const query: any = {
    roomId: new mongoose.Types.ObjectId(roomId),
    hotel: hotelId,
    status: { $in: ["confirmed", "reserved"] }, // Check confirmed and reserved bookings (not cancelled or completed)
    // Check for overlap: existing booking overlaps if:
    // existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
    $and: [
      { checkIn: { $lt: checkOutStart } }, // Existing check-in is before new check-out
      { checkOut: { $gt: checkInStart } }, // Existing check-out is after new check-in
    ],
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const conflictingBooking = await Booking.findOne(query).lean();

  return {
    available: !conflictingBooking,
    conflictingBooking: conflictingBooking || undefined,
  };
};

// POST create new booking
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    if (!body.roomId || !mongoose.Types.ObjectId.isValid(body.roomId)) {
      return NextResponse.json(
        { success: false, error: "Valid room ID is required" },
        { status: 400 }
      );
    }
    
    // Helper function to parse date string to local date (avoiding timezone issues)
    const parseLocalDate = (dateStr: string | Date): Date => {
      if (dateStr instanceof Date) {
        const d = new Date(dateStr);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
      // Parse YYYY-MM-DD format as local date
      const dateString = typeof dateStr === 'string' ? dateStr.split('T')[0] : String(dateStr);
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      // Fallback to standard parsing
      const d = new Date(dateStr);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    
    // Convert date strings to Date objects
    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;
    
    if (body.checkIn) {
      checkInDate = parseLocalDate(body.checkIn);
    }
    
    if (body.checkOut) {
      checkOutDate = parseLocalDate(body.checkOut);
    }

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: "Check-in and check-out dates are required" },
        { status: 400 }
      );
    }
    
    // Validate dates before creating - checkOut must be at least 1 day after checkIn
    if (checkInDate && checkOutDate) {
      // Compare dates by converting to date strings to avoid timezone issues
      const checkInStr = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;
      const checkOutStr = `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(checkOutDate.getDate()).padStart(2, '0')}`;
      
      // Simple string comparison for dates in YYYY-MM-DD format
      if (checkOutStr <= checkInStr) {
        return NextResponse.json(
          { success: false, error: `Check-out date (${checkOutStr}) must be after check-in date (${checkInStr})` },
          { status: 400 }
        );
      }
    }

    // Check if room is available for the requested dates
    const hotelObjectId = new mongoose.Types.ObjectId(body.hotel);
    const availability = await checkRoomAvailability(
      body.roomId,
      checkInDate,
      checkOutDate,
      hotelObjectId
    );

    if (!availability.available) {
      const conflictingCheckIn = new Date(availability.conflictingBooking!.checkIn);
      const conflictingCheckOut = new Date(availability.conflictingBooking!.checkOut);
      const conflictingCheckInStr = `${conflictingCheckIn.getFullYear()}-${String(conflictingCheckIn.getMonth() + 1).padStart(2, '0')}-${String(conflictingCheckIn.getDate()).padStart(2, '0')}`;
      const conflictingCheckOutStr = `${conflictingCheckOut.getFullYear()}-${String(conflictingCheckOut.getMonth() + 1).padStart(2, '0')}-${String(conflictingCheckOut.getDate()).padStart(2, '0')}`;
      
      return NextResponse.json(
        {
          success: false,
          error: `Room is already booked from ${conflictingCheckInStr} to ${conflictingCheckOutStr}. Please select different dates.`,
        },
        { status: 400 }
      );
    }
    
    // Convert string hotelId to ObjectId for proper storage
    const bookingData = {
      ...body,
      hotel: hotelObjectId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };
    
    const booking = await Booking.create(bookingData);
    await booking.populate("roomId", "roomNumber roomType price");
    
    // Convert MongoDB document to plain object with string IDs
    const serializedBooking = serializeBooking(booking.toObject());
    
    return NextResponse.json(
      { success: true, data: serializedBooking },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
