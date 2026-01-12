import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { useLocation } from "wouter";

const TOKEN_KEY = "auth_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchUser(): Promise<User | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    removeToken();
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.user;
}

async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

async function signupUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ user: User; token: string }> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      setLocation("/");
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => signupUser(data),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      removeToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      setLocation("/auth");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: async (email: string, password: string) => {
      return loginMutation.mutateAsync({ email, password });
    },
    signup: async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      return signupMutation.mutateAsync(data);
    },
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export { getToken };
