import { createSlice } from "@reduxjs/toolkit";

const user = JSON.parse(localStorage.getItem("user"));

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: user || null,
  },

  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
    },

    logout: (state) => {
      state.user = null;

      localStorage.clear();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;