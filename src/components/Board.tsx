"use client";
import { useMemo, useState } from "react";
import { GameState, PlayerState, Gem, Token, DevCard } from "@/lib/types";
import GemIcon from "./GemIcon";
import CardView from "./CardView";
import NobleView from "./NobleView";

const GEMS: Gem[] = ["white", "blue", "green", "red", "black"];

export default function Board({
  state,
  myPlayer,
  dispatch,
  error,
  roomCode,
}: {
  state: GameState;
  myPlayer: PlayerState | null;
  dispatch: (action: any) => void;
  error: string | null;
  roomCode: string;
}) {
  const [selectedTokens, setSelectedTokens] = useState<Gem[]>([]);
  const isMyTurn = myPlayer && state.players[state.turnIndex]?.id === myPlayer.id;

  const myTotalTokens = myPlayer
    ? GEMS.reduce((a, g) => a + myPlayer.tokens[g], 0) + myPlayer.tokens.gold
    : 0;
  const mustDiscard = myTotalTokens > 10;

  function toggleToken(g: Gem) {
    if (!isMyTurn || mustDiscard) return;
    setSelectedTokens((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length === 2 && prev[0] === prev[1]) return prev; // already took 2 of same
      if (prev.length >= 1 && prev.some((p) => p === g)) return prev;
      // rule: either up to 3 distinct, or 2 of same (only if none other selected)
      if (prev.length === 1 && prev[0] === g) {
        if (state.board.tokens[g] >= 4) return [g, g];
        return prev;
      }
      if (prev.length >= 3) return prev;
      if (prev.length >= 1 && prev.length < 3) {
        return [...prev, g];
      }
      return [g];
    });
  }

  function confirmTakeTokens() {
    if (selectedTokens.length === 0) return;
    dispatch({ type: "TAKE_TOKENS", playerId: myPlayer!.id, tokens: selectedTokens });
    setSelectedTokens([]);
  }

  function buyCard(card: DevCard, fromReserved: boolean) {
    dispatch({ type: "BUY_CARD", playerId: myPlayer!.id, cardId: card.id, fromReserved });
  }

  function reserveCard(card: DevCard, tier: 1 | 2 | 3) {
    dispatch({ type: "RESERVE_CARD", playerId: myPlayer!.id, cardId: card.id, tier });
  }

  function discardToken(token: Token) {
    dispatch({ type: "DISCARD_TOKEN", playerId: myPlayer!.id, token });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 p-4 space-y-6">
      <header className="flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-xl font-serif text-amber-300">Gem Merchants — Room {roomCode}</h1>
        <div className="text-sm text-slate-400">
          {state.status === "finished"
            ? `Game over — ${state.players.find((p) => p.id === state.winnerId)?.name} wins!`
            : `Turn: ${state.players[state.turnIndex]?.name}${state.lastRound ? " (final round)" : ""}`}
        </div>
      </header>

      {error && <p className="text-red-400 text-sm max-w-6xl mx-auto">{error}</p>}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[auto_220px] gap-6">
        <div className="space-y-6">
          {/* Nobles */}
          <div className="flex gap-2 justify-center flex-wrap">
            {state.board.nobles.map((n) => (
              <NobleView key={n.id} noble={n} />
            ))}
          </div>

          {/* Tiers 3 -> 1, top to bottom like the physical board */}
          {([3, 2, 1] as const).map((tier) => (
            <div key={tier} className="flex items-center gap-2">
              <div className="w-10 text-xs text-slate-500 text-center">
                T{tier}
                <div className="text-[10px]">{state.board.decks[tier].length} left</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {state.board.display[tier].map((card, i) =>
                  card ? (
                    <CardView
                      key={card.id}
                      card={card}
                      onClick={
                        isMyTurn && !mustDiscard
                          ? () => buyCard(card, false)
                          : undefined
                      }
                    />
                  ) : (
                    <div key={i} className="w-28 h-40 rounded-xl border-2 border-dashed border-slate-700" />
                  )
                )}
              </div>
              {isMyTurn && !mustDiscard && (
                <button
                  className="text-xs text-slate-400 hover:text-amber-300 underline ml-2"
                  onClick={() => {
                    const top = state.board.decks[tier][0];
                    if (top) reserveCard(top, tier);
                  }}
                  disabled={state.board.decks[tier].length === 0}
                >
                  reserve from deck
                </button>
              )}
            </div>
          ))}

          {/* Token bank */}
          <div className="flex gap-3 justify-center pt-4 border-t border-slate-700">
            {[...GEMS, "gold" as Token].map((t) => (
              <button
                key={t}
                onClick={() => t !== "gold" && toggleToken(t as Gem)}
                disabled={t === "gold" || !isMyTurn || mustDiscard}
                className={`flex flex-col items-center gap-1 p-1 rounded-lg transition ${
                  t !== "gold" && selectedTokens.includes(t as Gem) ? "bg-amber-500/30 ring-2 ring-amber-400" : ""
                } ${t !== "gold" && isMyTurn && !mustDiscard ? "hover:bg-slate-700" : ""}`}
              >
                <GemIcon token={t as Token} size={36} />
                <span className="text-xs text-slate-300">{state.board.tokens[t as Token]}</span>
              </button>
            ))}
          </div>
          {selectedTokens.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={confirmTakeTokens}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-1.5 text-sm"
              >
                Take {selectedTokens.length} token{selectedTokens.length > 1 ? "s" : ""}
              </button>
            </div>
          )}

          {mustDiscard && myPlayer && (
            <div className="text-center space-y-2">
              <p className="text-amber-300 text-sm">You have {myTotalTokens} tokens — discard down to 10:</p>
              <div className="flex gap-2 justify-center">
                {[...GEMS, "gold" as Token]
                  .filter((t) => myPlayer.tokens[t as Token] > 0)
                  .map((t) => (
                    <button key={t} onClick={() => discardToken(t as Token)}>
                      <GemIcon token={t as Token} size={32} />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Players sidebar */}
        <aside className="space-y-3">
          {state.players.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border p-3 space-y-2 ${
                state.players[state.turnIndex]?.id === p.id ? "border-amber-400 bg-slate-800" : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <span className="text-amber-300 font-bold">{p.points} pts</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {GEMS.map((g) =>
                  p.tokens[g] > 0 ? (
                    <div key={g} className="relative">
                      <GemIcon token={g} size={20} />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                        {p.tokens[g]}
                      </span>
                    </div>
                  ) : null
                )}
                {p.tokens.gold > 0 && (
                  <div className="relative">
                    <GemIcon token="gold" size={20} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                      {p.tokens.gold}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-wrap text-[10px] text-slate-400">
                {GEMS.map((g) =>
                  p.bonuses[g] > 0 ? (
                    <span key={g} className="flex items-center gap-0.5">
                      <GemIcon token={g} size={14} />
                      {p.bonuses[g]}
                    </span>
                  ) : null
                )}
              </div>
              {p.id === myPlayer?.id && p.reserved.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-1 border-t border-slate-700">
                  {p.reserved.map((c) => (
                    <CardView key={c.id} card={c} small onClick={isMyTurn && !mustDiscard ? () => buyCard(c, true) : undefined} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>
      </div>

      <div className="max-w-6xl mx-auto text-xs text-slate-500 max-h-24 overflow-y-auto border-t border-slate-800 pt-2">
        {state.log.slice(-8).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </main>
  );
}
