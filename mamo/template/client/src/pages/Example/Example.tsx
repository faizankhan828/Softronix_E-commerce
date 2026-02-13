import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ToastExample } from "@/components/ToastExample";

export default function Example() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error!",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">UI Components Examples</h1>
        <p className="text-muted-foreground">
          This page showcases the various UI components used in the application.
        </p>
      </div>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Toast Notifications</h2>
        <p className="text-muted-foreground">
          Toast notifications provide feedback to users after an action has been
          performed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Basic Usage</h3>
            <div className="space-y-2">
              <Button onClick={showSuccessToast}>Show Success Toast</Button>
              <Button variant="destructive" onClick={showErrorToast}>
                Show Error Toast
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Toast Component</h3>
            <ToastExample />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Mock Data</h2>
        <p className="text-muted-foreground">
          The application will automatically use mock data when the server is
          unavailable.
        </p>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Features</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Automatic fallback to mock data when API is unreachable</li>
            <li>Seamless user experience even when server is down</li>
            <li>Local data manipulation for cart and wishlist</li>
            <li>Toast notifications when using mock data</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
