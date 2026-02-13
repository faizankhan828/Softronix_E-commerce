import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useToast } from "../../components/ui/use-toast";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import settingsService, {
  UserPreferences,
} from "../../api/services/settingsService";
import { Loader2 } from "lucide-react";

// Profile form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
});

// Password change validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfileSettings() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    newsletter: true,
    marketing: true,
    accountActivity: true,
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle profile update
  const handleUpdateProfile = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        name: data.name,
        email: data.email,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle password change
  const handlePasswordChange = async (data: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({
        title: "Password Changed",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description:
          "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        // If we had a real endpoint for user preferences, we would call it here
        // For now, we'll just use the default values
        // In a real app, this would be:
        // const response = await settingsService.getUserPreferences();
        // setPreferences(response.preferences);

        // Simulate loading preferences
        setTimeout(() => {
          setPreferences({
            // @ts-ignore - These properties might not exist on the User type
            newsletter: user?.preferences?.newsletter ?? true,
            // @ts-ignore - These properties might not exist on the User type
            marketing: user?.preferences?.marketing ?? false,
            // @ts-ignore - These properties might not exist on the User type
            accountActivity: user?.preferences?.accountActivity ?? true,
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error loading preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user, toast]);

  // Handle preference toggle
  const handlePreferenceToggle = async (
    setting: keyof UserPreferences,
    checked: boolean
  ) => {
    try {
      setSaving(true);

      // Update local state immediately for better UX
      setPreferences((prev) => ({
        ...prev,
        [setting]: checked,
      }));

      // Update preferences on the server
      await settingsService.updateUserPreferences({
        [setting]: checked,
      });

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);

      // Revert the change on error
      setPreferences((prev) => ({
        ...prev,
        [setting]: !checked,
      }));

      toast({
        title: "Update Failed",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteAccount();
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        });
        // Redirect will happen automatically via AuthContext as user is set to null
      } catch (error) {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete account. Please try again.",
          variant: "destructive",
        });
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="security">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {user?.name?.slice(0, 2).toUpperCase() ||
                      user?.email?.slice(0, 2).toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{user?.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.role || "user"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit(handleUpdateProfile)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name && (
                    <p className="text-destructive text-sm">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-destructive text-sm">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    !profileForm.formState.isDirty ||
                    profileForm.formState.isSubmitting
                  }
                >
                  {profileForm.formState.isSubmitting
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-destructive text-sm">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-destructive text-sm">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    !passwordForm.formState.isDirty ||
                    passwordForm.formState.isSubmitting
                  }
                >
                  {passwordForm.formState.isSubmitting
                    ? "Changing Password..."
                    : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Newsletter</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive our newsletter with product updates and
                          offers.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.newsletter}
                        onCheckedChange={(checked) =>
                          handlePreferenceToggle("newsletter", checked)
                        }
                        disabled={saving}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive marketing and promotional emails.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={(checked) =>
                          handlePreferenceToggle("marketing", checked)
                        }
                        disabled={saving}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Account Activity</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your account activity.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.accountActivity}
                        onCheckedChange={(checked) =>
                          handlePreferenceToggle("accountActivity", checked)
                        }
                        disabled={saving}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Actions in this section can lead to permanent data loss.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-destructive/20 rounded-md p-4">
                  <h3 className="font-medium">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all of your data. This
                    action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
