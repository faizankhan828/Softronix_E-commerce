import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";


const FixedDialog = ({ children, onCloseComplete, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & { onCloseComplete?: () => void }) => {
  // Use a ref to track if the dialog is closing
  const isClosingRef = React.useRef(false);
  
  // Handle the state change event
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      isClosingRef.current = true;
      
      // Call the original onOpenChange if provided
      if (props.onOpenChange) {
        props.onOpenChange(open);
      }
      
      // Use requestAnimationFrame to ensure the dialog is fully closed
      // before calling onCloseComplete
      requestAnimationFrame(() => {
        if (onCloseComplete) {
          onCloseComplete();
        }
        isClosingRef.current = false;
      });
    } else {
      if (props.onOpenChange) {
        props.onOpenChange(open);
      }
    }
  };
  
  return (
    <DialogPrimitive.Root
      {...props}
      onOpenChange={handleOpenChange}
    >
      {children}
    </DialogPrimitive.Root>
  );
};
FixedDialog.displayName = "FixedDialog";

// Re-export all the other components from the original dialog.tsx




export { FixedDialog };
