import mongoose from "mongoose";

/**
 * Validates and returns hotelId from query params or request body
 */
export function getHotelIdFromRequest(
  searchParams: URLSearchParams,
  body?: any
): string | null {
  const hotelId = searchParams.get("hotelId") || body?.hotelId;
  
  if (!hotelId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return null;
  }

  return hotelId;
}

/**
 * Validates hotelId and throws error if invalid
 */
export function validateHotelId(hotelId: string | null): string {
  if (!hotelId) {
    throw new Error("Hotel ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    throw new Error("Invalid hotel ID format");
  }
  return hotelId;
}
