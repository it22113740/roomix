import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import mongoose from "mongoose";
import {
  checkRoomsAvailability,
  formatDateStr,
  normalizeRoomIdsInput,
  parseLocalDate,
  serializeBooking,
} from "@/lib/booking-api";

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

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const bookings = await Booking.find({ hotel: hotelObjectId })
      .populate("roomIds", "roomNumber roomType price")
      .populate("roomId", "roomNumber roomType price")
      .sort({ createdAt: -1 })
      .lean();

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

    const roomIds = normalizeRoomIdsInput(body);
    if (roomIds.length === 0 || roomIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json(
        { success: false, error: "Select at least one valid room" },
        { status: 400 }
      );
    }

    // Deduplicate while preserving order
    const uniqueRoomIds = Array.from(new Set(roomIds));

    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    if (body.checkIn) checkInDate = parseLocalDate(body.checkIn);
    if (body.checkOut) checkOutDate = parseLocalDate(body.checkOut);

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: "Check-in and check-out dates are required" },
        { status: 400 }
      );
    }

    const checkInStr = formatDateStr(checkInDate);
    const checkOutStr = formatDateStr(checkOutDate);

    if (checkOutStr <= checkInStr) {
      return NextResponse.json(
        {
          success: false,
          error: `Check-out date (${checkOutStr}) must be after check-in date (${checkInStr})`,
        },
        { status: 400 }
      );
    }

    const hotelObjectId = new mongoose.Types.ObjectId(body.hotel);

    const rooms = await Room.find({
      _id: { $in: uniqueRoomIds.map((id) => new mongoose.Types.ObjectId(id)) },
      hotel: hotelObjectId,
    }).lean();

    if (rooms.length !== uniqueRoomIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more selected rooms were not found for this hotel" },
        { status: 400 }
      );
    }

    const roomById = new Map(rooms.map((r: any) => [r._id.toString(), r]));
    const orderedRooms = uniqueRoomIds.map((id) => roomById.get(id)!);
    const roomNumbers = orderedRooms.map((r: any) => r.roomNumber);

    const availability = await checkRoomsAvailability(
      uniqueRoomIds,
      checkInDate,
      checkOutDate,
      hotelObjectId
    );

    if (!availability.available) {
      const conflictingCheckIn = new Date(availability.conflictingBooking!.checkIn);
      const conflictingCheckOut = new Date(availability.conflictingBooking!.checkOut);
      const conflictRoom = availability.conflictingRoomId
        ? roomById.get(availability.conflictingRoomId)
        : null;
      const roomLabel = conflictRoom?.roomNumber || "selected room";

      return NextResponse.json(
        {
          success: false,
          error: `Room ${roomLabel} is already booked from ${formatDateStr(conflictingCheckIn)} to ${formatDateStr(conflictingCheckOut)}. Please select different rooms or dates.`,
        },
        { status: 400 }
      );
    }

    const bookingData = {
      hotel: hotelObjectId,
      roomIds: uniqueRoomIds.map((id) => new mongoose.Types.ObjectId(id)),
      roomNumbers,
      // Keep legacy mirrors for older consumers
      roomId: uniqueRoomIds[0],
      roomNumber: roomNumbers[0],
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfGuests: body.numberOfGuests,
      totalPrice: body.totalPrice,
      status: body.status,
      bookingSource: body.bookingSource,
      websiteUrl: body.websiteUrl,
      specialRequests: body.specialRequests,
      idDocument: body.idDocument,
      discountType: body.discountType,
      discountValue: body.discountValue,
      checkedInAt: body.checkedInAt,
    };

    const booking = await Booking.create(bookingData);
    await booking.populate("roomIds", "roomNumber roomType price");

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
