import emailjs from "@emailjs/browser";

// Email.js configuration from environment variables
const EMAIL_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAIL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize Email.js with public key
if (EMAIL_PUBLIC_KEY) {
  emailjs.init(EMAIL_PUBLIC_KEY);
  console.log("Email.js initialized with public key");
}

interface SendEmailParams {
  to_email: string;
  to_name?: string;
  subject?: string;
  message?: string;
  reset_link?: string;
}

/**
 * Send an email using Email.js
 * @param params Email parameters
 * @returns Promise with the result
 */
export const sendEmail = async (
  params: SendEmailParams
): Promise<{ success: boolean; error?: any }> => {
  try {
    if (!EMAIL_SERVICE_ID || !EMAIL_TEMPLATE_ID || !EMAIL_PUBLIC_KEY) {
      console.error("Email.js configuration is missing");
      return {
        success: false,
        error:
          "Email service configuration is missing. Please check your environment variables.",
      };
    }

    // Create a template parameters object - keep it simple and match exactly what the template expects
    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name || params.to_email.split("@")[0],
      subject: params.subject || "Message from your store",
      message: params.message || "",
      reset_link: params.reset_link || "",
      from_name: import.meta.env.VITE_STORE_NAME || "Mamo Store",
      reply_to: "noreply@example.com",
    };

    console.log("Sending email with params:", {
      serviceId: EMAIL_SERVICE_ID,
      templateId: EMAIL_TEMPLATE_ID,
    });

    // Use the send method with properly formatted parameters
    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      templateParams,
      EMAIL_PUBLIC_KEY // Explicitly pass public key as the 4th parameter
    );

    console.log("Email sent successfully:", response);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
};

/**
 * Send a password reset email
 * @param email Recipient email
 * @param token Reset token
 * @param name Recipient name (optional)
 * @returns Promise with the result
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  name?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Check configuration
    if (!EMAIL_SERVICE_ID || !EMAIL_TEMPLATE_ID || !EMAIL_PUBLIC_KEY) {
      console.error("Email.js configuration is missing");
      return {
        success: false,
        error:
          "Email service configuration is missing. Please check your environment variables.",
      };
    }

    // Create the reset link with the token
    const resetLink = `${window.location.origin}/auth/reset-password?token=${token}`;
    console.log("Sending password reset email to:", email);
    console.log("Reset link:", resetLink);

    // Format parameters to exactly match the Email.js template variables
    // EmailJS specifically expects specific parameter names
    const templateParams = {
      to_email: email,
      user_email: email, // Try alternative parameter name
      email: email, // Try another alternative parameter name
      recipient: email, // Try another alternative parameter name
      to_name: name || email.split("@")[0] || "User",
      user_name: name || email.split("@")[0] || "User", // Alternative
      subject: "Password Reset Request",
      title: "Password Reset Request", // Alternative
      message:
        "You requested a password reset. Please click the link below to reset your password. This link will expire in 30 minutes.",
      reset_link: resetLink,
      reset_url: resetLink, // Alternative
      link: resetLink, // Alternative
      from_name: import.meta.env.VITE_STORE_NAME || "Mamo Store",
      reply_to: "noreply@example.com",
    };

    // For debugging
    console.log("Email parameters:", templateParams);

    // Try the Email.js test approach from the troubleshooting guide
    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      templateParams,
      EMAIL_PUBLIC_KEY // Explicitly pass the public key
    );

    console.log("Password reset email sent successfully:", response);
    return { success: true };
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);

    // Return error but still show token to user as fallback
    return { success: false, error };
  }
};

export default {
  sendEmail,
  sendPasswordResetEmail,
};
