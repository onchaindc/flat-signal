"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Flame, Plus, TrendingUp, Loader2, Zap } from "lucide-react";
import { formatWif } from "@/lib/utils";
import { WIF_ADDRESS, BURN_ADDRESS, WIF_ABI } from "@/lib/chain";

const INITIAL_SIGNALS = [
  { id: "1", title: "World Is Fair", type: "Project", description: "Onchain voting layer on Robinhood Chain", burned: 12400 },
  { id: "2", title: "TSLA", type: "Stock Token", description: "Tesla · Official Stock Token", burned: 6800 },
  { id: "3", title: "NVDA", type: "Stock Token", description: "NVIDIA · Official Stock Token", burned: 5100 },
  { id: "4", title: "AAPL", type: "Stock Token", description: "Apple · Official Stock Token", burned: 3200 },
  { id: "5", title: "SPY", type: "Stock Token", description: "S&P 500 · Official Stock Token", burned: 2900 },
  { id: "6", title: "GetBlock RPC", type: "Infra", description: "Enterprise infrastructure for builders", burned: 2100 },
  { id: "7", title: "Developer Tooling", type: "Idea", description: "Better DX for Robinhood Chain", burned: 1450 },
  { id: "8", title: "Equal Ground", type: "Project", description: "One-click diversified stock exposure", burned: 980 },
];

const BOOST_AMOUNT = "100";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Idea");
  const [boostingId, setBoostingId] = useState<string | null>(null);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: WIF_ADDRESS,
    abi: WIF_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess && boostingId) {
      setSignals((prev) =>
        prev.map((s) =>
          s.id === boostingId ? { ...s, burned: s.burned + Number(BOOST_AMOUNT) } : s
        )
      );
      refetchBalance();
      setTimeout(() => {
        setBoostingId(null);
        reset();
      }, 600);
    }
  }, [isSuccess, boostingId, refetchBalance, reset]);

  const sorted = [...signals].sort((a, b) => b.burned - a.burned);
  const wifBalance = balance ? Number(formatUnits(balance as bigint, 18)) : 0;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    setSignals([
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        type: newType,
        description: "Created just now",
        burned: 0,
      },
      ...signals,
    ]);
    setNewTitle("");
    setShowCreate(false);
  };

  const handleBoost = (id: string) => {
    if (!isConnected || !address) return;
    setBoostingId(id);
    writeContract({
      address: WIF_ADDRESS,
      abi: WIF_ABI,
      functionName: "transfer",
      args: [BURN_ADDRESS, parseUnits(BOOST_AMOUNT, 18)],
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span className="font-semibold text-[15px]">Flat Signal</span>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-zinc-500">Balance</span>
                <span className="font-mono text-green-500 font-medium">{wifBalance.toFixed(0)}</span>
                <span className="text-zinc-600 text-xs">$WIF</span>
              </div>
            )}
            <ConnectButton
              showBalance={false}
              chainStatus="none"
              accountStatus="address"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium mb-4">
            <Zap className="w-3 h-3" />
            Robinhood Chain
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 leading-tight">
            Burn $WIF to boost<br className="sm:hidden" /> what matters
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-md leading-relaxed">
            Live ranking of Stock Tokens, builders and ideas.
            No algorithms. Just real skin in the game.
          </p>
        </div>

        {/* Not connected tip */}
        {!isConnected && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flame className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm mb-0.5">Connect to boost</p>
              <p className="text-zinc-500 text-sm">
                Connect your wallet on Robinhood Chain to burn $WIF and move signals up the board.
              </p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <TrendingUp className="w-4 h-4" />
            <span>Ranked by $WIF burned</span>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Create panel */}
        {showCreate && (
          <div className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="font-semibold mb-3 text-sm">New signal</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What should exist on Robinhood Chain?"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm mb-3 focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {["Stock Token", "Project", "Idea", "Builder", "Infra"].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    newType === t
                      ? "border-green-500/50 text-green-500 bg-green-500/10"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold disabled:opacity-40"
              >
                Create signal
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Transaction failed. Make sure you have $WIF and are on Robinhood Chain.
          </div>
        )}

        {/* Board */}
        <div className="space-y-1.5">
          {sorted.map((signal, index) => {
            const isBoosting = boostingId === signal.id && (isPending || isConfirming);
            return (
              <div
                key={signal.id}
                className={`signal-row flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-zinc-800 ${
                  isBoosting ? "burning border-green-500/30 bg-green-500/5" : ""
                }`}
              >
                {/* Rank */}
                <div className={`w-6 text-center font-mono text-sm tabular-nums ${
                  index < 3 ? "text-green-500 font-medium" : "text-zinc-600"
                }`}>
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm sm:text-[15px] truncate">{signal.title}</span>
                    <span className="hidden xs:inline text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 flex-shrink-0">
                      {signal.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 truncate">{signal.description}</p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-medium text-green-500 tabular-nums">
                    {formatWif(signal.burned)}
                  </div>
                  <div className="text-[11px] text-zinc-600">$WIF</div>
                </div>

                {/* Boost */}
                <button
                  onClick={() => handleBoost(signal.id)}
                  disabled={!isConnected || isPending || isConfirming}
                  className={`boost-btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    isBoosting
                      ? "border-green-500/40 bg-green-500/10 text-green-500"
                      : "border-zinc-700 text-zinc-400 hover:border-green-500/40 hover:text-green-500"
                  }`}
                >
                  {isBoosting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Flame className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{isBoosting ? "Burning" : "Boost"}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-zinc-900 text-center">
          <p className="text-sm text-zinc-500 mb-1">
            Every boost permanently burns 100 $WIF
          </p>
          <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
            Ownership is not only about holding an asset — it is also about having a voice.
          </p>
          <p className="mt-6 text-xs text-zinc-700">
            Built for the World is Flat Hackathon
          </p>
        </div>
      </main>
    </div>
  );
}
