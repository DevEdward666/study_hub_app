import { apiClient } from './api.client';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  AuthResponseSchema,
  UserSchema
} from '../schema/auth.schema';
import { ApiResponseSchema } from '../schema/api.schema';
import z from 'zod';

export class AuthService {
  async signIn(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post(
      '/auth/signin',
      ApiResponseSchema(AuthResponseSchema),
      credentials
    );
    
    // Save token for future requests
    apiClient.saveAuthToken(response.token);
    
    return response;
  }

  async signUp(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post(
      '/auth/signup',
      ApiResponseSchema(AuthResponseSchema),
      userData
    );
    
    // Save token for future requests
    apiClient.saveAuthToken(response.token);
    
    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    try {

        const response = await apiClient.get('/auth/me',ApiResponseSchema(UserSchema.nullable()));
    return response;
  }
    catch (error: any) {
    if (error.response?.status === 401) {
      return null; 
    }
    throw error;
  }
  }

  async signOut(): Promise<void> {
    try {
      await apiClient.post('/auth/signout', ApiResponseSchema(z.void()));
    } finally {
      apiClient.removeAuthToken();
    }
  }
}

export const authService = new AuthService();