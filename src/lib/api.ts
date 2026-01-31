import { Room } from "@/types/room";
import { Booking } from "@/types/booking";
import { RoomType } from "@/types/roomType";
import { Amenity } from "@/types/amenity";
import { User, AuthUser } from "@/types/user";
import { getHotelId } from "./hotel-context";

const API_BASE_URL = "/api";

// Room API functions
export const roomAPI = {
  getAll: async (): Promise<Room[]> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/rooms?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch rooms");
    return data.data;
  },

  getById: async (id: string): Promise<Room> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/rooms/${id}?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch room");
    return data.data;
  },

  create: async (room: Omit<Room, "id" | "createdAt" | "updatedAt">): Promise<Room> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...room, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to create room");
    return data.data;
  },

  update: async (id: string, updates: Partial<Room>): Promise<Room> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to update room");
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/rooms/${id}?hotelId=${hotelId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to delete room");
  },
};

// Booking API functions
export const bookingAPI = {
  getAll: async (): Promise<Booking[]> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch bookings");
    return data.data;
  },

  getById: async (id: string): Promise<Booking> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings/${id}?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch booking");
    return data.data;
  },

  create: async (
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">
  ): Promise<Booking> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...booking, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to create booking");
    return data.data;
  },

  update: async (id: string, updates: Partial<Booking>): Promise<Booking> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to update booking");
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings/${id}?hotelId=${hotelId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to delete booking");
  },

  cancel: async (id: string): Promise<Booking> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel?hotelId=${hotelId}`, {
      method: "PATCH",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to cancel booking");
    return data.data;
  },
};

// Room Type API functions
export const roomTypeAPI = {
  getAll: async (): Promise<RoomType[]> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/room-types?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch room types");
    return data.data;
  },

  getById: async (id: string): Promise<RoomType> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/room-types/${id}?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch room type");
    return data.data;
  },

  create: async (
    roomType: Omit<RoomType, "id" | "_id" | "createdAt" | "updatedAt">
  ): Promise<RoomType> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/room-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...roomType, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to create room type");
    return data.data;
  },

  update: async (id: string, updates: Partial<RoomType>): Promise<RoomType> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/room-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to update room type");
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/room-types/${id}?hotelId=${hotelId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to delete room type");
  },
};

// Amenity API functions
export const amenityAPI = {
  getAll: async (): Promise<Amenity[]> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/amenities?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch amenities");
    return data.data;
  },

  getById: async (id: string): Promise<Amenity> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/amenities/${id}?hotelId=${hotelId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch amenity");
    return data.data;
  },

  create: async (
    amenity: Omit<Amenity, "id" | "_id" | "createdAt" | "updatedAt">
  ): Promise<Amenity> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/amenities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...amenity, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to create amenity");
    return data.data;
  },

  update: async (id: string, updates: Partial<Amenity>): Promise<Amenity> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/amenities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, hotel: hotelId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to update amenity");
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const hotelId = getHotelId();
    if (!hotelId) throw new Error("Hotel ID not found. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/amenities/${id}?hotelId=${hotelId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to delete amenity");
  },
};

// Auth API functions
export const authAPI = {
  signup: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    bio?: string;
    hotel?: {
      name: string;
      address: string;
      phone: string;
      description?: string;
      logo?: string;
    };
  }): Promise<AuthUser & { hotel?: any }> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to sign up");
    return data.data;
  },

  signin: async (email: string, password: string): Promise<AuthUser & { hotel?: any }> => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to sign in");
    return data.data;
  },

  getCurrentUser: async (userId: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me?userId=${userId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to get user");
    return data.data;
  },

  updateProfile: async (
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      avatar?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to update profile");
    return data.data;
  },
};
