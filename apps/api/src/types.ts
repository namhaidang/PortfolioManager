export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  theme: string;
};

export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};
