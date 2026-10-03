import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

// Kullanıcı yokken de bcrypt çalışsın: yanıt süresinden e-posta varlığı sızmasın.
const TIMING_SAFE_HASH = "$2b$12$N2K4cEb47c3Rk4vGbUpnVu/U1Ny5oxCDLy2SXmxcZFGmtykbPcB.O";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, role: true, passwordHash: true },
        });

        const valid = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? TIMING_SAFE_HASH,
        );
        if (!user?.passwordHash || !valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
