import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { io } from "socket.io-client";
import axios from "axios";

// Define Task interface using snake_case properties.
export interface Task {
  task_id: string;
  description: string;
  status: "Pending" | "Completed";
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

// Define Notification interface.
export interface Notification {
  visible: boolean;
  message: string;
  action?: string;
}

// Define GlobalState interface.
export interface GlobalState {
  tasks: Task[];
  active_filter: string;
  notification: Notification;
  task_input_text: string;
  input_error: string;
  editing_task_id: string | null;
  edited_task_text: string;
}

const initial_state: GlobalState = {
  tasks: [],
  active_filter: "all",
  notification: { visible: false, message: "", action: "" },
  task_input_text: "",
  input_error: "",
  editing_task_id: null,
  edited_task_text: "",
};

const global_slice = createSlice({
  name: "global",
  initialState: initial_state,
  reducers: {
    set_task_input_text: (state, action: PayloadAction<string>) => {
      state.task_input_text = action.payload;
    },
    set_input_error: (state, action: PayloadAction<string>) => {
      state.input_error = action.payload;
    },
    add_task: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    update_task: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(
        (task) => task.task_id === action.payload.task_id
      );
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    toggle_task_completion: (state, action: PayloadAction<string>) => {
      const index = state.tasks.findIndex(
        (task) => task.task_id === action.payload
      );
      if (index !== -1) {
        const task = state.tasks[index];
        task.status = task.status === "Pending" ? "Completed" : "Pending";
        task.updated_at = new Date().toISOString();
      }
    },
    delete_task: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(
        (task) => task.task_id !== action.payload
      );
    },
    start_editing: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.task_id === action.payload);
      if (task) {
        state.editing_task_id = task.task_id;
        state.edited_task_text = task.description;
      }
    },
    save_edit: (
      state,
      action: PayloadAction<{ task_id: string; edited_text: string }>
    ) => {
      const index = state.tasks.findIndex(
        (task) => task.task_id === action.payload.task_id
      );
      if (index !== -1) {
        state.tasks[index].description = action.payload.edited_text;
        state.tasks[index].updated_at = new Date().toISOString();
      }
      state.editing_task_id = null;
      state.edited_task_text = "";
    },
    cancel_edit: (state) => {
      state.editing_task_id = null;
      state.edited_task_text = "";
    },
    set_active_filter: (state, action: PayloadAction<string>) => {
      state.active_filter = action.payload;
    },
    set_notification: (state, action: PayloadAction<Notification>) => {
      state.notification = action.payload;
    },
    clear_notification: (state) => {
      state.notification = { visible: false, message: "", action: "" };
    },
    // Reducers for handling realtime socket events.
    socket_task_created: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(
        (task) => task.task_id === action.payload.task_id
      );
      if (index === -1) {
        state.tasks.push(action.payload);
      } else {
        state.tasks[index] = action.payload;
      }
    },
    socket_task_updated: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(
        (task) => task.task_id === action.payload.task_id
      );
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    socket_task_deleted: (
      state,
      action: PayloadAction<{ task_id: string }>
    ) => {
      state.tasks = state.tasks.filter(
        (task) => task.task_id !== action.payload.task_id
      );
    },
  },
});

const persist_config = {
  key: "root",
  storage,
};

const persisted_reducer = persistReducer(persist_config, global_slice.reducer);

const store = configureStore({
  reducer: persisted_reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// Initialize realtime socket connection if a VITE_SOCKET_URL is provided.
(async () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    // Wait for the socket to connect.
    await new Promise((resolve) => socket.on("connect", resolve));
    socket.on("task_created", (data: Task) => {
      store.dispatch(global_slice.actions.socket_task_created(data));
    });
    socket.on("task_updated", (data: Task) => {
      store.dispatch(global_slice.actions.socket_task_updated(data));
    });
    socket.on("task_deleted", (data: { task_id: string }) => {
      store.dispatch(global_slice.actions.socket_task_deleted(data));
    });
  }
})();

// Export actions for use in view components.
export const {
  set_task_input_text,
  set_input_error,
  add_task,
  update_task,
  toggle_task_completion,
  delete_task,
  start_editing,
  save_edit,
  cancel_edit,
  set_active_filter,
  set_notification,
  clear_notification,
  socket_task_created,
  socket_task_updated,
  socket_task_deleted,
} = global_slice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;