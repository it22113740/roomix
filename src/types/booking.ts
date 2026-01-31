export interface Booking {
  _id?: string;
  id?: string;
  roomId: string | { _id: string; roomNumber: string; roomType: string; price: number };
  roomNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkIn: string | Date;
  checkOut: string | Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "confirmed" | "reserved" | "cancelled" | "completed";
  specialRequests?: string;
  idDocument?: string; // Cloudinary URL for NIC/Driver License
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
