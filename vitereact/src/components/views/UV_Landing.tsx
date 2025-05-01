import React, { useEffect, useState, KeyboardEvent, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  set_task_input_text,
  set_input_error,
  add_task,
  toggle_task_completion,
  delete_task,
  start_editing,
  save_edit,
  cancel_edit,
  set_active_filter,
  set_notification,
  clear_notification
} from "@/store/main";
import type { RootState, Task } from "@/store/main";

const UV_Landing: React.FC = () => {
  const dispatch = useDispatch();
  const {
    tasks,
    task_input_text,
    input_error,
    active_filter,
    editing_task_id,
    edited_task_text,
    notification,
  } = useSelector((state: RootState) => state);

  const [searchParams, setSearchParams] = useSearchParams();
  const [local_edit_value, setLocalEdit_value] = useState<string>("");
  const [last_deleted_task, setLastDeletedTask] = useState<Task | null>(null);

  // Initialize active_filter from URL parameters if provided.
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (
      filterParam &&
      (filterParam === "all" || filterParam === "active" || filterParam === "completed")
    ) {
      dispatch(set_active_filter(filterParam));
    }
  }, [searchParams, dispatch]);

  // When editing mode is entered, sync our local edit value with the global state.
  useEffect(() => {
    if (editing_task_id) {
      setLocalEdit_value(edited_task_text);
    }
  }, [editing_task_id, edited_task_text]);

  // Add Task: Validate input and dispatch add_task action.
  const handleAddTask = () => {
    if (task_input_text.trim() === "") {
      dispatch(set_input_error("Please enter a valid task"));
      return;
    }
    const new_task: Task = {
      task_id: `task_${Date.now()}`,
      description: task_input_text.trim(),
      status: "Pending",
      created_at: new Date().toISOString(),
      updated_at: null,
      is_deleted: false,
      deleted_at: null,
    };
    dispatch(add_task(new_task));
    dispatch(set_task_input_text(""));
    dispatch(set_input_error(""));
  };

  // Trigger add on Enter in the new task input field.
  const handleKeyDownNewTask = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  // Filter tasks based on the current active_filter.
  const filtered_tasks = tasks.filter((task: Task) => {
    if (active_filter === "active") return task.status === "Pending";
    if (active_filter === "completed") return task.status === "Completed";
    return true;
  });

  // Toggle task completion status.
  const handleToggleTask = (task_id: string) => {
    dispatch(toggle_task_completion(task_id));
  };

  // Delete task and store the deleted task locally for potential undo.
  const handleDeleteTask = (task_id: string) => {
    const taskToDelete = tasks.find((t: Task) => t.task_id === task_id);
    if (taskToDelete) {
      setLastDeletedTask(taskToDelete);
      dispatch(delete_task(task_id));
      dispatch(
        set_notification({
          visible: true,
          message: "Task deleted successfully",
          action: "undo",
        })
      );
    }
  };

  // Begin inline editing for a task.
  const handleStartEditing = (task_id: string) => {
    dispatch(start_editing(task_id));
  };

  // Save the inline edited text.
  const handleSaveEdit = () => {
    if (local_edit_value.trim() === "") {
      // Optionally, you can add an error state here.
      return;
    }
    if (editing_task_id) {
      dispatch(save_edit({ task_id: editing_task_id, edited_text: local_edit_value.trim() }));
    }
    setLocalEdit_value("");
  };

  // Cancel inline editing.
  const handleCancelEdit = () => {
    dispatch(cancel_edit());
    setLocalEdit_value("");
  };

  // Handle Enter key when inline editing.
  const handleKeyDownEdit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    }
  };

  // Update active_filter when a filter button is clicked and sync URL params.
  const handleFilterClick = (filter: string) => {
    dispatch(set_active_filter(filter));
    setSearchParams({ filter });
  };

  // Handle Undo deletion to restore the last deleted task.
  const handleUndoDelete = () => {
    if (last_deleted_task) {
      dispatch(add_task(last_deleted_task));
      setLastDeletedTask(null);
      dispatch(clear_notification());
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Task Management</h1>
        {/* Task Input Area */}
        <div className="flex mb-4">
          <input
            type="text"
            className="flex-grow border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a new task"
            value={task_input_text}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              dispatch(set_task_input_text(e.target.value))
            }
            onKeyDown={handleKeyDownNewTask}
            autoFocus
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none"
            onClick={handleAddTask}
          >
            Add Task
          </button>
        </div>
        {input_error && (
          <div className="text-red-500 mb-4">{input_error}</div>
        )}
        {/* Filter Controls */}
        <div className="flex justify-center mb-4 space-x-2">
          <button
            className={`px-3 py-1 rounded ${
              active_filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => handleFilterClick("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded ${
              active_filter === "active"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => handleFilterClick("active")}
          >
            Active
          </button>
          <button
            className={`px-3 py-1 rounded ${
              active_filter === "completed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => handleFilterClick("completed")}
          >
            Completed
          </button>
        </div>
        {/* Undo Notification (Optional) */}
        {notification.visible && notification.action === "undo" && last_deleted_task && (
          <div className="bg-yellow-200 text-yellow-800 px-3 py-2 rounded mb-4 flex justify-between items-center">
            <span>{notification.message}</span>
            <button className="underline" onClick={handleUndoDelete}>
              Undo
            </button>
          </div>
        )}
        {/* Task List Display */}
        <div>
          {filtered_tasks.map((task: Task) => (
            <div
              key={task.task_id}
              className="flex items-center justify-between mb-2 p-2 border border-gray-200 rounded"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={task.status === "Completed"}
                  onChange={() => handleToggleTask(task.task_id)}
                />
                {editing_task_id === task.task_id ? (
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1 focus:outline-none"
                    value={local_edit_value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setLocalEdit_value(e.target.value)
                    }
                    onKeyDown={handleKeyDownEdit}
                    autoFocus
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartEditing(task.task_id)}
                    className={`cursor-pointer ${
                      task.status === "Completed"
                        ? "line-through text-gray-500"
                        : ""
                    }`}
                  >
                    {task.description}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {editing_task_id === task.task_id ? (
                  <>
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      onClick={handleSaveEdit}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      onClick={() => handleStartEditing(task.task_id)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => handleDeleteTask(task.task_id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default UV_Landing;