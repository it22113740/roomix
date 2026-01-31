import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, firstName, lastName, email, phone, bio, avatar, currentPassword, newPassword } = body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone || undefined;
    if (bio !== undefined) user.bio = bio || undefined;
    if (avatar !== undefined) user.avatar = avatar || undefined;

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      user.password = newPassword; // Will be hashed by pre-save hook
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        data: serializeUser(user.toObject()),
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (PUT /api/auth/profile):", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
