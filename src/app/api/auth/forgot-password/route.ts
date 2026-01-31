import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";
import { otpStore } from "@/lib/otp-store";

// POST - Send OTP to email
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      // Return success even if user doesn't exist
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, an OTP has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate OTP
    const otp = otpStore.generateOTP();
    
    // Store OTP
    otpStore.setOTP(email.toLowerCase(), otp);

    // Send OTP email
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
    } catch (emailError: any) {
      console.error("Error sending OTP email:", emailError);
      // Remove OTP if email fails
      otpStore.removeOTP(email.toLowerCase());
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send OTP email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP has been sent to your email address.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/auth/forgot-password):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
