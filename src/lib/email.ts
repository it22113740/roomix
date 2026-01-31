import nodemailer from "nodemailer";

// Email transporter configuration
// Supports Gmail, Brevo, SendGrid, and other SMTP services
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true"; // true for 465, false for other ports
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // For Brevo, use smtp-relay.brevo.com
  // The SMTP_USER should be your Brevo account email
  // The SMTP_PASSWORD should be your Brevo SMTP key (not your account password)
  
  const config: any = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };

  // For Brevo, we might need to set requireTLS
  if (host.includes("brevo.com") || host.includes("sendinblue.com")) {
    config.requireTLS = true;
    config.tls = {
      rejectUnauthorized: false, // Allow self-signed certificates if needed
    };
  }

  return nodemailer.createTransport(config);
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("Email configuration missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.");
      throw new Error("Email service not configured");
    }

    const transporter = createTransporter();

    // Use SMTP_FROM if provided, otherwise use SMTP_USER
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"Roomix" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Plain text fallback
    };

    // Verify connection before sending
    await transporter.verify();
    console.log("SMTP server connection verified");

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Provide more helpful error messages
    if (error.code === "EAUTH") {
      throw new Error(
        "SMTP authentication failed. Please check your SMTP_USER and SMTP_PASSWORD. " +
        "For Brevo, make sure you're using your SMTP key (not your account password)."
      );
    }
    
    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      throw new Error(
        "Could not connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT settings."
      );
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Helper function to send OTP email
export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Roomix</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Password Reset Request</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset OTP</h2>
          <p style="color: #4b5563;">You have requested to reset your password. Please use the following OTP to complete the process:</p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">If you didn't request this password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} Roomix. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset OTP - Roomix",
    html,
  });
};
