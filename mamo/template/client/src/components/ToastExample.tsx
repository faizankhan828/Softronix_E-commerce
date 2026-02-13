// React import not needed
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export function ToastExample() {
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

  const showInfoToast = () => {
    toast({
      title: "Information",
      description: "Here's some information you might find useful.",
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h2 className="text-2xl font-bold mb-4">Toast Examples</h2>
      <div className="flex gap-4">
        <Button onClick={showSuccessToast}>Show Success Toast</Button>
        <Button onClick={showErrorToast} variant="destructive">
          Show Error Toast
        </Button>
        <Button onClick={showInfoToast} variant="outline">
          Show Info Toast
        </Button>
      </div>
    </div>
  );
}
