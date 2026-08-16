"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchRoom, subscribeToRoom, startGame, sendAction } from "@/lib/gameStore";
import { GameState, Gem, Token, DevCard } from "@/lib/types";
import Board from "@/components/Board";
import Lobby from "@/components/Lobby";

export default function RoomPage() {
  const params = useParams();
  const roomCode = (params.code as string).toUpperCase();
  const [state, setState] = useState<GameState | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMyName(localStorage.getItem(`player-${roomCode}`) || "");
    fetchRoom(roomCode)
      .then((row) => setState(row.state as GameState))
      .catch((e) => setError(e.message));
    const unsub = subscribeToRoom(roomCode, setState);
    return unsub;
  }, [roomCode]);

  const myPlayer = state?.players.find((p) => p.name === myName) || null;

  const handleStart = useCallback(async () => {
    try {
      await startGame(roomCode);
    } catch (e: any) {
      setError(e.message);
    }
  }, [roomCode]);

  const dispatch = useCallback(
    async (action: any) => {
      try {
        await sendAction(roomCode, action);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [roomCode]
  );

  if (!state) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        {error ? <p className="text-red-400">{error}</p> : <p>Loading room {roomCode}...</p>}
      </main>
    );
  }

  if (state.status === "lobby") {
    return <Lobby state={state} roomCode={roomCode} myName={myName} onStart={handleStart} error={error} />;
  }

  return (
    <Board state={state} myPlayer={myPlayer} dispatch={dispatch} error={error} roomCode={roomCode} />
  );
}
