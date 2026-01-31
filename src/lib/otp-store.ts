/**
 * In-memory OTP store with expiration
 * In production, consider using Redis or a database for better scalability
 */

interface OTPData {
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

class OTPStore {
  private store: Map<string, OTPData> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP for an email
   */
  setOTP(email: string, otp: string): void {
    const expiresAt = Date.now() + this.OTP_EXPIRY;
    this.store.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      otp,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired OTPs periodically
    this.cleanup();
  }

  /**
   * Verify OTP for an email
   */
  verifyOTP(email: string, otp: string): boolean {
    const emailKey = email.toLowerCase();
    const data = this.store.get(emailKey);

    if (!data) {
      return false;
    }

    // Check if OTP has expired
    if (Date.now() > data.expiresAt) {
      this.store.delete(emailKey);
      return false;
    }

    // Check if max attempts exceeded
    if (data.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(emailKey);
      return false;
    }

    // Increment attempts
    data.attempts++;

    // Verify OTP
    if (data.otp === otp) {
      // OTP verified successfully, remove it
      this.store.delete(emailKey);
      return true;
    }

    // If max attempts reached after this failed attempt, remove OTP
    if (data.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(emailKey);
    }

    return false;
  }

  /**
   * Get OTP data (for debugging/admin purposes)
   */
  getOTPData(email: string): OTPData | null {
    const data = this.store.get(email.toLowerCase());
    if (!data || Date.now() > data.expiresAt) {
      return null;
    }
    return data;
  }

  /**
   * Remove OTP for an email
   */
  removeOTP(email: string): void {
    this.store.delete(email.toLowerCase());
  }

  /**
   * Clean up expired OTPs
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [email, data] of this.store.entries()) {
      if (now > data.expiresAt) {
        this.store.delete(email);
      }
    }
  }

  /**
   * Clear all OTPs (useful for testing)
   */
  clearAll(): void {
    this.store.clear();
  }
}

// Export singleton instance
export const otpStore = new OTPStore();
