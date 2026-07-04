import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../redux/authSlice";
import taskReducer from "../redux/taskSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
  },
});
