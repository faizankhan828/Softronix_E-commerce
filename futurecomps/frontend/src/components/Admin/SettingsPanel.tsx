import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { useToast } from "@/components/ui/use-toast";
import settingsService from "@/api/services/settingsService";
import { useStoreSettings } from "@/context/StoreSettingsContext";
import { Loader2 } from "lucide-react";
import HomepageSettingsPanel from "./HomepageSettingsPanel";

export default function SettingsPanel() {
  const { toast } = useToast();
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: "My E-Commerce Store",
    storeEmail: "contact@mystore.com",
    storePhone: "+1 (555) 123-4567",
    storeAddress: "123 Main St, City, Country",
    currency: "USD",
    taxRate: 7.5,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    stockAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  // Use the store settings context
  const { settings: storeContextSettings, refreshSettings } =
    useStoreSettings();

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        // Update store settings from context
        setStoreSettings({
          storeName: storeContextSettings.storeName,
          storeEmail: storeContextSettings.storeEmail,
          storePhone: storeContextSettings.storePhone,
          storeAddress: storeContextSettings.storeAddress,
          currency: storeContextSettings.currency,
          taxRate: storeContextSettings.taxRate,
        });

        // Update notification settings from context
        setNotificationSettings({
          stockAlerts: storeContextSettings.notifications.stockAlerts,
        });

        // Update security settings from context
        setSecuritySettings({
          sessionTimeout: storeContextSettings.security.sessionTimeout,
          passwordExpiry: storeContextSettings.security.passwordExpiry,
        });
      } catch (error) {
        console.error("Error setting up settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [storeContextSettings, toast]);

  const handleStoreSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setStoreSettings({
      ...storeSettings,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleNotificationToggle = (setting: string, checked: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: checked,
    });
  };

  const handleSecuritySettingsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === "number" ? parseInt(value) : value,
    });
  };

  const handleSaveStoreSettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateStoreSettings(storeSettings);
      // Refresh the store settings context
      await refreshSettings();
      toast({
        title: "Settings Saved",
        description: "Store settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving store settings:", error);
      toast({
        title: "Error",
        description: "Failed to save store settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateNotificationSettings(notificationSettings);
      // Refresh the store settings context
      await refreshSettings();
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateSecuritySettings(securitySettings);
      // Refresh the store settings context
      await refreshSettings();
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast({
        title: "Error",
        description: "Failed to save security settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your store settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="mb-4">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Manage your store details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={storeSettings.storeName}
                    onChange={handleStoreSettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input
                    id="storeEmail"
                    name="storeEmail"
                    type="email"
                    value={storeSettings.storeEmail}
                    onChange={handleStoreSettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Store Phone</Label>
                  <Input
                    id="storePhone"
                    name="storePhone"
                    value={storeSettings.storePhone}
                    onChange={handleStoreSettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={storeSettings.currency}
                    onChange={handleStoreSettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Input
                  id="storeAddress"
                  name="storeAddress"
                  value={storeSettings.storeAddress}
                  onChange={handleStoreSettingsChange}
                  className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  value={storeSettings.taxRate}
                  onChange={handleStoreSettingsChange}
                  className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveStoreSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when product stock is low.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.stockAlerts}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("stockAlerts", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm font-medium">
                    Email Notifications Disabled
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Email notifications have been disabled in this application.
                    Only in-app notifications are available.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveNotificationSettings}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Two-Factor Authentication removed as requested */}
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    name="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={handleSecuritySettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time before your session expires due to inactivity.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    name="passwordExpiry"
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={handleSecuritySettingsChange}
                    className="bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-800"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days before password change is required.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="homepage">
          <HomepageSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
