import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Amenity from "@/models/Amenity";
import mongoose from "mongoose";

// Helper to serialize MongoDB documents
const serializeAmenity = (amenity: any) => ({
  ...amenity,
  _id: amenity._id.toString(),
  id: amenity._id.toString(),
  hotel: amenity.hotel?.toString() || amenity.hotel,
});

// GET all amenities
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper querying
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    const amenities = await Amenity.find({ hotel: hotelObjectId }).sort({ name: 1 }).lean();
    const serializedAmenities = amenities.map(serializeAmenity);
    return NextResponse.json(
      { success: true, data: serializedAmenities },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (GET /api/amenities):", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new amenity
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      console.error("Amenity creation failed: Invalid or missing hotel ID", { hotel: body.hotel });
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper storage
    const amenityData = {
      ...body,
      hotel: new mongoose.Types.ObjectId(body.hotel),
    };

    console.log("Creating amenity with data:", { ...amenityData, hotel: amenityData.hotel.toString() });
    const amenity = await Amenity.create(amenityData);
    return NextResponse.json(
      { success: true, data: serializeAmenity(amenity.toObject()) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/amenities):", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Amenity name already exists for this hotel" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
