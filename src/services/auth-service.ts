import { apiClient } from '@/services/api-client';
import type { AuthUser, UserDetails } from '@/types/user';

interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/auth/login', {
      ...credentials,
      expiresInMins: 120,
    });
    return response.data;
  },

  async getUserProfile(userId: number): Promise<UserDetails> {
    const response = await apiClient.get<UserDetails>(`/users/${userId}`);
    return response.data;
  },
};
