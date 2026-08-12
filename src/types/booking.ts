export interface BookingRoomRef {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
}

export interface Booking {
  _id?: string;
  id?: string;
  /** Multi-room: array of room ObjectIds (or populated room docs). */
  roomIds: Array<string | BookingRoomRef>;
  /** Denormalized room numbers matching roomIds order. */
  roomNumbers: string[];
  /**
   * Legacy single-room fields kept optional for older documents / UI fallbacks.
   * Prefer roomIds / roomNumbers.
   */
  roomId?: string | BookingRoomRef;
  roomNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  checkIn: string | Date;
  checkOut: string | Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "confirmed" | "reserved" | "cancelled" | "completed";
  bookingSource?: "manual" | "website" | "call";
  websiteUrl?: string;
  checkedInAt?: string | Date;
  discountType?: "percentage" | "fixed" | "none";
  discountValue?: number;
  specialRequests?: string;
  idDocument?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
