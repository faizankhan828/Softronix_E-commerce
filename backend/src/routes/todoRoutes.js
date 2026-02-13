
import express from "express";
import Todo from "../models/Todo.js";

const router = express.Router();

// Get all todos
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a todo
router.post("/", async (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    completed: req.body.completed || false,
  });

  try {
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a todo
router.patch("/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    if (req.body.text != null) {
      todo.text = req.body.text;
    }
    if (req.body.completed != null) {
      todo.completed = req.body.completed;
    }

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a todo
router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json({ message: "Todo deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch Sync Route
router.post("/sync", async (req, res) => {
  try {
    const { todos } = req.body; // Expecting an array of todos
    if (!todos || !Array.isArray(todos)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const savedTodos = [];
    for (const todoData of todos) {
        // If it has an _id and exists, update it. If not, create it.
        // For simplicity in this sync demo, we'll just create new ones if they are temp IDs
        // or update if they are real IDs (if we were tracking that).
        // A common strategy is to trust the client's "created" data.
        
        // For this demo: We assume these are NEW items created offline.
        const newTodo = new Todo({
            text: todoData.text,
            completed: todoData.completed,
            createdAt: todoData.createdAt || Date.now()
        });
        const saved = await newTodo.save();
        savedTodos.push(saved);
    }
    
    res.status(201).json({ message: "Synced successfully", todos: savedTodos });
  } catch (error) {
      console.error("Sync error:", error)
    res.status(500).json({ message: "Sync failed" });
  }
});

export default router;
