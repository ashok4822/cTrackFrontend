import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { profileService } from "@/services/profileService";
import type { ProfileData, UpdateProfileRequest, UpdatePasswordRequest } from "@/services/profileService";
import { UI_MESSAGES } from "@/constants/messages";

interface ProfileState {
    profile: ProfileData | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    profile: null,
    isLoading: false,
    error: null,
};

export const getProfile = createAsyncThunk(
    "profile/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            return await profileService.getProfile();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                UI_MESSAGES.PROFILE.FETCH_FAILED;
            return rejectWithValue(message);
        }
    }
);

export const updateProfile = createAsyncThunk(
    "profile/updateProfile",
    async (data: UpdateProfileRequest, { rejectWithValue }) => {
        try {
            const result = await profileService.updateProfile(data);
            return result;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                UI_MESSAGES.PROFILE.UPDATE_FAILED;
            return rejectWithValue(message);
        }
    }
);

export const updatePassword = createAsyncThunk(
    "profile/updatePassword",
    async (data: UpdatePasswordRequest, { rejectWithValue }) => {
        try {
            const result = await profileService.updatePassword(data);
            return result.message;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                UI_MESSAGES.PROFILE.PASSWORD_UPDATE_FAILED;
            return rejectWithValue(message);
        }
    }
);

export const updateProfileImage = createAsyncThunk(
    "profile/updateProfileImage",
    async (file: File, { rejectWithValue }) => {
        try {
            const result = await profileService.updateProfileImage(file);
            return result.profileImage;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                UI_MESSAGES.PROFILE.IMAGE_UPLOAD_FAILED;
            return rejectWithValue(message);
        }
    }
);

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Profile
            .addCase(getProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                getProfile.fulfilled,
                (state, action: PayloadAction<ProfileData>) => {
                    state.isLoading = false;
                    state.profile = action.payload;
                }
            )
            .addCase(getProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                updateProfile.fulfilled,
                (state, action: PayloadAction<ProfileData>) => {
                    state.isLoading = false;
                    state.profile = state.profile
                        ? { ...state.profile, ...action.payload }
                        : action.payload;
                }
            )
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Password
            .addCase(updatePassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Profile Image
            .addCase(updateProfileImage.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                updateProfileImage.fulfilled,
                (state, action: PayloadAction<string>) => {
                    state.isLoading = false;
                    if (state.profile) {
                        state.profile.profileImage = action.payload;
                    }
                }
            )
            .addCase(updateProfileImage.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
export type { ProfileData };
