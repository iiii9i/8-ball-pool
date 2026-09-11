import { betterAuth } from "better-auth"
import { Pool } from "pg"

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL) || undefined

const trustedOrigins = Array.from(
  new Set([
    ...(process.env.NODE_ENV === "development" ? [
      "http://localhost:3000",
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
    ] : []),
    ...(process.env.NODE_ENV === "production" ? [
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    ] : []),
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean) as string[]),
)

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // users cannot set their own role
      },
    },
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
