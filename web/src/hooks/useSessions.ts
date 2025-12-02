import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

export const useSessions = () => {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: authApi.getSessions,
    staleTime: 30000, // 30 seconds
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

export const useLogoutAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logoutAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
