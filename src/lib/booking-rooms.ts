import { Booking } from "@/types/booking";

export type PopulatedRoomRef = {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
};

/** Normalize legacy single-room and new multi-room booking shapes into roomIds. */
export function getBookingRoomIds(booking: Booking | Record<string, unknown>): string[] {
  const b = booking as Booking;
  if (Array.isArray(b.roomIds) && b.roomIds.length > 0) {
    return b.roomIds.map((room) =>
      typeof room === "object" && room !== null
        ? String((room as PopulatedRoomRef)._id)
        : String(room)
    );
  }

  if (b.roomId) {
    if (typeof b.roomId === "object" && b.roomId !== null) {
      return [String((b.roomId as PopulatedRoomRef)._id)];
    }
    return [String(b.roomId)];
  }

  return [];
}

/** Room numbers for display (legacy + multi-room). */
export function getBookingRoomNumbers(booking: Booking | Record<string, unknown>): string[] {
  const b = booking as Booking;
  if (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0) {
    return b.roomNumbers.map(String);
  }

  if (Array.isArray(b.roomIds) && b.roomIds.length > 0) {
    const fromPopulated = b.roomIds
      .map((room) =>
        typeof room === "object" && room !== null
          ? (room as PopulatedRoomRef).roomNumber
          : null
      )
      .filter((n): n is string => Boolean(n));
    if (fromPopulated.length > 0) return fromPopulated;
  }

  if (b.roomNumber) {
    return [String(b.roomNumber)];
  }

  if (typeof b.roomId === "object" && b.roomId !== null) {
    const n = (b.roomId as PopulatedRoomRef).roomNumber;
    return n ? [n] : [];
  }

  return [];
}

export function formatBookingRoomsLabel(booking: Booking | Record<string, unknown>): string {
  const numbers = getBookingRoomNumbers(booking);
  if (numbers.length === 0) return "—";
  if (numbers.length === 1) return numbers[0];
  return numbers.join(", ");
}

export function formatBookingEventTitle(booking: Booking): string {
  const numbers = getBookingRoomNumbers(booking);
  const name = booking.customerName || "Guest";
  if (numbers.length === 0) return name;
  if (numbers.length === 1) return `Room ${numbers[0]} - ${name}`;
  return `Rooms ${numbers.join(", ")} - ${name}`;
}

export function bookingIncludesRoom(
  booking: Booking | Record<string, unknown>,
  roomId: string
): boolean {
  return getBookingRoomIds(booking).some((id) => String(id) === String(roomId));
}
