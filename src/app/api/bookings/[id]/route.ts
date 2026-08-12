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

// GET single booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = String(resolvedParams.id || "").trim();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const booking = await Booking.findOne({ _id: bookingId, hotel: hotelObjectId })
      .populate("roomIds", "roomNumber roomType price")
      .populate("roomId", "roomNumber roomType price")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: serializeBooking(booking) },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = String(resolvedParams.id || "").trim();

    if (!bookingId || bookingId.length !== 24 || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid booking ID format: ${bookingId} (length: ${bookingId.length})`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    const hotelObjectId = new mongoose.Types.ObjectId(body.hotel);

    const existingBooking = await Booking.findOne({
      _id: bookingId,
      hotel: hotelObjectId,
    });
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    let checkInDate: Date;
    let checkOutDate: Date;

    if (body.checkIn) {
      checkInDate = parseLocalDate(body.checkIn);
    } else {
      checkInDate = parseLocalDate(existingBooking.checkIn);
    }

    if (body.checkOut) {
      checkOutDate = parseLocalDate(body.checkOut);
    } else {
      checkOutDate = parseLocalDate(existingBooking.checkOut);
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

    let roomIdsToCheck = normalizeRoomIdsInput(body);
    if (roomIdsToCheck.length === 0) {
      const existingIds =
        Array.isArray(existingBooking.roomIds) && existingBooking.roomIds.length > 0
          ? existingBooking.roomIds.map((id: any) => id.toString())
          : existingBooking.roomId
            ? [existingBooking.roomId.toString()]
            : [];
      roomIdsToCheck = existingIds;
    }

    const uniqueRoomIds = Array.from(new Set(roomIdsToCheck));

    if (uniqueRoomIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one room is required" },
        { status: 400 }
      );
    }

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
    const roomNumbers = uniqueRoomIds.map((id) => roomById.get(id)!.roomNumber);

    const availability = await checkRoomsAvailability(
      uniqueRoomIds,
      checkInDate,
      checkOutDate,
      hotelObjectId,
      bookingId
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

    const updateData: any = {
      updatedAt: new Date(),
      hotel: hotelObjectId,
      roomIds: uniqueRoomIds.map((id) => new mongoose.Types.ObjectId(id)),
      roomNumbers,
      roomId: uniqueRoomIds[0],
      roomNumber: roomNumbers[0],
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };

    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.numberOfGuests !== undefined) updateData.numberOfGuests = body.numberOfGuests;
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.bookingSource !== undefined) updateData.bookingSource = body.bookingSource;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
    if (body.checkedInAt !== undefined) updateData.checkedInAt = body.checkedInAt;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests;
    if (body.idDocument !== undefined) updateData.idDocument = body.idDocument;

    const updateResult = await Booking.updateOne(
      { _id: bookingId, hotel: hotelObjectId },
      updateData,
      { runValidators: false }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = await Booking.findOne({ _id: bookingId, hotel: hotelObjectId })
      .populate("roomIds", "roomNumber roomType price")
      .populate("roomId", "roomNumber roomType price")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: serializeBooking(booking) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating booking:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = String(resolvedParams.id || "").trim();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const booking = await Booking.findOneAndDelete({
      _id: bookingId,
      hotel: hotelObjectId,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Booking deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
