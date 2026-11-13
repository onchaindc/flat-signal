"use client";

import { useState, useEffect, useMemo } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  Flame,
  Plus,
  TrendingUp,
  Loader2,
  Share2,
  Filter,
} from "lucide-react";
import { formatWif } from "@/lib/utils";
import { WIF_ADDRESS, BURN_ADDRESS, WIF_ABI } from "@/lib/chain";

type Signal = {
  id: string;
  title: string;
  type: string;
  description: string;
  burned: number;
  createdAt: number;
  creator?: string;
};

const STORAGE_KEY = "flat-signal-v1";
const TYPES = ["All", "Stock Token", "Project", "Idea", "Builder", "Infra"] as const;
const BOOST_OPTIONS = [10, 50, 100] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("Idea");
  const [filter, setFilter] = useState<string>("All");
  const [boostAmount, setBoostAmount] = useState<number>(100);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load from localStorage (real user data only — no fake rankings)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSignals(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
  }, [signals, hydrated]);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: WIF_ADDRESS,
    abi: WIF_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && boostingId) {
      setSignals((prev) =>
        prev.map((s) =>
          s.id === boostingId
            ? { ...s, burned: s.burned + boostAmount }
            : s
        )
      );
      refetchBalance();
      setTimeout(() => {
        setBoostingId(null);
        reset();
      }, 500);
    }
  }, [isSuccess, boostingId, boostAmount, refetchBalance, reset]);

  const filtered = useMemo(() => {
    const list =
      filter === "All"
        ? signals
        : signals.filter((s) => s.type === filter);
    return [...list].sort((a, b) => b.burned - a.burned);
  }, [signals, filter]);

  const totalBurned = signals.reduce((sum, s) => sum + s.burned, 0);
  const wifBalance = balance ? Number(formatUnits(balance as bigint, 18)) : 0;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const signal: Signal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newTitle.trim(),
      type: newType,
      description: newDesc.trim() || "No description",
      burned: 0,
      createdAt: Date.now(),
      creator: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined,
    };
    setSignals((prev) => [signal, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleBoost = (id: string) => {
    if (!isConnected || !address) return;
    setBoostingId(id);
    writeContract({
      address: WIF_ADDRESS,
      abi: WIF_ABI,
      functionName: "transfer",
      args: [BURN_ADDRESS, parseUnits(String(boostAmount), 18)],
    });
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800/80 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Flame className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-none">Flat Signal</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Robinhood Chain</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">$WIF</span>
                <span className="font-mono text-sm text-green-500 font-medium tabular-nums">
                  {wifBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Attention, with skin in the game
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Create a signal. Boost it by burning $WIF. Highest burn ranks first.
            No likes. No bots. Just capital that disappears.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center">
            <div className="text-lg font-semibold tabular-nums">{signals.length}</div>
            <div className="text-[11px] text-zinc-500">Signals</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center">
            <div className="text-lg font-semibold text-green-500 tabular-nums">
              {formatWif(totalBurned)}
            </div>
            <div className="text-[11px] text-zinc-500">$WIF burned</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-center">
            <div className="text-lg font-semibold tabular-nums">{boostAmount}</div>
            <div className="text-[11px] text-zinc-500">Boost size</div>
          </div>
        </div>

        {/* Boost amount picker */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-zinc-500">Burn per boost:</span>
          {BOOST_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setBoostAmount(n)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                boostAmount === n
                  ? "border-green-500/50 bg-green-500/10 text-green-500"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Filters + actions */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
            <Filter className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition ${
                  filter === t
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
              title="Copy link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>

        {copied && (
          <div className="mb-3 text-xs text-green-500">Link copied</div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Signal title (e.g. TSLA, a builder, a product…)"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm focus:outline-none focus:border-green-500/40 placeholder:text-zinc-600"
              autoFocus
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm focus:outline-none focus:border-green-500/40 placeholder:text-zinc-600"
            />
            <div className="flex flex-wrap gap-1.5">
              {TYPES.filter((t) => t !== "All").map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-2.5 py-1 rounded-full text-xs border ${
                    newType === t
                      ? "border-green-500/50 text-green-500 bg-green-500/10"
                      : "border-zinc-800 text-zinc-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl bg-green-500 text-black text-sm font-semibold disabled:opacity-40"
              >
                Publish signal
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-zinc-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="mb-5 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-sm text-zinc-400">
            Connect a wallet on <span className="text-green-500">Robinhood Chain</span> to boost signals by burning $WIF.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Boost failed. Need $WIF on Robinhood Chain and enough balance for {boostAmount} $WIF.
          </div>
        )}

        {/* Board */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">No signals yet</p>
            <p className="text-sm text-zinc-600 mb-4">
              Be the first to put something on the board.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create first signal
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((signal, index) => {
              const isBoosting =
                boostingId === signal.id && (isPending || isConfirming);
              return (
                <div
                  key={signal.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800/80 transition ${
                    isBoosting
                      ? "border-green-500/30 bg-green-500/5"
                      : "hover:border-zinc-700 hover:bg-zinc-900/30"
                  }`}
                >
                  <div
                    className={`w-7 text-center font-mono text-xs tabular-nums ${
                      index < 3 ? "text-green-500 font-semibold" : "text-zinc-600"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{signal.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 flex-shrink-0">
                        {signal.type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 truncate mt-0.5">
                      {signal.description}
                      {signal.creator ? ` · ${signal.creator}` : ""}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-medium text-green-500 tabular-nums">
                      {formatWif(signal.burned)}
                    </div>
                    <div className="text-[10px] text-zinc-600">burned</div>
                  </div>

                  <button
                    onClick={() => handleBoost(signal.id)}
                    disabled={!isConnected || isPending || isConfirming}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-40 ${
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
                    <span className="hidden sm:inline">
                      {isBoosting ? "…" : "Boost"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-600 space-y-1">
          <p>Every boost is a real $WIF transfer to the burn address.</p>
          <p className="text-zinc-700">
            Ownership is not only about holding an asset — it is also about having a voice.
          </p>
        </footer>
      </main>
    </div>
  );
}
