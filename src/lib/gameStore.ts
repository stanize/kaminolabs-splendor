import { supabase } from "./supabaseClient";
import { GameState, GameAction } from "./types";
import { createGame } from "./engine";
import { applyAction, GameError } from "./engine";

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createRoom(hostName: string) {
  const roomCode = randomRoomCode();
  const state = createGame(roomCode, [hostName]);
  state.status = "lobby";
  const { data, error } = await supabase
    .from("splendor_games")
    .insert({ room_code: roomCode, state })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function joinRoom(roomCode: string, playerName: string) {
  const { data: row, error } = await supabase
    .from("splendor_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();
  if (error) throw error;

  const state = row.state as GameState;
  if (state.status !== "lobby") throw new Error("Game already started");
  if (state.players.length >= 4) throw new Error("Room is full");

  state.players.push({
    id: `p${state.players.length}`,
    name: playerName,
    tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
    bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
    cards: [],
    reserved: [],
    nobles: [],
    points: 0,
  });

  const { data, error: updateError } = await supabase
    .from("splendor_games")
    .update({ state })
    .eq("id", row.id)
    .select()
    .single();
  if (updateError) throw updateError;
  return data;
}

export async function startGame(roomCode: string) {
  const { data: row, error } = await supabase
    .from("splendor_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();
  if (error) throw error;

  const state = row.state as GameState;
  if (state.players.length < 2) throw new Error("Need at least 2 players");

  const names = state.players.map((p) => p.name);
  const fresh = createGame(roomCode, names);
  fresh.status = "in_progress";

  const { data, error: updateError } = await supabase
    .from("splendor_games")
    .update({ state: fresh })
    .eq("id", row.id)
    .select()
    .single();
  if (updateError) throw updateError;
  return data;
}

export async function sendAction(roomCode: string, action: GameAction) {
  const { data: row, error } = await supabase
    .from("splendor_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();
  if (error) throw error;

  const state = row.state as GameState;
  let next: GameState;
  try {
    next = applyAction(state, action);
  } catch (e) {
    if (e instanceof GameError) throw e;
    throw e;
  }

  const { data, error: updateError } = await supabase
    .from("splendor_games")
    .update({ state: next })
    .eq("id", row.id)
    .select()
    .single();
  if (updateError) throw updateError;
  return data;
}

export function subscribeToRoom(roomCode: string, onChange: (state: GameState) => void) {
  const channel = supabase
    .channel(`splendor-room-${roomCode}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "splendor_games", filter: `room_code=eq.${roomCode.toUpperCase()}` },
      (payload) => {
        onChange(payload.new.state as GameState);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchRoom(roomCode: string) {
  const { data, error } = await supabase
    .from("splendor_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();
  if (error) throw error;
  return data;
}
