import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signupData: null,
  loading: false,
  token: localStorage.getItem("token") || null, // ✅ no JSON.parse
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSignupData: (state, action) => {
      state.signupData = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setToken: (state, action) => {
      state.token = action.payload;

      // ✅ keep localStorage in sync
      if (action.payload) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
  },
});

export const { setSignupData, setLoading, setToken } = authSlice.actions;

export default authSlice.reducer;