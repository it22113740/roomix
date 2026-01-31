import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import mongoose from "mongoose";

// Helper to serialize room
const serializeRoom = (room: any) => ({
  ...room,
  _id: room._id.toString(),
  id: room._id.toString(),
  hotel: room.hotel?.toString() || room.hotel,
});

// GET all rooms
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
    const rooms = await Room.find({ hotel: hotelObjectId }).sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB documents to plain objects with string IDs
    const serializedRooms = rooms.map(serializeRoom);
    
    return NextResponse.json({ success: true, data: serializedRooms }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new room
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      console.error("Room creation failed: Invalid or missing hotel ID", { hotel: body.hotel });
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper storage
    const roomData = {
      ...body,
      hotel: new mongoose.Types.ObjectId(body.hotel),
    };
    
    console.log("Creating room with data:", { ...roomData, hotel: roomData.hotel.toString() });
    const room = await Room.create(roomData);
    
    // Convert MongoDB document to plain object with string IDs
    const serializedRoom = serializeRoom(room.toObject());
    
    return NextResponse.json(
      { success: true, data: serializedRoom },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Room number already exists for this hotel" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
