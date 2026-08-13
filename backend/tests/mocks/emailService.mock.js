const mockEmailService = {
  sendOTP: jest.fn().mockResolvedValue({
    success: true,
    message: "OTP sent successfully to your email",
    otpId: "mock-otp-id",
    development_otp: "123456",
  }),
  verifyOTP: jest.fn().mockImplementation(async (email, otpCode) => {
    const User = (await import("../../src/models/User.js")).default;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        isVerified: false,
        name: "Test User",
      });
    }

    if (otpCode && otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
      user.isVerified = true;
      await user.save();
      return {
        success: true,
        user,
        message: "OTP verified successfully",
      };
    }

    throw new Error("Invalid or expired OTP");
  }),
  resendOTP: jest.fn().mockResolvedValue({
    success: true,
    message: "OTP resent successfully",
    otpId: "mock-otp-id",
    development_otp: "654321",
  }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    success: true,
    message: "Welcome email sent (test mode)",
  }),
  sendPasswordResetOTP: jest.fn().mockResolvedValue({
    success: true,
    message: "Password reset OTP sent",
    resetId: "mock-reset-id",
    development_otp: "123456",
  }),
  verifyPasswordResetOTP: jest.fn().mockResolvedValue({
    success: true,
    user: { _id: "mock-user-id", email: "test@example.com" },
    resetId: "mock-reset-id",
  }),
  sendSOSAlert: jest.fn().mockResolvedValue({
    success: true,
    messageId: "mock-message-id",
    recipients: ["test@example.com"],
  }),
  sendBulkSOSAlerts: jest.fn().mockResolvedValue([
    {
      contact: { email: "test@example.com" },
      success: true,
      messageId: "mock-message-id",
    },
  ]),
  sendOnboardingCompleteEmail: jest.fn().mockResolvedValue({
    success: true,
    message: "Onboarding complete email sent (test mode)",
  }),
  sendProfileCompletionEmail: jest.fn().mockResolvedValue({
    success: true,
    message: "Profile completion email sent (test mode)",
  }),
  sendAccountDeletionEmail: jest.fn().mockResolvedValue({
    success: true,
    message: "Account deletion email sent (test mode)",
  }),
  sendSOSConfirmationToUser: jest.fn().mockResolvedValue({
    success: true,
    message: "SOS confirmation email sent (test mode)",
  }),
};

export default mockEmailService;
