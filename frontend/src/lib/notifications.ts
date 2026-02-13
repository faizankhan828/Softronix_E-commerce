
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get the VAPID Public Key from the backend
    const response = await fetch(`${API_URL}/push/vapid-key`);
    const { publicKey } = await response.json();
    
    if (!publicKey) {
        throw new Error('No VAPID public key returned from server.');
    }

    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // Subscribe the user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // Send the subscription to your backend
    await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'content-type': 'application/json'
      }
    });
    
    console.log('Push Subscription successful:', subscription);
    return subscription;

  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    throw error;
  }
}

export async function sendTestNotification() {
    try {
        await fetch(`${API_URL}/push/send-test`, {
            method: 'POST',
        });
        console.log('Test notification request sent.');
    } catch (error) {
        console.error('Error sending test notification:', error);
    }
}
