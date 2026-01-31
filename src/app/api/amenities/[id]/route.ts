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

// GET single amenity by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const amenityId = String(resolvedParams.id || "").trim();
    
    if (!amenityId || !mongoose.Types.ObjectId.isValid(amenityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid amenity ID" },
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
    const amenity = await Amenity.findOne({ _id: amenityId, hotel: hotelObjectId }).lean();
    
    if (!amenity) {
      return NextResponse.json(
        { success: false, error: "Amenity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeAmenity(amenity) }, { status: 200 });
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (GET /api/amenities/${resolvedParams.id}):`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update amenity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const amenityId = String(resolvedParams.id || "").trim();
    
    if (!amenityId || !mongoose.Types.ObjectId.isValid(amenityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid amenity ID" },
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
    
    // Verify amenity belongs to hotel
    const existingAmenity = await Amenity.findOne({ _id: amenityId, hotel: hotelObjectId });
    if (!existingAmenity) {
      return NextResponse.json(
        { success: false, error: "Amenity not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    // Convert hotel to ObjectId in update data
    const updateData = {
      ...body,
      hotel: hotelObjectId,
      updatedAt: new Date(),
    };

    const amenity = await Amenity.findByIdAndUpdate(
      amenityId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!amenity) {
      return NextResponse.json(
        { success: false, error: "Amenity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serializeAmenity(amenity) }, { status: 200 });
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (PUT /api/amenities/${resolvedParams.id}):`, error);
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

// DELETE amenity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const amenityId = String(resolvedParams.id || "").trim();
    
    if (!amenityId || !mongoose.Types.ObjectId.isValid(amenityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid amenity ID" },
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
    const amenity = await Amenity.findOneAndDelete({ _id: amenityId, hotel: hotelObjectId });

    if (!amenity) {
      return NextResponse.json(
        { success: false, error: "Amenity not found or does not belong to this hotel" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Amenity deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error(`API Error (DELETE /api/amenities/${resolvedParams.id}):`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
