"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Flame, Plus, TrendingUp, Loader2 } from "lucide-react";
import { formatWif } from "@/lib/utils";
import { WIF_ADDRESS, BURN_ADDRESS, WIF_ABI } from "@/lib/chain";

// Seed signals for the MVP demo
const INITIAL_SIGNALS = [
  { id: "1", title: "TSLA", type: "Stock Token", description: "Tesla Stock Token", burned: 4200, createdBy: "0x..." },
  { id: "2", title: "NVDA", type: "Stock Token", description: "NVIDIA Stock Token", burned: 3100, createdBy: "0x..." },
  { id: "3", title: "World Is Fair", type: "Project", description: "Onchain voting layer", burned: 8900, createdBy: "0x..." },
  { id: "4", title: "AAPL", type: "Stock Token", description: "Apple Stock Token", burned: 1800, createdBy: "0x..." },
  { id: "5", title: "Robinhood Chain tooling", type: "Idea", description: "Better developer experience", burned: 950, createdBy: "0x..." },
  { id: "6", title: "SPY", type: "Stock Token", description: "S&P 500 Stock Token", burned: 2200, createdBy: "0x..." },
  { id: "7", title: "Equal Ground Vaults", type: "Project", description: "One-click stock baskets", burned: 670, createdBy: "0x..." },
  { id: "8", title: "GetBlock x RH", type: "Infra", description: "Enterprise RPC support", burned: 1400, createdBy: "0x..." },
];

const BOOST_AMOUNT = "100"; // 100 $WIF per boost for demo

export default function Home() {
  const { address, isConnected } = useAccount();
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Idea");
  const [boostingId, setBoostingId] = useState<string | null>(null);

  // Read $WIF balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: WIF_ADDRESS,
    abi: WIF_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // After successful burn, update local ranking and refresh balance
  useEffect(() => {
    if (isSuccess && boostingId) {
      setSignals((prev) =>
        prev.map((s) =>
          s.id === boostingId ? { ...s, burned: s.burned + Number(BOOST_AMOUNT) } : s
        )
      );
      refetchBalance();
      setBoostingId(null);
    }
  }, [isSuccess, boostingId, refetchBalance]);

  const sorted = [...signals].sort((a, b) => b.burned - a.burned);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newSignal = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      type: newType,
      description: "Newly created signal",
      burned: 0,
      createdBy: address?.slice(0, 6) + "..." || "you",
    };
    setSignals([newSignal, ...signals]);
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

  const wifBalance = balance ? Number(formatUnits(balance as bigint, 18)) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-none">Flat Signal</h1>
              <p className="text-xs text-neutral-500">Attention market · Robinhood Chain</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="hidden sm:block text-right">
                <div className="text-xs text-neutral-500">Your $WIF</div>
                <div className="font-mono text-sm text-accent">{wifBalance.toFixed(0)}</div>
              </div>
            )}
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Burn $WIF to boost what matters
          </h2>
          <p className="text-neutral-400 max-w-xl text-lg">
            Live ranking of Stock Tokens, builders and ideas.  
            No algorithms. No likes. Just skin in the game.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <TrendingUp className="w-4 h-4" />
            <span>Ranked by total $WIF burned</span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black font-medium hover:bg-accent-dim transition"
          >
            <Plus className="w-4 h-4" />
            Create Signal
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="mb-8 p-6 rounded-2xl border border-border bg-muted">
            <h3 className="font-semibold mb-4">Create a new signal</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What should exist? (e.g. TSLA, a new tool, a builder...)"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border mb-3 focus:outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {["Stock Token", "Project", "Idea", "Builder", "Infra"].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    newType === t
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-neutral-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="px-5 py-2 rounded-lg bg-accent text-black font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 rounded-lg border border-border text-neutral-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error.message.slice(0, 120)}...
          </div>
        )}

        {/* Signal Board */}
        <div className="space-y-2">
          {sorted.map((signal, index) => (
            <div
              key={signal.id}
              className="signal-row flex items-center gap-4 p-4 rounded-xl border border-border transition-colors"
            >
              <div className="w-8 text-center font-mono text-neutral-500 text-sm">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold truncate">{signal.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                    {signal.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 truncate">{signal.description}</p>
              </div>

              <div className="text-right">
                <div className="font-mono font-medium text-accent">
                  {formatWif(signal.burned)} $WIF
                </div>
                <div className="text-xs text-neutral-600">burned</div>
              </div>

              <button
                onClick={() => handleBoost(signal.id)}
                disabled={!isConnected || isPending || isConfirming || boostingId === signal.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  boostingId === signal.id ? "bg-accent/20 text-accent" : ""
                }`}
              >
                {(isPending || isConfirming) && boostingId === signal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Flame className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {(isPending || isConfirming) && boostingId === signal.id ? "Burning..." : "Boost"}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-neutral-600">
          <p>Every boost sends 100 $WIF to the burn address. Permanent.</p>
          <p className="mt-1">Ownership is not only about holding an asset — it is also about having a voice.</p>
          <p className="mt-4 text-xs">Built for the World is Flat Hackathon · Robinhood Chain</p>
        </div>
      </main>
    </div>
  );
}
