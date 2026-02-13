import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";
import {
  Link,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import cookies from "../utils/cookies";

// Props interface not currently used
/*
interface AccountDeactivatedProps {
  email?: string;
}
*/

export default function AccountDeactivated() {
  const location = useLocation();
  // These variables are used in the component but TypeScript doesn't detect it
  // @ts-ignore
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // @ts-ignore
  const { logout } = useAuth();
  const { settings } = useStoreSettings();
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  // Get email from location state, search params, or undefined
  const email = location.state?.email || searchParams.get("email") || undefined;

  // Set a flag in sessionStorage to prevent redirect loops
  useEffect(() => {
    // Check if we're coming from a deactivation redirect
    const isDeactivationRedirect = sessionStorage.getItem("accountDeactivated");

    if (!isDeactivationRedirect) {
      // Set the flag to prevent future redirects in this session
      sessionStorage.setItem("accountDeactivated", "true");
    }

    // Clear all auth cookies without redirecting
    if (!hasLoggedOut) {
      cookies.clearAuthCookies();
      setHasLoggedOut(true);
    }

    // Cleanup function
    return () => {
      // Keep the flag when navigating away
    };
  }, [hasLoggedOut]);

  return (
    <div className="container mx-auto p-6 flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <CardTitle className="text-2xl">Account Deactivated</CardTitle>
          </div>
          <CardDescription className="text-base">
            Your account has been deactivated by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {email ? (
              <>
                The account associated with <strong>{email}</strong> is
                currently inactive.
              </>
            ) : (
              <>Your account is currently inactive.</>
            )}
          </p>
          <p>
            If you believe this is a mistake or would like to reactivate your
            account, please contact our customer support team for assistance.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="font-medium mb-2">Contact Support</h3>
            <p className="text-sm mb-1">Email: {settings.storeEmail}</p>
            <p className="text-sm">Phone: {settings.storePhone}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Return to Home</Link>
          </Button>
          <Button variant="default" asChild>
            <a href={`mailto:${settings.storeEmail}`}>Email Support</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
