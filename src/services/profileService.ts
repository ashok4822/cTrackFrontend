import api from "./api";

export interface ProfileData {
    id: string;
    email: string;
    role: string;
    name?: string;
    phone?: string;
    profileImage?: string;
    companyName?: string;
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    companyName?: string;
}

export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const profileService = {
    getProfile: async () => {
        const response = await api.get<ProfileData>("/users/profile");
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest) => {
        const response = await api.put<{ message: string; user: ProfileData }>(
            "/users/profile",
            data
        );
        return response.data;
    },

    updatePassword: async (data: UpdatePasswordRequest) => {
        const response = await api.put<{ message: string }>("/users/password", data);
        return response.data;
    },

    updateProfileImage: async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        const response = await api.post<{ profileImage: string }>(
            "/users/profile/image",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },
};
