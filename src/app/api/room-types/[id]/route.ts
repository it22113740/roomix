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

// GET single room type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomTypeId = String(resolvedParams.id || "").trim();
    
    if (!roomTypeId || !mongoose.Types.ObjectId.isValid(roomTypeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room type ID" },
        { status: 400 }
      );
    }

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
    const roomType = await RoomType.findOne({ _id: roomTypeId, hotel: hotelObjectId }).lean();
    
    if (!roomType) {
      return NextResponse.json(
        { success: false, error: "Room type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeRoomType(roomType) }, { status: 200 });
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (GET /api/room-types/${resolvedParams.id}):`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update room type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomTypeId = String(resolvedParams.id || "").trim();
    
    if (!roomTypeId || !mongoose.Types.ObjectId.isValid(roomTypeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room type ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (!body.hotel || !mongoose.Types.ObjectId.isValid(body.hotel)) {
      return NextResponse.json(
        { success: false, error: "Valid hotel ID is required" },
        { status: 400 }
      );
    }

    // Convert string hotelId to ObjectId for proper querying
    const hotelObjectId = new mongoose.Types.ObjectId(body.hotel);
    
    // Verify room type belongs to hotel
    const existingRoomType = await RoomType.findOne({ _id: roomTypeId, hotel: hotelObjectId });
    if (!existingRoomType) {
      return NextResponse.json(
        { success: false, error: "Room type not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    // Convert hotel to ObjectId in update data
    const updateData = {
      ...body,
      hotel: hotelObjectId,
      updatedAt: new Date(),
    };

    const roomType = await RoomType.findByIdAndUpdate(
      roomTypeId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!roomType) {
      return NextResponse.json(
        { success: false, error: "Room type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeRoomType(roomType) }, { status: 200 });
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (PUT /api/room-types/${resolvedParams.id}):`, error);
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

// DELETE room type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomTypeId = String(resolvedParams.id || "").trim();
    
    if (!roomTypeId || !mongoose.Types.ObjectId.isValid(roomTypeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room type ID" },
        { status: 400 }
      );
    }

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
    const roomType = await RoomType.findOneAndDelete({ _id: roomTypeId, hotel: hotelObjectId });

    if (!roomType) {
      return NextResponse.json(
        { success: false, error: "Room type not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Room type deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (DELETE /api/room-types/${resolvedParams.id}):`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
