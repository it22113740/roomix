"use client";

import { Room } from "@/types/room";
import { Booking } from "@/types/booking";

const STORAGE_KEYS = {
  ROOMS: "hotel_rooms",
  BOOKINGS: "hotel_bookings",
};

// Room Store Functions
export const getRooms = (): Room[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ROOMS);
  return stored ? JSON.parse(stored) : [];
};

export const saveRooms = (rooms: Room[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
};

export const addRoom = (room: Omit<Room, "id" | "createdAt" | "updatedAt">): Room => {
  const rooms = getRooms();
  const newRoom: Room = {
    ...room,
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rooms.push(newRoom);
  saveRooms(rooms);
  return newRoom;
};

export const updateRoom = (id: string, updates: Partial<Room>): Room | null => {
  const rooms = getRooms();
  const index = rooms.findIndex((r) => r.id === id);
  if (index === -1) return null;
  
  rooms[index] = {
    ...rooms[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveRooms(rooms);
  return rooms[index];
};

export const deleteRoom = (id: string): boolean => {
  const rooms = getRooms();
  const filtered = rooms.filter((r) => r.id !== id);
  if (filtered.length === rooms.length) return false;
  saveRooms(filtered);
  return true;
};

export const getRoomById = (id: string): Room | null => {
  const rooms = getRooms();
  return rooms.find((r) => r.id === id) || null;
};

// Booking Store Functions
export const getBookings = (): Booking[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return stored ? JSON.parse(stored) : [];
};

export const saveBookings = (bookings: Booking[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
};

export const addBooking = (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  saveBookings(bookings);
  return newBooking;
};

export const updateBooking = (id: string, updates: Partial<Booking>): Booking | null => {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  
  bookings[index] = {
    ...bookings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveBookings(bookings);
  return bookings[index];
};

export const deleteBooking = (id: string): boolean => {
  const bookings = getBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  if (filtered.length === bookings.length) return false;
  saveBookings(filtered);
  return true;
};

export const getBookingById = (id: string): Booking | null => {
  const bookings = getBookings();
  return bookings.find((b) => b.id === id) || null;
};

export const cancelBooking = (id: string): Booking | null => {
  return updateBooking(id, { status: "cancelled" });
};
