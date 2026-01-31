import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import RoomType from "@/models/RoomType";
import mongoose from "mongoose";

// Helper to serialize MongoDB documents
const serializeRoomType = (roomType: any) => ({
  ...roomType,
  _id: roomType._id.toString(),
  id: roomType._id.toString(),
  hotel: roomType.hotel?.toString() || roomType.hotel,
});

// GET all room types
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
    const roomTypes = await RoomType.find({ hotel: hotelObjectId }).sort({ createdAt: -1 }).lean();
    const serializedRoomTypes = roomTypes.map(serializeRoomType);
    return NextResponse.json(
      { success: true, data: serializedRoomTypes },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (GET /api/room-types):", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new room type
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper storage
    const roomTypeData = {
      ...body,
      hotel: new mongoose.Types.ObjectId(body.hotel),
    };
    const roomType = await RoomType.create(roomTypeData);
    return NextResponse.json(
      { success: true, data: serializeRoomType(roomType.toObject()) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/room-types):", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Room type name already exists for this hotel" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
