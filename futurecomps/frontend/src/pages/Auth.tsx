import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { cn } from "@/lib/utils";

// Login validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Input focus state type
type FocusState = "none" | "email" | "name" | "password" | "confirmPassword";

// Underline Input Component with focus callback
interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  onFocusChange?: (focused: boolean) => void;
}

function UnderlineInput({
  label,
  error,
  className,
  type,
  onFocusChange,
  ...props
}: UnderlineInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const hasValue = props.value && String(props.value).length > 0;

  return (
    <div className="relative">
      <label
        className={cn(
          "text-xs font-medium transition-colors duration-200",
          isFocused || hasValue ? "text-orange-500" : "text-gray-500",
        )}
      >
        {label}
      </label>
      <div className="relative mt-1">
        <input
          {...props}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          onFocus={(e) => {
            setIsFocused(true);
            onFocusChange?.(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onFocusChange?.(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full py-2.5 bg-transparent border-b-2 outline-none transition-all duration-200",
            "text-gray-900 text-base font-medium tracking-wide",
            "placeholder:text-gray-400 placeholder:font-normal",
            isFocused ? "border-orange-500" : "border-gray-300",
            isPassword && "pr-10",
            className,
          )}
          style={{
            caretColor: "#f97316",
            fontSize: "16px",
            color: "#111827",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Interactive Character SVG Component - Eyes follow mouse and react to inputs
interface CharacterIllustrationProps {
  mouseX: number;
  mouseY: number;
  focusedField: FocusState;
}

function CharacterIllustration({
  mouseX,
  mouseY,
  focusedField,
}: CharacterIllustrationProps) {
  // Calculate eye offset based on mouse position (limited range)
  const maxOffset = 4;
  const eyeOffsetX = Math.max(
    -maxOffset,
    Math.min(maxOffset, (mouseX - 200) / 50),
  );
  const eyeOffsetY = Math.max(
    -maxOffset,
    Math.min(maxOffset, (mouseY - 150) / 50),
  );

  // Determine if characters should hide eyes (password fields)
  const isPasswordFocused =
    focusedField === "password" || focusedField === "confirmPassword";
  const isEmailOrNameFocused =
    focusedField === "email" || focusedField === "name";

  // When email focused, eyes look right (toward form)
  const lookAtFormX = isEmailOrNameFocused ? 6 : eyeOffsetX;
  const lookAtFormY = isEmailOrNameFocused ? 2 : eyeOffsetY;

  return (
    <svg viewBox="0 0 400 350" className="w-full max-w-xl">
      {/* Purple Rectangle Character */}
      <motion.g
        animate={{
          y: [0, -8, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M120 50 Q120 30 140 30 L200 30 Q220 30 220 50 L220 180 Q220 200 200 200 L140 200 Q120 200 120 180 Z"
          fill="#7C3AED"
          className="drop-shadow-lg"
        />
        {/* Eyes - follow mouse or hide for password */}
        {isPasswordFocused ? (
          // Hands covering eyes
          <>
            <motion.ellipse
              cx="155"
              cy="100"
              rx="15"
              ry="10"
              fill="#7C3AED"
              stroke="#6D28D9"
              strokeWidth="2"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.ellipse
              cx="185"
              cy="100"
              rx="15"
              ry="10"
              fill="#7C3AED"
              stroke="#6D28D9"
              strokeWidth="2"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </>
        ) : (
          // Normal eyes that follow
          <motion.g
            animate={{ x: lookAtFormX, y: lookAtFormY }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <circle cx="155" cy="100" r="6" fill="#1F2937" />
            <circle cx="185" cy="100" r="6" fill="#1F2937" />
          </motion.g>
        )}
        {/* Mouth */}
        <path
          d="M155 130 Q170 120 185 130"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </motion.g>

      {/* Orange Circle Character */}
      <motion.g
        animate={{
          y: [0, -5, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <ellipse
          cx="130"
          cy="280"
          rx="90"
          ry="70"
          fill="#F97316"
          className="drop-shadow-lg"
        />
        {/* Eyes */}
        {isPasswordFocused ? (
          // Covering eyes with "hands"
          <>
            <motion.ellipse
              cx="105"
              cy="260"
              rx="12"
              ry="8"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.ellipse
              cx="135"
              cy="260"
              rx="12"
              ry="8"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </>
        ) : (
          <motion.g
            animate={{ x: lookAtFormX * 1.2, y: lookAtFormY * 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <circle cx="105" cy="260" r="7" fill="#1F2937" />
            <circle cx="155" cy="260" r="7" fill="#1F2937" />
          </motion.g>
        )}
        {/* Mouth */}
        <path
          d="M110 295 Q130 310 150 295"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </motion.g>

      {/* Grey Rectangle Character */}
      <motion.g
        animate={{
          y: [0, -6, 0],
          rotate: [0, 1, -1, 0],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <rect
          x="200"
          y="160"
          width="70"
          height="120"
          rx="10"
          fill="#374151"
          className="drop-shadow-lg"
        />
        {/* Eyes */}
        {isPasswordFocused ? (
          // Closed eyes (lines)
          <>
            <motion.path
              d="M212 200 L228 200"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M242 200 L258 200"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </>
        ) : (
          <>
            <circle cx="220" cy="200" r="6" fill="white" />
            <circle cx="250" cy="200" r="6" fill="white" />
            <motion.g
              animate={{ x: lookAtFormX * 0.5, y: lookAtFormY * 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <circle cx="222" cy="200" r="3" fill="#374151" />
              <circle cx="252" cy="200" r="3" fill="#374151" />
            </motion.g>
          </>
        )}
      </motion.g>

      {/* Yellow Pill Character */}
      <motion.g
        animate={{
          y: [0, -10, 0],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <rect
          x="280"
          y="180"
          width="60"
          height="120"
          rx="30"
          fill="#FBBF24"
          className="drop-shadow-lg"
        />
        {/* Eyes */}
        {isPasswordFocused ? (
          // Peeking through fingers
          <>
            <motion.ellipse
              cx="298"
              cy="220"
              rx="10"
              ry="6"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="2"
              initial={{ y: 15 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.ellipse
              cx="322"
              cy="220"
              rx="10"
              ry="6"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="2"
              initial={{ y: 15 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
            {/* One eye peeking */}
            <motion.circle
              cx="322"
              cy="220"
              r="2"
              fill="#1F2937"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </>
        ) : (
          <motion.g
            animate={{ x: lookAtFormX * 0.6, y: lookAtFormY * 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <circle cx="298" cy="220" r="4" fill="#1F2937" />
            <circle cx="322" cy="220" r="4" fill="#1F2937" />
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusState>("none");
  const [mousePos, setMousePos] = useState({ x: 200, y: 175 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get("redirectTo");
      navigate(redirectTo || "/");
    }
  }, [user, navigate, location]);

  // Mouse tracking for character eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submit
  const handleLogin = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (error: any) {
      // Check if email is not verified
      if (error.response?.data?.isVerified === false) {
        try {
          // Resend OTP for verification
          const { authAPI } = await import("../services/api");
          await authAPI.resendOTP({ email: values.email });
          // Redirect to OTP verification page
          navigate("/verify-otp", { state: { email: values.email } });
        } catch (resendError: any) {
          loginForm.setError("root", {
            message:
              resendError.response?.data?.message ||
              "Failed to send verification code. Please try again.",
          });
        }
        return;
      }
      loginForm.setError("root", {
        message:
          error.response?.data?.message ||
          "Invalid email or password. Please try again.",
      });
    }
  };

  // Handle register submit
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await register(values.name, values.email, values.password);
      // Redirect to OTP verification page after registration
      navigate("/verify-otp", { state: { email: values.email } });
    } catch (error: any) {
      registerForm.setError("root", {
        message:
          error.response?.data?.message ||
          "This email may already be registered. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left Side - Illustration */}
      <div
        ref={containerRef}
        className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 p-12"
      >
        <CharacterIllustration
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          focusedField={focusedField}
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="md" animated={true} />
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === "login" ? "Welcome back!" : "Create account"}
            </h1>
            <p className="text-gray-500 text-sm">
              {activeTab === "login"
                ? "Please enter your details"
                : "Fill in your information to get started"}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Login Form */}
            {activeTab === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-6"
              >
                {loginForm.formState.errors.root && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {loginForm.formState.errors.root.message}
                  </motion.div>
                )}

                <UnderlineInput
                  label="Email"
                  type="email"
                  placeholder="anna@gmail.com"
                  {...loginForm.register("email")}
                  value={loginForm.watch("email")}
                  error={loginForm.formState.errors.email?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "email" : "none")
                  }
                />

                <UnderlineInput
                  label="Password"
                  type="password"
                  placeholder="••••••••••"
                  {...loginForm.register("password")}
                  value={loginForm.watch("password")}
                  error={loginForm.formState.errors.password?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "password" : "none")
                  }
                />

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">
                      Remember for 30 days
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <motion.button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full py-3.5 rounded-full font-medium text-white transition-all duration-200",
                    "bg-neutral-900 hover:bg-neutral-800",
                    "disabled:opacity-70 disabled:cursor-not-allowed",
                  )}
                >
                  {loginForm.formState.isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    "Login"
                  )}
                </motion.button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-gray-700">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </motion.form>
            )}

            {/* Register Form */}
            {activeTab === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-5"
              >
                {registerForm.formState.errors.root && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {registerForm.formState.errors.root.message}
                  </motion.div>
                )}

                <UnderlineInput
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  {...registerForm.register("name")}
                  value={registerForm.watch("name")}
                  error={registerForm.formState.errors.name?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "name" : "none")
                  }
                />

                <UnderlineInput
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  {...registerForm.register("email")}
                  value={registerForm.watch("email")}
                  error={registerForm.formState.errors.email?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "email" : "none")
                  }
                />

                <UnderlineInput
                  label="Password"
                  type="password"
                  placeholder="••••••••••"
                  {...registerForm.register("password")}
                  value={registerForm.watch("password")}
                  error={registerForm.formState.errors.password?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "password" : "none")
                  }
                />

                <UnderlineInput
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••••"
                  {...registerForm.register("confirmPassword")}
                  value={registerForm.watch("confirmPassword")}
                  error={registerForm.formState.errors.confirmPassword?.message}
                  onFocusChange={(focused) =>
                    setFocusedField(focused ? "confirmPassword" : "none")
                  }
                />

                {/* Register Button */}
                <motion.button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full py-3.5 rounded-full font-medium text-white transition-all duration-200",
                    "bg-neutral-900 hover:bg-neutral-800",
                    "disabled:opacity-70 disabled:cursor-not-allowed",
                  )}
                >
                  {registerForm.formState.isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    "Create Account"
                  )}
                </motion.button>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
