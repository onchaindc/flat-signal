"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Flame, Plus, TrendingUp } from "lucide-react";
import { formatWif } from "@/lib/utils";

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

export default function Home() {
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Idea");
  const [boostingId, setBoostingId] = useState<string | null>(null);

  const sorted = [...signals].sort((a, b) => b.burned - a.burned);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newSignal = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      type: newType,
      description: "Newly created signal",
      burned: 0,
      createdBy: "you",
    };
    setSignals([newSignal, ...signals]);
    setNewTitle("");
    setShowCreate(false);
  };

  const handleBoost = (id: string) => {
    // In full version this would trigger a real $WIF transfer to burn address
    setSignals(signals.map(s =>
      s.id === id ? { ...s, burned: s.burned + 100 } : s
    ));
    setBoostingId(id);
    setTimeout(() => setBoostingId(null), 800);
  };

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
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
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

        {/* Create modal (simple) */}
        {showCreate && (
          <div className="mb-8 p-6 rounded-2xl border border-border bg-muted">
            <h3 className="font-semibold mb-4">Create a new signal</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What should exist? (e.g. TSLA, a new tool, a builder...)"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border mb-3 focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2 mb-4">
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

        {/* Signal Board */}
        <div className="space-y-2">
          {sorted.map((signal, index) => (
            <div
              key={signal.id}
              className="signal-row flex items-center gap-4 p-4 rounded-xl border border-border transition-colors"
            >
              {/* Rank */}
              <div className="w-8 text-center font-mono text-neutral-500 text-sm">
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold truncate">{signal.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                    {signal.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 truncate">{signal.description}</p>
              </div>

              {/* Burned amount */}
              <div className="text-right">
                <div className="font-mono font-medium text-accent">
                  {formatWif(signal.burned)} $WIF
                </div>
                <div className="text-xs text-neutral-600">burned</div>
              </div>

              {/* Boost button */}
              <button
                onClick={() => handleBoost(signal.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent hover:text-accent transition ${
                  boostingId === signal.id ? "bg-accent/20 text-accent" : ""
                }`}
              >
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">Boost</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-neutral-600">
          <p>Every boost burns $WIF permanently.</p>
          <p className="mt-1">Ownership is not only about holding an asset — it is also about having a voice.</p>
          <p className="mt-4 text-xs">Built for the World is Flat Hackathon · Robinhood Chain</p>
        </div>
      </main>
    </div>
  );
}
