import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import type {
  BulkUserCreate,
  BulkDeactivateRequest,
  BulkUpdateRolesRequest,
} from "@/types";

export const useUnlockAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.unlockUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useAdminResetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.adminResetPassword(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useForceLogoutUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.forceLogoutUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useBulkCreateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (users: BulkUserCreate[]) => usersApi.bulkCreateUsers(users),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useBulkDeactivateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkDeactivateRequest) =>
      usersApi.bulkDeactivateUsers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useBulkUpdateRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateRolesRequest) =>
      usersApi.bulkUpdateRoles(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
