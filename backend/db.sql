-- Drop existing tables if they exist (order matters due to foreign key constraints)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

-- Create the users table
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Create the tasks table, linking to users via user_id (if provided)
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  user_id TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TEXT,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
);

-- ========================================================================
-- Seed Data for Users
-- ========================================================================
INSERT INTO users (user_id, username, email, password_hash, created_at, updated_at)
VALUES
  ('user1', 'Alex', 'alex@example.com', 'hash_alex', '2023-10-01 09:00:00', NULL),
  ('user2', 'Jamie', 'jamie@example.com', 'hash_jamie', '2023-10-03 11:00:00', NULL),
  ('user3', 'Sam', 'sam@example.com', 'hash_sam', '2023-10-05 12:00:00', '2023-10-06 12:00:00');

-- ========================================================================
-- Seed Data for Tasks
-- ========================================================================
INSERT INTO tasks (task_id, user_id, description, status, created_at, updated_at, is_deleted, deleted_at)
VALUES
  -- Tasks associated with user1
  ('task1', 'user1', 'Buy groceries', 'Pending', '2023-10-07 08:00:00', NULL, false, NULL),
  ('task2', 'user1', 'Call plumber', 'Completed', '2023-10-07 09:00:00', '2023-10-07 10:00:00', false, NULL),
  
  -- Tasks associated with user2
  ('task3', 'user2', 'Finish homework', 'Pending', '2023-10-08 14:00:00', NULL, false, NULL),
  ('task4', 'user2', 'Pay bills', 'Completed', '2023-10-08 15:00:00', '2023-10-08 16:00:00', false, NULL),
  
  -- Task without a user_id (optional association)
  ('task5', NULL, 'Read a book', 'Pending', '2023-10-09 17:00:00', NULL, false, NULL),
  
  -- Tasks associated with user3, including one soft-deleted task
  ('task6', 'user3', 'Schedule meeting', 'Pending', '2023-10-10 12:00:00', NULL, true, '2023-10-11 12:00:00'),
  ('task7', 'user3', 'Plan weekend trip', 'Pending', '2023-10-11 09:00:00', NULL, false, NULL);