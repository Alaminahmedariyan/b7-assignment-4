declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";

      PORT?: string;
      CLIENT_URL: string;
      DATABASE_URL: string;

      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_EXPIRES_IN?: string;
    }
  }
}

export {};