import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

// One typeface for the whole product. Quicksand is the bucket_AI primary:
// rounded geometric, low contrast, quiet at small sizes. Hierarchy comes from
// weight and letter-spacing rather than from mixing a serif and a mono in.
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Inlet, marketing on autopilot for tour operators",
  description:
    "Autonomous review replies, re-engagement, and content for small tour and activity businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme="dark" is pinned rather than toggled: the product is
    // dark-only, and shadcn/assistant-ui `dark:` variants key off it.
    <html lang="en" data-theme="dark" className={quicksand.variable}>
      <body className="relative min-h-screen bg-paper text-ink font-sans antialiased">
        {/* One shared ground behind everything, so the top bar and the panels
            frost against the same mesh with no seam between them. */}
        <div aria-hidden className="canvas-backdrop" />
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
