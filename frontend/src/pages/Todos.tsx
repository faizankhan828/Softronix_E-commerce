
import { useState, useEffect } from 'react';
import { subscribeToPush, sendTestNotification } from '../lib/notifications';
import { syncService } from '../lib/sync';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  isOffline?: boolean;
}

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for online/offline status
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // Try to sync when back online
        syncService.syncData().then((didSync) => {
            if (didSync) fetchTodos();
        });
      }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    fetchTodos();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const fetchTodos = async () => {
    try {
        // First, check if we have any pending offline items that haven't been synced locally yet?
        // Actually, let's just fetch from server.
        if (navigator.onLine) {
             const response = await fetch(`${API_URL}/todos`);
             if (response.ok) {
                const data = await response.json();
                setTodos(data);
             }
        }
        
        // Also merge with offline data for display?
        // For simplicity, we might just show online data + offline data
        // But `syncService` clears offline data after sync.
        
        // Let's implement a simple merged view:
        // If online: standard fetch.
        // If offline: Show what was last fetched (if we cached it - skipping for now) + unsynced items.
        
        if (!navigator.onLine) {
            const offlineItems = syncService.getOfflineData();
            // We'd ideally want to show cached server items too, but for this demo, 
            // we'll mainly show the ones created while offline.
             setTodos((prev) => [...prev, ...offlineItems.map((item: any) => ({ ...item, _id: item.tempId, isOffline: true }))]);
        }
       
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todoData = { text: newTodo, completed: false };

    if (navigator.onLine) {
      try {
        const response = await fetch(`${API_URL}/todos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todoData),
        });
        const data = await response.json();
        setTodos([data, ...todos]);
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    } else {
        // Offline Mode
        syncService.saveLocally(todoData);
        // Optimistically update UI
        setTodos([{ ...todoData, _id: Date.now().toString(), isOffline: true }, ...todos]);
    }
    setNewTodo('');
  };

  const enableNotifications = async () => {
    try {
      await subscribeToPush();
      alert('Notifications enabled!');
    } catch (error) {
      alert('Failed to enable notifications. Ensure VAPID keys are set.');
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">PWA & Offline Todo Details</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">PWA Notifications</h2>
        <div className="flex gap-2">
            <button 
                onClick={enableNotifications}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Enable Notifications
            </button>
            <button 
                onClick={sendTestNotification}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
                Send Test Notification
            </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Todo List</h2>
          <span className={`px-2 py-1 rounded text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? 'Online' : 'Offline'}
          </span>
      </div>

      <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New task..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo._id} className="p-3 bg-white border rounded shadow flex justify-between items-center">
            <span>{todo.text}</span>
            {todo.isOffline && <span className="text-xs text-orange-500 font-medium">Unsynced</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
