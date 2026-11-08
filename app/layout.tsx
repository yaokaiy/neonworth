import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./cyberpunk.css";
import "./workspace.css";
import "./workspace-effects.css";
import "./experience.css";
import "./expressive-dynamics.css";
import "./warm-neon.css";
import "./chart-bars.css";
import { WorkspacePreferencesProvider } from "./workspace-preferences";
import { WorkspaceBackground } from "./workspace-background";
import { LaunchIntro } from "./launch-intro";
export const metadata: Metadata = { title: "Neonworth — Your money, clearly", description: "Your private personal finance dashboard. Cash flow, spending, savings and net worth, without the noise.", icons: {icon:"/favicon.svg"} };
export default async function RootLayout({children}:{children:React.ReactNode}) {
 // secureRequest replaces incoming CSP before the framework sees it. Reuse its
 // trusted per-response nonce; keep this parser script after the critical CSS.
 const policy=(await headers()).get('content-security-policy');
 const nonce=policy?.match(/'nonce-([A-Za-z0-9+/]+={0,2})'/)?.[1];
 return <html lang="en" suppressHydrationWarning><head><link rel="stylesheet" href="/launch-gate.css"/><script src="/launch-gate.js" nonce={nonce}></script><link rel="preload" href="/fonts/space-grotesk-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><WorkspacePreferencesProvider><WorkspaceBackground/><LaunchIntro/>{children}</WorkspacePreferencesProvider></body></html> }
