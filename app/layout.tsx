import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MediSetu — Find medicines across India",
  description:
    "Search medicines across Indian pharmacies, compare live prices, find nearby stock on a map and keep inventory in sync with an AI assistant. Available in 23 Indian languages.",
  keywords: ["medicine finder India", "pharmacy near me", "medicine stock", "AI inventory", "दवा खोजें"],
};

export const viewport: Viewport = {
  themeColor: "#050914",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
