import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import mongoose from "mongoose";

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

// GET single booking by ID
export async function GET(
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
    const booking = await Booking.findOne({ _id: bookingId, hotel: hotelObjectId })
      .populate("roomId", "roomNumber roomType price")
      .lean();
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object with string IDs
    const serializedBooking = serializeBooking(booking);

    return NextResponse.json({ success: true, data: serializedBooking }, { status: 200 });
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
    
    // Handle both Promise and direct params (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = String(resolvedParams.id || "").trim();
    
    if (!bookingId || bookingId.length !== 24 || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, error: `Invalid booking ID format: ${bookingId} (length: ${bookingId.length})` },
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
    
    // Convert string hotelId to ObjectId for proper querying
    const hotelObjectId = new mongoose.Types.ObjectId(body.hotel);
    
    // Get existing booking to merge with updates and verify hotel ownership
    const existingBooking = await Booking.findOne({ _id: bookingId, hotel: hotelObjectId });
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or does not belong to this hotel" },
        { status: 404 }
      );
    }
    
    // Convert date strings to Date objects if present, otherwise use existing dates
    let checkInDate: Date;
    let checkOutDate: Date;
    
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
    
    // Validate dates before updating - checkOut must be at least 1 day after checkIn
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

    // Determine which room to check (use updated roomId if provided, otherwise existing)
    const roomIdToCheck = body.roomId || existingBooking.roomId.toString();

    // Check if room is available for the requested dates (excluding current booking)
    const availability = await checkRoomAvailability(
      roomIdToCheck,
      checkInDate,
      checkOutDate,
      hotelObjectId,
      bookingId // Exclude current booking from overlap check
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
    
    // Prepare update object with proper date conversion
    // Only include fields that are being updated
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Add fields from body, but ensure dates are properly formatted
    if (body.roomId !== undefined) updateData.roomId = body.roomId;
    if (body.roomNumber !== undefined) updateData.roomNumber = body.roomNumber;
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.checkIn !== undefined) updateData.checkIn = checkInDate;
    if (body.checkOut !== undefined) updateData.checkOut = checkOutDate;
    if (body.numberOfGuests !== undefined) updateData.numberOfGuests = body.numberOfGuests;
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests;
    if (body.idDocument !== undefined) updateData.idDocument = body.idDocument;
    
    // Ensure hotel is set as ObjectId in updateData
    updateData.hotel = hotelObjectId;
    
    // Update using updateOne to avoid document-level validators
    const updateResult = await Booking.updateOne(
      { _id: bookingId, hotel: hotelObjectId },
      updateData,
      { runValidators: false } // Disable validators since we validate manually
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Fetch the updated booking
    const booking = await Booking.findOne({ _id: bookingId, hotel: hotelObjectId })
      .populate("roomId", "roomNumber roomType price")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object with string IDs
    const serializedBooking = serializeBooking(booking);

    return NextResponse.json({ success: true, data: serializedBooking }, { status: 200 });
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
    const booking = await Booking.findOneAndDelete({ _id: bookingId, hotel: hotelObjectId });

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
