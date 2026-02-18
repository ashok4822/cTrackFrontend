import api from "./api";
import type { Container } from "@/types";

export const containerService = {
  async getContainers(filters?: {
    containerNumber?: string;
    size?: string;
    type?: string;
    block?: string;
    status?: string;
  }): Promise<Container[]> {
    const response = await api.get<Container[]>("/containers", { params: filters });
    return response.data;
  },

  async getContainerById(id: string): Promise<Container> {
    const response = await api.get<Container>(`/containers/${id}`);
    return response.data;
  },

  async createContainer(data: Partial<Container>): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/containers", data);
    return response.data;
  },

  async updateContainer(id: string, data: Partial<Container>): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/containers/${id}`, data);
    return response.data;
  },

  async blacklistContainer(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/containers/${id}/blacklist`);
    return response.data;
  },

  async unblacklistContainer(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/containers/${id}/unblacklist`);
    return response.data;
  },

  async getContainerHistory(id: string): Promise<ContainerHistory[]> {
    const response = await api.get<ContainerHistory[]>(`/containers/${id}/history`);
    return response.data;
  },
};
import type { ContainerHistory } from "@/types";
