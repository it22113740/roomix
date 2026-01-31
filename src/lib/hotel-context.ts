/**
 * Get hotel ID from localStorage
 * Returns null if not found or invalid
 */
export function getHotelId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const userStr = localStorage.getItem("user");
    const hotelStr = localStorage.getItem("hotel");
    
    if (hotelStr) {
      const hotel = JSON.parse(hotelStr);
      return hotel._id || hotel.id || null;
    }
    
    if (userStr) {
      const user = JSON.parse(userStr);
      // user.hotel is an object with _id or id property
      if (user.hotel) {
        return user.hotel._id || user.hotel.id || null;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting hotel ID:", error);
    return null;
  }
}

/**
 * Get hotel object from localStorage
 */
export function getHotel(): any | null {
  if (typeof window === "undefined") return null;
  
  try {
    const hotelStr = localStorage.getItem("hotel");
    if (hotelStr) {
      return JSON.parse(hotelStr);
    }
    return null;
  } catch (error) {
    console.error("Error getting hotel:", error);
    return null;
  }
}
