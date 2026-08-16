"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom } from "@/lib/gameStore";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom(name.trim());
      localStorage.setItem(`player-${room.room_code}`, name.trim());
      router.push(`/room/${room.room_code}`);
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !roomCode.trim()) return setError("Enter your name and a room code");
    setLoading(true);
    setError(null);
    try {
      const room = await joinRoom(roomCode.trim(), name.trim());
      localStorage.setItem(`player-${room.room_code}`, name.trim());
      router.push(`/room/${room.room_code}`);
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-serif tracking-wide">Gem Merchants</h1>
          <p className="text-slate-400 text-sm">A personal, learning-project clone of a classic gem-trading game.</p>
        </div>

        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 outline-none focus:border-amber-400"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-2 transition disabled:opacity-50"
        >
          Create new room
        </button>

        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="h-px flex-1 bg-slate-700" />
          OR JOIN
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 outline-none focus:border-amber-400 uppercase tracking-widest"
            placeholder="ROOM CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 font-semibold transition disabled:opacity-50"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </main>
  );
}
