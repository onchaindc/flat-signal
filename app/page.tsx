"use client";

import { useState, useEffect, useMemo } from "react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
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
  Sun,
  Moon,
  Trash2,
  Check,
} from "lucide-react";
import { formatWif } from "@/lib/utils";
import { WIF_ADDRESS, BURN_ADDRESS, WIF_ABI } from "@/lib/chain";
import { useTheme } from "@/components/theme-provider";

type Signal = {
  id: string;
  title: string;
  type: string;
  description: string;
  burned: number;
  createdAt: number;
  creator?: string;
  creatorAddress?: string;
};

const STORAGE_KEY = "flat-signal-v1";
const TYPES = ["All", "Stock Token", "Project", "Idea", "Builder", "Infra"] as const;
const BOOST_OPTIONS = [10, 50, 100] as const;

export default function Home() {
  const { theme, toggle } = useTheme();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("Idea");
  const [filter, setFilter] = useState<string>("All");
  const [boostAmount, setBoostAmount] = useState<number>(100);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

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
          s.id === boostingId ? { ...s, burned: s.burned + boostAmount } : s
        )
      );
      refetchBalance();
      showToast(`Burned ${boostAmount} $WIF`);
      setTimeout(() => {
        setBoostingId(null);
        reset();
      }, 500);
    }
  }, [isSuccess, boostingId, boostAmount, refetchBalance, reset]);

  const filtered = useMemo(() => {
    const list =
      filter === "All" ? signals : signals.filter((s) => s.type === filter);
    return [...list].sort((a, b) => b.burned - a.burned);
  }, [signals, filter]);

  const totalBurned = signals.reduce((sum, s) => sum + s.burned, 0);
  const wifBalance = balance ? Number(formatUnits(balance as bigint, 18)) : 0;

  const requireWallet = () => {
    if (!isConnected) {
      showToast("Connect wallet first");
      openConnectModal?.();
      return false;
    }
    return true;
  };

  const handleCreateClick = () => {
    if (!requireWallet()) return;
    setShowCreate(true);
  };

  const handleCreate = () => {
    if (!requireWallet()) return;
    if (!newTitle.trim()) return;
    if (newTitle.trim().length < 2) {
      showToast("Title must be at least 2 characters");
      return;
    }

    setSignals((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: newTitle.trim(),
        type: newType,
        description: newDesc.trim() || "No description",
        burned: 0,
        createdAt: Date.now(),
        creator: address
          ? `${address.slice(0, 6)}…${address.slice(-4)}`
          : undefined,
        creatorAddress: address?.toLowerCase(),
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
    showToast("Signal published");
  };

  const handleDelete = (id: string, creatorAddress?: string) => {
    if (!isConnected || !address) {
      requireWallet();
      return;
    }
    if (
      creatorAddress &&
      creatorAddress.toLowerCase() !== address.toLowerCase()
    ) {
      showToast("You can only delete your own signals");
      return;
    }
    setSignals((prev) => prev.filter((s) => s.id !== id));
    showToast("Signal deleted");
  };

  const handleBoost = (id: string) => {
    if (!requireWallet()) return;
    setBoostingId(id);
    writeContract({
      address: WIF_ADDRESS,
      abi: WIF_ABI,
      functionName: "transfer",
      args: [BURN_ADDRESS, parseUnits(String(boostAmount), 18)],
    });
  };

  const handleShareSignal = async (signal: Signal) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}?s=${encodeURIComponent(signal.id)}`
        : "";
    const text = `${signal.title} — ${formatWif(signal.burned)} $WIF burned on Flat Signal`;
    try {
      if (navigator.share) {
        await navigator.share({ title: signal.title, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast("Signal link copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast("Signal link copied");
      } catch {
        showToast("Could not share");
      }
    }
  };

  // Deep-link: highlight signal from ?s=
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("s");
    if (!sid) return;
    const el = document.getElementById(`signal-${sid}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-green-500");
      setTimeout(() => el.classList.remove("ring-2", "ring-green-500"), 2000);
    }
  }, [hydrated, signals]);

  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Check className="w-3.5 h-3.5" />
          {toast}
        </div>
      )}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--background) 85%, transparent)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-soft)" }}
            >
              <Flame className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm leading-none">Flat Signal</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-fg)" }}>
                Robinhood Chain
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--muted-fg)" }}>
                  $WIF
                </span>
                <span className="font-mono text-sm font-medium tabular-nums" style={{ color: "var(--accent)" }}>
                  {wifBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            <button
              onClick={toggle}
              className="p-2 rounded-lg border transition"
              style={{ borderColor: "var(--border)", color: "var(--muted-fg)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Attention, with skin in the game
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-fg)" }}>
            Create a signal. Boost it by burning $WIF. Highest burn ranks first.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "Signals", value: signals.length, accent: false },
            { label: "$WIF burned", value: formatWif(totalBurned), accent: true },
            { label: "Boost size", value: boostAmount, accent: false },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border px-3 py-3 text-center"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <div
                className="text-lg font-semibold tabular-nums"
                style={stat.accent ? { color: "var(--accent)" } : undefined}
              >
                {stat.value}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-fg)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs" style={{ color: "var(--muted-fg)" }}>
            Burn per boost:
          </span>
          {BOOST_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setBoostAmount(n)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border transition"
              style={
                boostAmount === n
                  ? {
                      borderColor: "var(--accent)",
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }
                  : { borderColor: "var(--border)", color: "var(--muted-fg)" }
              }
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
            <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-fg)" }} />
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition"
                style={
                  filter === t
                    ? {
                        borderColor: "var(--accent)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }
                    : { borderColor: "transparent", color: "var(--muted-fg)" }
                }
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {showCreate && (
          <div
            className="mb-6 p-4 rounded-2xl border space-y-3"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted-fg)" }}>
              Wallet required · Title min 2 chars · You can delete your own signals later
            </p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Signal title"
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              autoFocus
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {TYPES.filter((t) => t !== "All").map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className="px-2.5 py-1 rounded-full text-xs border"
                  style={
                    newType === t
                      ? {
                          borderColor: "var(--accent)",
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }
                      : { borderColor: "var(--border)", color: "var(--muted-fg)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
              >
                Publish signal
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm"
                style={{ color: "var(--muted-fg)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isConnected && (
          <div
            className="mb-5 p-3.5 rounded-xl border text-sm"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
              color: "var(--muted-fg)",
            }}
          >
            Connect a wallet on{" "}
            <span style={{ color: "var(--accent)" }}>Robinhood Chain</span> to create
            and boost signals.
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-3 rounded-xl border text-sm"
            style={{
              background: "var(--danger-soft)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            Boost failed. Need enough $WIF on Robinhood Chain for {boostAmount} $WIF.
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: "var(--muted-fg)" }} />
            </div>
            <p className="font-medium mb-1">No signals yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--muted-fg)" }}>
              Connect wallet and create the first one.
            </p>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <Plus className="w-4 h-4" />
              Create signal
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((signal, index) => {
              const isBoosting =
                boostingId === signal.id && (isPending || isConfirming);
              const isOwner =
                !!address &&
                !!signal.creatorAddress &&
                signal.creatorAddress === address.toLowerCase();

              return (
                <div
                  id={`signal-${signal.id}`}
                  key={signal.id}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition ${
                    isBoosting ? "burning" : ""
                  }`}
                  style={{
                    borderColor: isBoosting ? "var(--accent)" : "var(--border)",
                    background: isBoosting ? "var(--accent-soft)" : "var(--card)",
                  }}
                >
                  <div
                    className="w-6 text-center font-mono text-xs tabular-nums flex-shrink-0"
                    style={{
                      color: index < 3 ? "var(--accent)" : "var(--muted-fg)",
                      fontWeight: index < 3 ? 600 : 400,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{signal.title}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: "var(--muted)",
                          color: "var(--muted-fg)",
                        }}
                      >
                        {signal.type}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--muted-fg)" }}>
                      {signal.description}
                      {signal.creator ? ` · ${signal.creator}` : ""}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className="font-mono text-sm font-medium tabular-nums"
                      style={{ color: "var(--accent)" }}
                    >
                      {formatWif(signal.burned)}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--muted-fg)" }}>
                      burned
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleShareSignal(signal)}
                      className="p-1.5 rounded-lg border transition"
                      style={{ borderColor: "var(--border)", color: "var(--muted-fg)" }}
                      title="Share this signal"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(signal.id, signal.creatorAddress)}
                        className="p-1.5 rounded-lg border transition"
                        style={{ borderColor: "var(--border)", color: "var(--muted-fg)" }}
                        title="Delete your signal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleBoost(signal.id)}
                      disabled={isPending || isConfirming}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50"
                      style={
                        isBoosting
                          ? {
                              borderColor: "var(--accent)",
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                            }
                          : {
                              borderColor: "var(--border)",
                              color: "var(--muted-fg)",
                            }
                      }
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
                </div>
              );
            })}
          </div>
        )}

        <footer
          className="mt-12 pt-6 border-t text-center text-xs space-y-1"
          style={{ borderColor: "var(--border)", color: "var(--muted-fg)" }}
        >
          <p>Every boost is a real $WIF transfer to the burn address.</p>
          <p style={{ opacity: 0.7 }}>
            Ownership is not only about holding an asset — it is also about having a voice.
          </p>
        </footer>
      </main>
    </div>
  );
}
