export type AuthResponse = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  profileImageUrl?: string | null;
};

export type PublicProfile = {
  username: string;
  profileImageUrl: string | null;
};

export type LoginRequest = {
  name: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};
