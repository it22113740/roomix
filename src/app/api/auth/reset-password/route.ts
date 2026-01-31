import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { otpStore } from "@/lib/otp-store";

// POST - Verify OTP and reset password
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, otp, newPassword } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { success: false, error: "OTP is required" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = otpStore.verifyOTP(email.toLowerCase(), otp);
    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/auth/reset-password):", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
