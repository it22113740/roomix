import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import mongoose from "mongoose";

// GET single room by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Handle both Promise and direct params (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomId = String(resolvedParams.id || "").trim();
    
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room ID" },
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
    const room = await Room.findOne({ _id: roomId, hotel: hotelObjectId }).lean();
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object with string IDs
    const serializedRoom = {
      ...room,
      _id: (room as any)._id.toString(),
      id: (room as any)._id.toString(),
      hotel: (room as any).hotel?.toString() || (room as any).hotel,
    };

    return NextResponse.json({ success: true, data: serializedRoom }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Handle both Promise and direct params (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomId = String(resolvedParams.id || "").trim();
    
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room ID" },
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
    
    // Verify room belongs to hotel
    const existingRoom = await Room.findOne({ _id: roomId, hotel: hotelObjectId });
    if (!existingRoom) {
      return NextResponse.json(
        { success: false, error: "Room not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    // Convert hotel to ObjectId in update data
    const updateData = {
      ...body,
      hotel: hotelObjectId,
      updatedAt: new Date(),
    };

    const room = await Room.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object with string IDs
    const serializedRoom = {
      ...room,
      _id: (room as any)._id.toString(),
      id: (room as any)._id.toString(),
      hotel: (room as any).hotel?.toString() || (room as any).hotel,
    };

    return NextResponse.json({ success: true, data: serializedRoom }, { status: 200 });
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

// DELETE room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Handle both Promise and direct params (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const roomId = String(resolvedParams.id || "").trim();
    
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room ID" },
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
    
    // Verify room belongs to hotel before deleting
    const room = await Room.findOneAndDelete({ _id: roomId, hotel: hotelObjectId });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Room deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
