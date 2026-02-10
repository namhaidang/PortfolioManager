import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    theme?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      theme: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    theme?: string;
  }
}
