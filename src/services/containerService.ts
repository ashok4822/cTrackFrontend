import api from "./api";
import type { Container, ContainerHistory } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const containerService = {
  async getContainers(filters?: {
    containerNumber?: string;
    size?: string;
    type?: string;
    block?: string;
    status?: string | string[];
  }): Promise<Container[]> {
    const response = await api.get<Container[]>(API_ENDPOINTS.CONTAINERS.GET_ALL, { params: filters });
    return response.data;
  },

  async getCustomerContainers(): Promise<Container[]> {
    const response = await api.get<Container[]>(API_ENDPOINTS.CONTAINERS.MY_CONTAINERS);
    return response.data;
  },

  async getContainerById(id: string): Promise<Container> {
    const response = await api.get<Container>(API_ENDPOINTS.CONTAINERS.BY_ID(id));
    return response.data;
  },

  async createContainer(data: Partial<Container>): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(API_ENDPOINTS.CONTAINERS.CREATE, data);
    return response.data;
  },

  async updateContainer(id: string, data: Partial<Container>): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(API_ENDPOINTS.CONTAINERS.UPDATE(id), data);
    return response.data;
  },

  async blacklistContainer(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(API_ENDPOINTS.CONTAINERS.BLACKLIST(id));
    return response.data;
  },

  async unblacklistContainer(id: string): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(API_ENDPOINTS.CONTAINERS.UNBLACKLIST(id));
    return response.data;
  },

  async getContainerHistory(id: string): Promise<ContainerHistory[]> {
    const response = await api.get<ContainerHistory[]>(API_ENDPOINTS.CONTAINERS.HISTORY(id));
    return response.data;
  },
};
