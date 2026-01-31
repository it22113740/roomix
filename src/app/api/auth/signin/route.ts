import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Import models to ensure they're registered
import User from "@/models/User";
import Hotel from "@/models/Hotel"; // Import Hotel model to register schema for population

// Ensure Hotel model is registered at module level
// This ensures the model registration code executes when the module loads
if (typeof window === "undefined" && !mongoose.models.Hotel) {
  // Force model registration by accessing it
  void Hotel;
}

// Helper to serialize user (exclude password)
const serializeUser = (user: any) => {
  const base = {
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
  };
  
  // Don't include hotel here - it will be added separately if populated
  return base;
};

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

// POST signin
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Ensure Hotel model is registered after DB connection
    // The import should register it, but verify after connection
    if (!mongoose.models.Hotel) {
      // Force registration by accessing the model
      // This should trigger the model registration code in Hotel.ts
      const _ = Hotel;
      
      // If still not registered after accessing, there's a problem
      if (!mongoose.models.Hotel) {
        console.error("Hotel model not registered after import. Available models:", Object.keys(mongoose.models));
        throw new Error(
          "Hotel model schema not registered. Please restart your development server to reload models."
        );
      }
    }
    
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user first (without populate) to check password
    const userDoc = await User.findOne({ email: email.toLowerCase() });
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await userDoc.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get user with populated hotel after password verification
    const userWithHotel = await User.findOne({ email: email.toLowerCase() }).populate("hotel").lean();
    if (!userWithHotel) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const responseData: any = serializeUser(userWithHotel);
    
    // Include hotel data if available (hotel is populated as an object)
    if (userWithHotel.hotel && typeof userWithHotel.hotel === 'object' && userWithHotel.hotel._id) {
      responseData.hotel = serializeHotel(userWithHotel.hotel);
    } else if (userWithHotel.hotel) {
      // If hotel is just an ObjectId, convert it to string
      responseData.hotel = {
        _id: userWithHotel.hotel.toString(),
        id: userWithHotel.hotel.toString(),
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Sign in successful",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/auth/signin):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}
