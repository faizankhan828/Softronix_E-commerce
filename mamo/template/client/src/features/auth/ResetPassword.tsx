import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Progress } from "../../components/ui/progress";
import { useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

// Validation schema with password complexity requirements
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<Date | null>(null);

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      // If no token, show error and redirect to forgot password
      toast({
        title: "Invalid reset link",
        description: "The password reset link is missing a token.",
        variant: "destructive",
      });
      navigate("/auth/forgot-password");
      return;
    }

    setToken(tokenParam);

    // Validate token by making a lightweight request to check if it's valid
    const validateToken = async () => {
      setValidatingToken(true);
      try {
        // Check if token is valid by attempting to decode it
        // This is a simple check - in a real app, you might want to verify with the server
        const tokenData = tokenParam.split(".");
        if (tokenData.length !== 3) {
          throw new Error("Invalid token format");
        }

        // Try to decode the payload
        try {
          const payload = JSON.parse(atob(tokenData[1]));

          // Check if token has expiry information
          if (payload.exp) {
            const expiryDate = new Date(payload.exp * 1000);
            setTokenExpiryTime(expiryDate);

            // Check if token is expired
            if (expiryDate < new Date()) {
              setTokenExpired(true);
              toast({
                title: "Reset link expired",
                description:
                  "This password reset link has expired. Please request a new one.",
                variant: "destructive",
              });
            }
          }
        } catch (e) {
          // If we can't decode the token, we'll just continue and let the server validate it
          console.log("Could not decode token, will rely on server validation");
        }
      } catch (error) {
        console.error("Token validation error:", error);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [location, navigate, toast]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Calculate password strength
  const password = watch("password");
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 20;
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 20;
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 20;
    // Number check
    if (/[0-9]/.test(password)) strength += 20;
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    setPasswordStrength(strength);
  }, [password]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;

    // Don't allow submission if token is expired
    if (tokenExpired) {
      toast({
        title: "Reset link expired",
        description:
          "This password reset link has expired. Please request a new one.",
        variant: "destructive",
      });
      navigate("/auth/forgot-password");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      // Check if the error is due to token expiration
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data &&
        error.response.data.message &&
        error.response.data.message.includes("expired")
      ) {
        setTokenExpired(true);
        toast({
          title: "Reset link expired",
          description:
            "This password reset link has expired. Please request a new one.",
          variant: "destructive",
        });
        // Redirect to forgot password page after a short delay
        setTimeout(() => {
          navigate("/auth/forgot-password");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description:
            "The password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Password Reset Successful</h1>
          <p className="text-muted-foreground">
            Your password has been updated. You will be redirected to the login
            page shortly.
          </p>
        </div>
        <Link to="/auth" className="w-full">
          <Button className="w-full">Go to Login</Button>
        </Link>
      </div>
    );
  }

  // Show loading state while validating token
  if (validatingToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Validating Reset Link</h1>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">
            Please wait while we validate your password reset link...
          </p>
        </div>
      </div>
    );
  }

  // Show expired token message
  if (tokenExpired) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Reset Link Expired</h1>
          <p className="text-muted-foreground">
            This password reset link has expired. Reset links are valid for 30
            minutes.
          </p>
          <p className="text-muted-foreground">
            Please request a new password reset link.
          </p>
          <Link to="/auth/forgot-password" className="w-full">
            <Button className="w-full mt-4">Request New Reset Link</Button>
          </Link>
        </div>
        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-muted-foreground">
          Please enter your new password below.
        </p>
        {tokenExpiryTime && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            This reset link will expire on {tokenExpiryTime.toLocaleString()}.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
          <div className="space-y-1">
            <Progress value={passwordStrength} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Password strength:{" "}
              {passwordStrength === 0
                ? "Very Weak"
                : passwordStrength <= 40
                ? "Weak"
                : passwordStrength <= 80
                ? "Moderate"
                : "Strong"}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || passwordStrength < 60}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting Password...
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>
        {passwordStrength < 60 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Please create a stronger password to continue
          </p>
        )}
      </form>
      <div className="text-center">
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
