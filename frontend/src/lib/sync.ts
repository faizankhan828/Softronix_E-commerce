
// Basic Offline Sync Logic
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Todo {
    text: string;
    completed: boolean;
    _id?: string;
    tempId?: string; // For offline creation
    createdAt?: Date;
}

export const syncService = {
    // Save to local storage
    saveLocally: (todo: Todo) => {
        const existing = JSON.parse(localStorage.getItem('offline_todos') || '[]');
        existing.push({ ...todo, tempId: Date.now().toString(), createdAt: new Date() });
        localStorage.setItem('offline_todos', JSON.stringify(existing));
    },

    // Get offline data
    getOfflineData: (): Todo[] => {
        return JSON.parse(localStorage.getItem('offline_todos') || '[]');
    },

    // Check online status and sync
    syncData: async () => {
        if (!navigator.onLine) return; // Still offline

        const offlineTodos = JSON.parse(localStorage.getItem('offline_todos') || '[]');

        if (offlineTodos.length === 0) return; // Nothing to sync

        try {
            console.log('Syncing offline data...', offlineTodos);
            const response = await fetch(`${API_URL}/todos/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ todos: offlineTodos }),
            });

            if (response.ok) {
                console.log('Sync successful, clearing local storage.');
                localStorage.removeItem('offline_todos');
                return true; // Sync happened
            } else {
                console.error('Sync failed:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    }
};
