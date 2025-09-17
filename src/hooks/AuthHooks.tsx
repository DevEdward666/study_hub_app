import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { LoginRequest, RegisterRequest } from '../schema/auth.schema';
import { fa } from 'zod/v4/locales';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const currentUserQuery = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const signInMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.signIn(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.signUp(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: currentUserQuery.data,
    isLoading: currentUserQuery.isLoading ?? false,
    isAuthenticated: currentUserQuery.data ?? false,
    signIn: signInMutation,
    signUp: signUpMutation,
    signOut: signOutMutation,
    refetchUser: currentUserQuery.refetch,
  };
};
