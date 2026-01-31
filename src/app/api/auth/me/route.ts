import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Hotel from "@/models/Hotel"; // Import Hotel model to register schema for population
import mongoose from "mongoose";

// Helper to serialize user (exclude password)
const serializeUser = (user: any) => ({
  _id: user._id.toString(),
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Helper to serialize hotel
const serializeHotel = (hotel: any) => ({
  _id: hotel._id.toString(),
  id: hotel._id.toString(),
  name: hotel.name,
  address: hotel.address,
  phone: hotel.phone,
  description: hotel.description,
  logo: hotel.logo,
  createdAt: hotel.createdAt,
  updatedAt: hotel.updatedAt,
});

// GET current user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user ID from query parameter (sent from frontend)
    const userId = request.nextUrl.searchParams.get("userId");
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).populate("hotel").lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userObj: any = serializeUser(user);
    
    // Include hotel data if available
    if (user.hotel && typeof user.hotel === 'object' && user.hotel._id) {
      userObj.hotel = serializeHotel(user.hotel);
    }

    return NextResponse.json(
      { success: true, data: userObj },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (GET /api/auth/me):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get user" },
      { status: 500 }
    );
  }
}
