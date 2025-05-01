// server.mjs

// Load environment variables from .env file before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Importing necessary packages
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import PostgreSQL and instantiate the pool as specified
import pkg from 'pg';
const { Pool } = pkg;const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Initialize the Express application
const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Use Morgan middleware to log incoming requests (method, URL, headers, etc.)
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/*  GET /tasks
  ------------
  This endpoint fetches all tasks from the database.
  - It optionally supports filtering based on 'status' provided as a query parameter.
  - It only returns tasks that are not soft-deleted (is_deleted = false).
*/
app.get('/tasks', async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks WHERE is_deleted = false';
    let values = [];
    // If a status filter is provided (e.g., "Pending" or "Completed"), apply it.
    if (req.query.status) {
      query += ' AND status = $1';
      values.push(req.query.status);
    }
    // Order tasks by creation time (oldest first)
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});



app.post('/tasks', async (req, res) => {
  try {
    const { description, user_id } = req.body;
    // Validate non-empty description input
    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Task description cannot be empty' });
    }
    const trimmed_description = description.trim();
    const task_id = uuidv4(); // Generate unique task id
    const created_at = new Date().toISOString(); // Get current ISO timestamp

    const query = `
      INSERT INTO tasks (task_id, user_id, description, status, created_at, is_deleted)
      VALUES ($1, $2, $3, 'Pending', $4, false)
      RETURNING *
    `;
    const values = [task_id, user_id || null, trimmed_description, created_at];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

/*
  PATCH /tasks/:task_id
  ----------------------
  This endpoint updates an existing task.
  - It supports updating the "status" (for task completion toggling) and/or "description" (for inline editing).
  - It validates that if a description is provided, it is not empty.
  - The updated_at timestamp is always updated to the current time.
  - The endpoint only updates tasks that have not been soft-deleted.
*/
app.patch('/tasks/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;
    const { status, description } = req.body;
    if (!status && !description) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    const updated_at = new Date().toISOString();
    // Build dynamic SQL query based on fields provided to update
    let query = 'UPDATE tasks SET ';
    let updates = [];
    let values = [];
    let count = 1;

    if (status) {
      updates.push(`status = $${count}`);
      values.push(status);
      count++;
    }
    if (description) {
      if (description.trim() === '') {
        return res.status(400).json({ error: 'Task description cannot be empty' });
      }
      updates.push(`description = $${count}`);
      values.push(description.trim());
      count++;
    }
    // Always update the updated_at timestamp
    updates.push(`updated_at = $${count}`);
    values.push(updated_at);
    count++;

    query += updates.join(', ');
    query += ` WHERE task_id = $${count} AND is_deleted = false RETURNING *`;
    values.push(task_id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or already deleted' });
    }
    res.json({ message: 'Task updated successfully', updated_task: result.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Error updating task' });
  }
});

/*
  DELETE /tasks/:task_id
  -------------------------
  This endpoint performs a soft-delete on a task.
  - Instead of physically removing the record, it sets "is_deleted" to true and records the "deleted_at" timestamp.
  - This allows for optional undo functionality in the future.
  - If the task is not found or is already deleted, it returns a 404 error.
*/
app.delete('/tasks/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;
    const deleted_at = new Date().toISOString();
    const query = `
      UPDATE tasks 
      SET is_deleted = true, deleted_at = $1 
      WHERE task_id = $2 AND is_deleted = false 
      RETURNING *
    `;
    const values = [deleted_at, task_id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or already deleted' });
    }
    res.json({ message: 'Task deleted successfully', task_id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
  console.log(`Server running on port 3000 and listening on 0.0.0.0`);
});/*
