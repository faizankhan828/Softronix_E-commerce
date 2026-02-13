import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { AlertCircle, Check, Copy, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

export default function TwoFactorAuth() {
  const { enableTwoFactorAuth, verifyTwoFactorAuth, disableTwoFactorAuth } =
    useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"setup" | "verify" | "success" | "disabled">(
    "setup"
  );

  const setupTwoFactor = async () => {
    setIsLoading(true);
    try {
      const response = await enableTwoFactorAuth();
      setSecret(response.secret);
      setQrCodeUrl(response.qrCodeUrl);
      setStep("verify");
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to set up two-factor authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode) {
      toast({
        title: "Verification code required",
        description:
          "Please enter the verification code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyTwoFactorAuth(verificationCode);
      if (response.success) {
        setStep("success");
        toast({
          title: "Two-factor authentication enabled",
          description: "Your account is now more secure with 2FA.",
        });
      } else {
        toast({
          title: "Invalid code",
          description:
            "The verification code you entered is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setIsLoading(true);
    try {
      await disableTwoFactorAuth();
      setStep("disabled");
      toast({
        title: "Two-factor authentication disabled",
        description: "2FA has been turned off for your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to disable two-factor authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Secret key has been copied to your clipboard.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {step === "setup" &&
            "Set up 2FA to add an extra layer of security to your account."}
          {step === "verify" &&
            "Verify your authenticator app to complete the setup."}
          {step === "success" &&
            "Two-factor authentication has been successfully enabled."}
          {step === "disabled" &&
            "Two-factor authentication has been disabled."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "setup" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Enhanced Security</AlertTitle>
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to
                your account by requiring a verification code in addition to
                your password.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              You'll need an authenticator app like Google Authenticator, Authy,
              or Microsoft Authenticator to complete this process.
            </p>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="border rounded-md p-2 bg-white"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="secret">Secret Key</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(secret)}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="secret"
                value={secret}
                readOnly
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                If you can't scan the QR code, enter the secret key manually in
                your authenticator app.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="Enter 6-digit code"
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
        )}

        {step === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Setup Complete</AlertTitle>
            <AlertDescription className="text-green-600">
              Two-factor authentication is now enabled for your account. You'll
              need a verification code whenever you sign in.
            </AlertDescription>
          </Alert>
        )}

        {step === "disabled" && (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-700">2FA Disabled</AlertTitle>
            <AlertDescription className="text-amber-600">
              Two-factor authentication has been disabled. Your account is now
              less secure. We recommend enabling 2FA for better security.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {step === "setup" && (
          <Button
            onClick={setupTwoFactor}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting Up..." : "Set Up Two-Factor Authentication"}
          </Button>
        )}

        {step === "verify" && (
          <div className="space-y-2 w-full">
            <Button
              onClick={verifyTwoFactor}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify & Enable 2FA"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep("setup")}
              disabled={isLoading}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === "success" && (
          <Button
            variant="destructive"
            onClick={disableTwoFactor}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Disabling..." : "Disable Two-Factor Authentication"}
          </Button>
        )}

        {step === "disabled" && (
          <Button
            onClick={() => setStep("setup")}
            disabled={isLoading}
            className="w-full"
          >
            Set Up Two-Factor Authentication Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
