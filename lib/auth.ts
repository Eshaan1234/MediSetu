import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Role } from "./types";

type Provider = NextAuthOptions["providers"][number];
const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || "medisetu-development-only-secret-change-in-production",
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && (user as unknown as { role?: Role }).role) token.role = (user as unknown as { role: Role }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as unknown as { role?: Role }).role = (token.role as Role) ?? "customer";
      return session;
    },
  },
};
