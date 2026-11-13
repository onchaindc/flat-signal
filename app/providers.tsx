"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { robinhoodChain } from "@/lib/chain";

/**
 * Get a free projectId at https://cloud.walletconnect.com
 * Put it in Vercel as NEXT_PUBLIC_WC_PROJECT_ID for production.
 */
const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID || "a01e2f3c4d5e6f7a8b9c0d1e2f3a4b5c";

const config = getDefaultConfig({
  appName: "Flat Signal",
  projectId,
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http("https://rpc.mainnet.chain.robinhood.com"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#22c55e",
            accentColorForeground: "#000",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
