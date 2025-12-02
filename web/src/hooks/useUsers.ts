import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { CreateUserData, UpdateUserData, UserFilters } from "@/types";

export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.id] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.reactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useHandlers = () => {
  return useQuery({
    queryKey: ["handlers"],
    queryFn: () => usersApi.getHandlers(),
    staleTime: 60 * 1000, // 1 minute
  });
};
