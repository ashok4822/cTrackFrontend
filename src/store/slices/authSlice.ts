import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authService } from "@/services/authService";
import type { LoginResponse } from "@/services/authService";
import type { User, UserRole } from "@/types";
import { AxiosError } from "axios";
import { getProfile, updateProfile, updateProfileImage } from "./profileSlice";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string; role?: UserRole },
    { rejectWithValue },
  ) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Login failed";
      return rejectWithValue(message);
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (
    { code, role }: { code: string; role?: UserRole },
    { rejectWithValue }
  ) => {
    try {
      return await authService.googleLogin({ code, role });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Google login failed";
      return rejectWithValue(message);
    }
  },
);

export const initiateSignup = createAsyncThunk(
  "auth/initiateSignup",
  async (email: string, { rejectWithValue }) => {
    try {
      return await authService.initiateSignup(email);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to send OTP";
      return rejectWithValue(message);
    }
  },
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (
    credentials: { email: string; password: string; name: string; otp: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.signup(credentials);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Signup failed";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed on server:", error);
    } finally {
      dispatch(logout());
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to send reset email";
      return rejectWithValue(message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    { email, otp, newPassword }: { email: string; otp: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.resetPassword({ email, otp, newPassword });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to reset password";
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          const { accessToken, refreshToken, user: userData } = action.payload;

          state.accessToken = accessToken;
          state.refreshToken = refreshToken;

          state.user = {
            id: userData.id,
            name: userData.name || userData.email.split("@")[0],
            email: userData.email,
            role: userData.role as UserRole,
            profileImage: userData.profileImage,
          };

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(state.user));
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        googleLogin.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          const { accessToken, refreshToken, user: userData } = action.payload;

          state.accessToken = accessToken;
          state.refreshToken = refreshToken;

          state.user = {
            id: userData.id,
            name: userData.name || userData.email.split("@")[0],
            email: userData.email,
            role: userData.role as UserRole,
            profileImage: userData.profileImage,
          };

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(state.user));
        },
      )
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(initiateSignup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateSignup.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(initiateSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sync profile changes to user state
      .addCase(getProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user.name = action.payload.name || state.user.name;
          state.user.profileImage = action.payload.profileImage;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user.name = action.payload.name || state.user.name;
          state.user.profileImage = action.payload.profileImage;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        if (state.user) {
          state.user.profileImage = action.payload;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
