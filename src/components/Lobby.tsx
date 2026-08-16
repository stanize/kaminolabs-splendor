"use client";
import { GameState } from "@/lib/types";

export default function Lobby({
  state,
  roomCode,
  myName,
  onStart,
  error,
}: {
  state: GameState;
  roomCode: string;
  myName: string;
  onStart: () => void;
  error: string | null;
}) {
  const isHost = state.players[0]?.name === myName;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <p className="text-slate-400 text-sm">Room code</p>
          <p className="text-4xl font-bold tracking-[0.3em] text-amber-400">{roomCode}</p>
          <p className="text-slate-500 text-xs mt-1">Share this code with 1-3 friends</p>
        </div>

        <div className="space-y-2">
          {state.players.map((p) => (
            <div key={p.id} className="rounded-lg bg-slate-800 border border-slate-700 py-2 px-4 flex items-center justify-between">
              <span>{p.name}</span>
              {p.name === state.players[0].name && (
                <span className="text-xs text-amber-400 uppercase tracking-wide">Host</span>
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 2 - state.players.length) }).map((_, i) => (
            <div key={i} className="rounded-lg border border-dashed border-slate-700 py-2 px-4 text-slate-500 text-sm">
              Waiting for player…
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={state.players.length < 2}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold py-2 transition"
          >
            {state.players.length < 2 ? "Need at least 2 players" : "Start game"}
          </button>
        ) : (
          <p className="text-slate-400 text-sm">Waiting for the host to start the game…</p>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
