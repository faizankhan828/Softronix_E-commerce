import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "../../utils/emailService";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setEmailError(null);
    setUserEmail(data.email);

    try {
      // Get reset token from backend
      const response = await forgotPassword({ email: data.email });

      // Check if a token was returned (only happens for existing users)
      if (response.token) {
        setResetToken(response.token);

        // Send email with reset token
        setEmailSending(true);
        try {
          const emailResult = await sendPasswordResetEmail(
            data.email,
            response.token
          );

          if (emailResult.success) {
            setEmailSent(true);
            toast({
              title: "Password Reset Email Sent",
              description:
                "Check your email for a link to reset your password.",
            });
          } else {
            console.error("Email sending failed:", emailResult.error);

            // Extract meaningful error message
            const errorMessage = emailResult.error?.toString() || "";
            let userFriendlyError =
              "We couldn't send the email. Please try again or contact support.";

            // Handle specific error cases
            if (
              errorMessage.includes("service_id") ||
              errorMessage.includes("template_id") ||
              errorMessage.includes("Public Key is invalid")
            ) {
              userFriendlyError =
                "Our email service is currently unavailable. Please try again later or contact support.";
              setEmailError("Email service configuration error");
            } else if (errorMessage.includes("recipient")) {
              userFriendlyError =
                "There was an issue with the email address provided. Please check your email and try again.";
              setEmailError("Invalid recipient email");
            } else {
              setEmailError("Email delivery failed");
            }

            toast({
              title: "Email Not Sent",
              description: userFriendlyError,
              variant: "destructive",
            });
          }
        } catch (emailError: any) {
          console.error("Error sending email:", emailError);
          setEmailError("Unexpected email error");
          toast({
            title: "Email Sending Error",
            description:
              "An unexpected error occurred while sending the email. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setEmailSending(false);
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!resetToken || !userEmail) return;

    setEmailSending(true);
    setEmailError(null);

    try {
      const emailResult = await sendPasswordResetEmail(userEmail, resetToken);

      if (emailResult.success) {
        setEmailSent(true);
        toast({
          title: "Password Reset Email Resent",
          description: "Please check your inbox for the reset link.",
        });
      } else {
        setEmailError("Email delivery failed");
        toast({
          title: "Email Not Sent",
          description:
            "We couldn't send the email. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setEmailError("Unexpected email error");
      toast({
        title: "Email Sending Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setEmailSending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Password Reset</h1>
          {resetToken ? (
            <>
              {emailSent ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md mb-4">
                  <p className="text-green-800 dark:text-green-300 font-medium">
                    Password reset email sent!
                  </p>
                  <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                    Check your inbox for instructions to reset your password.
                    The link will expire in 30 minutes.
                  </p>
                </div>
              ) : emailSending ? (
                <div className="flex items-center justify-center space-x-2 my-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p>Sending email...</p>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-amber-800 dark:text-amber-300 font-medium">
                      {emailError || "Email Delivery Issue"}
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                      We couldn't send the reset link to your email. You can try
                      sending it again or contact support.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendEmail}
                      disabled={emailSending}
                      className="mt-2 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-800/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground mt-4">
                If you don't receive the email:
              </p>
              <ul className="text-sm text-left list-disc pl-5 mt-2 text-muted-foreground">
                <li>Check your spam or junk folder</li>
                <li>Verify that {userEmail} is correct</li>
                <li>Try again in a few minutes</li>
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground">
              If an account exists with that email, a password reset link has
              been sent. Please check your inbox.
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-4 w-full">
          <p className="text-center text-sm text-muted-foreground">
            Need to try again?{" "}
            <button
              className="text-primary underline"
              onClick={() => {
                setIsSubmitted(false);
                setEmailError(null);
                setResetToken(null);
                setEmailSent(false);
              }}
            >
              Go back
            </button>
          </p>
          <Link to="/auth" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-muted-foreground">
          Enter your email address to receive a password reset link. We'll send
          you an email with instructions to reset your password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Send Password Reset Link"
          )}
        </Button>
      </form>
      <div className="text-center">
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
