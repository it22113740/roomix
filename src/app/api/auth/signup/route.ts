import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Hotel from "@/models/Hotel";

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
  hotel: user.hotel?.toString() || user.hotel,
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

// POST signup
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { firstName, lastName, email, password, hotel } = body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All personal fields are required" },
        { status: 400 }
      );
    }

    if (!hotel || !hotel.name || !hotel.address || !hotel.phone) {
      return NextResponse.json(
        { success: false, error: "All hotel fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create hotel first
    const hotelDoc = await Hotel.create({
      name: hotel.name,
      address: hotel.address,
      phone: hotel.phone,
      description: hotel.description || undefined,
      logo: hotel.logo || undefined,
    });

    // Create user with hotel reference
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone: body.phone || undefined,
      bio: body.bio || undefined,
      avatar: body.avatar || undefined,
      hotel: hotelDoc._id,
    });

    // Populate hotel in user
    await user.populate("hotel");

    return NextResponse.json(
      {
        success: true,
        data: {
          ...serializeUser(user.toObject()),
          hotel: serializeHotel(user.hotel),
        },
        message: "User and hotel created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/auth/signup):", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
