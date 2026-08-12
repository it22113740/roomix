import mongoose from "mongoose";
import Booking from "@/models/Booking";

export function serializeRoomRef(room: any): string | Record<string, unknown> {
  if (room && typeof room === "object" && room._id) {
    return {
      _id: room._id.toString(),
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
    };
  }
  return room?.toString?.() || room;
}

export function serializeBooking(booking: any) {
  const roomIdsRaw = Array.isArray(booking.roomIds)
    ? booking.roomIds
    : booking.roomId
      ? [booking.roomId]
      : [];

  const roomIds = roomIdsRaw.map(serializeRoomRef);

  const roomNumbers =
    Array.isArray(booking.roomNumbers) && booking.roomNumbers.length > 0
      ? booking.roomNumbers.map(String)
      : booking.roomNumber
        ? [String(booking.roomNumber)]
        : roomIdsRaw
            .map((r: any) =>
              typeof r === "object" && r?.roomNumber ? String(r.roomNumber) : null
            )
            .filter(Boolean);

  return {
    ...booking,
    _id: booking._id.toString(),
    id: booking._id.toString(),
    hotel: booking.hotel?.toString() || booking.hotel,
    roomIds,
    roomNumbers,
    // Legacy mirrors for older UI paths
    roomId: roomIds[0],
    roomNumber: roomNumbers[0] || "",
  };
}

export function normalizeRoomIdsInput(body: any): string[] {
  if (Array.isArray(body.roomIds) && body.roomIds.length > 0) {
    return body.roomIds.map((id: any) =>
      typeof id === "object" && id?._id ? String(id._id) : String(id)
    );
  }
  if (body.roomId) {
    const id =
      typeof body.roomId === "object" && body.roomId?._id
        ? String(body.roomId._id)
        : String(body.roomId);
    return [id];
  }
  return [];
}

export function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const dateString =
    typeof dateStr === "string" ? dateStr.split("T")[0] : String(dateStr);
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Check whether any of the given rooms already have an overlapping
 * confirmed/reserved booking (supports legacy roomId and new roomIds).
 */
export async function checkRoomsAvailability(
  roomIds: string[],
  checkIn: Date,
  checkOut: Date,
  hotelId: mongoose.Types.ObjectId,
  excludeBookingId?: string
): Promise<{ available: boolean; conflictingBooking?: any; conflictingRoomId?: string }> {
  const checkInStart = new Date(checkIn);
  checkInStart.setHours(0, 0, 0, 0);
  const checkOutStart = new Date(checkOut);
  checkOutStart.setHours(0, 0, 0, 0);

  for (const roomId of roomIds) {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      continue;
    }
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    const query: any = {
      hotel: hotelId,
      status: { $in: ["confirmed", "reserved"] },
      $and: [
        { checkIn: { $lt: checkOutStart } },
        { checkOut: { $gt: checkInStart } },
      ],
      $or: [{ roomIds: roomObjectId }, { roomId: roomObjectId }],
    };

    if (excludeBookingId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
    }

    const conflictingBooking = await Booking.findOne(query).lean();
    if (conflictingBooking) {
      return {
        available: false,
        conflictingBooking,
        conflictingRoomId: roomId,
      };
    }
  }

  return { available: true };
}
