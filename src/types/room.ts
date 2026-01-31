export interface Room {
  _id?: string;
  id?: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  status: "available" | "occupied" | "maintenance";
  images?: string[]; // Array of Cloudinary image URLs (max 5)
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
