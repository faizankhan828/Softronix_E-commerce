/**
 * This module provides a global fix for UI responsiveness issues
 * that can occur after closing dialogs or modals.
 */

// Function to fix UI responsiveness
export function fixUI() {
  // Reset pointer events on body
  document.body.style.pointerEvents = "";

  // Reset any modal backdrop that might be stuck, but don't affect dropdowns
  const modalBackdrops = document.querySelectorAll(
    '[data-state="closed"][role="dialog"]'
  );
  modalBackdrops.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.display = "none";
      el.style.pointerEvents = "none";
    }
  });

  // Remove any aria-hidden attributes from the body
  document.body.removeAttribute("aria-hidden");

  // Reset any overflow hidden on body
  document.body.style.overflow = "";

  // Reset any inert attributes
  document.querySelectorAll("[inert]").forEach((el) => {
    el.removeAttribute("inert");
  });

  // Force a reflow
  document.body.getBoundingClientRect();
}

// Set up a global keyboard shortcut to fix UI (Shift+Escape)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && e.shiftKey) {
    fixUI();
  }
});

// Set up a MutationObserver to detect when dialogs close
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName === "data-state" &&
      mutation.target instanceof HTMLElement
    ) {
      const state = mutation.target.getAttribute("data-state");
      if (
        state === "closed" &&
        mutation.target.getAttribute("role") === "dialog"
      ) {
        // Wait a short time to ensure the dialog is fully closed
        setTimeout(fixUI, 100);
      }
    }
  });
});

// Start observing the document
observer.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ["data-state"],
});

// Export a function to initialize the fix
export function initUIFix() {
  // Nothing to do here, the module self-initializes
  return {
    fixUI,
    cleanup: () => {
      observer.disconnect();
    },
  };
}
