import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingButton } from "../components/ui/LoadingButton";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { Logo } from "../components/ui/Logo";

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

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
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
      loginForm.setError("root", {
        message: error.response?.data?.message || "Invalid email or password. Please try again.",
      });
    }
  };

  // Handle register submit
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await register(values.name, values.email, values.password);
      navigate("/");
    } catch (error: any) {
      registerForm.setError("root", {
        message: error.response?.data?.message || "This email may already be registered. Please try again.",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="max-h-16" />
          </div>
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account or create a new one
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              {loginForm.formState.errors.root && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {loginForm.formState.errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="your@email.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <LoadingButton
                type="submit"
                className="w-full"
                loading={loginForm.formState.isSubmitting}
                loadingText="Signing in..."
              >
                Sign in
              </LoadingButton>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-4"
            >
              {registerForm.formState.errors.root && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {registerForm.formState.errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  placeholder="your@email.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="******"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="******"
                  {...registerForm.register("confirmPassword")}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <LoadingButton
                type="submit"
                className="w-full"
                loading={registerForm.formState.isSubmitting}
                loadingText="Creating account..."
              >
                Create account
              </LoadingButton>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
