"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
  zerionWallet,
  trustWallet,
  injectedWallet,
  braveWallet,
  okxWallet,
  phantomWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";
import { robinhoodChain } from "@/lib/chain";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID || "a01e2f3c4d5e6f7a8b9c0d1e2f3a4b5c";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        rainbowWallet,
        zerionWallet,
        coinbaseWallet,
        trustWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        injectedWallet,
        okxWallet,
        braveWallet,
        phantomWallet,
        ledgerWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Flat Signal",
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http("https://rpc.mainnet.chain.robinhood.com"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const rkTheme =
    theme === "light"
      ? lightTheme({
          accentColor: "#16a34a",
          accentColorForeground: "#fff",
          borderRadius: "medium",
        })
      : darkTheme({
          accentColor: "#22c55e",
          accentColorForeground: "#000",
          borderRadius: "medium",
        });

  return <RainbowKitProvider theme={rkTheme}>{children}</RainbowKitProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
