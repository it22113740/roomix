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

// PATCH cancel booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Handle both Promise and direct params (Next.js 16 compatibility)
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

    // Convert string hotelId to ObjectId for proper querying
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, hotel: hotelObjectId },
      { status: "cancelled", updatedAt: new Date() },
      { new: true }
    )
      .populate("roomId", "roomNumber roomType price")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object with string IDs
    const serializedBooking = serializeBooking(booking);

    return NextResponse.json(
      { success: true, data: serializedBooking, message: "Booking cancelled successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
