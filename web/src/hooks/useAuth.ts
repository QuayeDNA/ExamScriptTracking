import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { registrationApi } from "@/api/registration";
import { useAuthStore } from "@/store/auth";
import type {
  LoginCredentials,
  ChangePasswordData,
  FirstTimePasswordData,
} from "@/types";
import { useNavigate } from "react-router-dom";

export const useLogin = (isMobile = false) => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);

      // Check if user needs to change password
      if (!data.user.passwordChanged) {
        navigate(
          isMobile ? "/mobile/change-password" : "/change-password-required"
        );
      } else {
        navigate(isMobile ? "/mobile" : "/dashboard");
      }
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
    onError: () => {
      // Even if logout fails, clear local auth
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
  });
};

export const useProfile = () => {
  const { user: storedUser, isAuthenticated } = useAuthStore();
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await authApi.getProfile();
      setUser(data.user);
      return data.user;
    },
    enabled: isAuthenticated() && !!storedUser,
    initialData: storedUser || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => authApi.changePassword(data),
  });
};

export const useFirstTimePasswordChange = () => {
  const { setAuth, user } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: FirstTimePasswordData) =>
      authApi.firstTimePasswordChange(data),
    onSuccess: (data) => {
      if (user) {
        setAuth(
          { ...user, passwordChanged: true },
          data.token,
          data.refreshToken
        );
      }
      navigate("/dashboard");
    },
  });
};

export const useRegisterWithQR = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: {
      qrToken: string;
      firstName: string;
      lastName: string;
      phone: string;
      password: string;
    }) => registrationApi.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      navigate("/mobile");
    },
  });
};
