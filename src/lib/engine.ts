import { BoardState, DevCard, GameAction, GameState, Gem, Noble, PlayerState, Token } from "./types";
import { generateDeck, generateNobles } from "./cardData";

const GEMS: Gem[] = ["white", "blue", "green", "red", "black"];

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function tokenCountForPlayers(n: number): number {
  if (n === 2) return 4;
  if (n === 3) return 5;
  return 7; // 4 players
}

export function createGame(id: string, playerNames: string[]): GameState {
  const decks = generateDeck();
  const shuffled: Record<1 | 2 | 3, DevCard[]> = {
    1: shuffle(decks[1]),
    2: shuffle(decks[2]),
    3: shuffle(decks[3]),
  };
  const display: Record<1 | 2 | 3, (DevCard | null)[]> = {
    1: [shuffled[1].shift()!, shuffled[1].shift()!, shuffled[1].shift()!, shuffled[1].shift()!],
    2: [shuffled[2].shift()!, shuffled[2].shift()!, shuffled[2].shift()!, shuffled[2].shift()!],
    3: [shuffled[3].shift()!, shuffled[3].shift()!, shuffled[3].shift()!, shuffled[3].shift()!],
  };

  const tCount = tokenCountForPlayers(playerNames.length);
  const boardTokens: Record<Token, number> = {
    white: tCount,
    blue: tCount,
    green: tCount,
    red: tCount,
    black: tCount,
    gold: 5,
  };

  const allNobles = shuffle(generateNobles());
  const nobleCount = playerNames.length + 1;

  const players: PlayerState[] = playerNames.map((name, i) => ({
    id: `p${i}`,
    name,
    tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
    bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
    cards: [],
    reserved: [],
    nobles: [],
    points: 0,
  }));

  return {
    id,
    status: "in_progress",
    players,
    turnIndex: 0,
    board: {
      tokens: boardTokens,
      decks: shuffled,
      display,
      nobles: allNobles.slice(0, nobleCount),
    },
    lastRound: false,
    winnerId: null,
    log: ["Game started."],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function costTotal(cost: Partial<Record<Gem, number>>): number {
  return Object.values(cost).reduce((a, b) => a + (b || 0), 0);
}

function canAfford(player: PlayerState, card: DevCard): { ok: boolean; goldNeeded: number } {
  let goldNeeded = 0;
  for (const gem of GEMS) {
    const need = card.cost[gem] || 0;
    const have = player.tokens[gem] + player.bonuses[gem];
    if (have < need) goldNeeded += need - have;
  }
  return { ok: goldNeeded <= player.tokens.gold, goldNeeded };
}

function checkNobleVisits(player: PlayerState, board: BoardState): Noble[] {
  const visiting: Noble[] = [];
  for (const noble of board.nobles) {
    let qualifies = true;
    for (const gem of GEMS) {
      const need = noble.requirement[gem] || 0;
      if (player.bonuses[gem] < need) {
        qualifies = false;
        break;
      }
    }
    if (qualifies) visiting.push(noble);
  }
  return visiting;
}

export class GameError extends Error {}

export function applyAction(state: GameState, action: GameAction): GameState {
  const s: GameState = JSON.parse(JSON.stringify(state)); // deep clone, keeps engine pure
  const player = s.players.find((p) => p.id === action.playerId);
  if (!player) throw new GameError("Unknown player");
  if (s.players[s.turnIndex].id !== action.playerId) throw new GameError("Not your turn");
  if (s.status !== "in_progress") throw new GameError("Game is not in progress");

  switch (action.type) {
    case "TAKE_TOKENS": {
      const { tokens } = action;
      if (tokens.length === 0 || tokens.length > 3) throw new GameError("Take 1-3 tokens");
      const unique = new Set(tokens);
      const isSameColorDouble = tokens.length === 2 && unique.size === 1;
      if (isSameColorDouble) {
        const g = tokens[0];
        if (s.board.tokens[g] < 4) throw new GameError("Need at least 4 in the pile to take 2 of the same color");
        s.board.tokens[g] -= 2;
        player.tokens[g] += 2;
      } else {
        if (unique.size !== tokens.length) throw new GameError("Tokens must be different colors (unless taking 2 of the same)");
        if (tokens.length === 3 && unique.size !== 3) throw new GameError("Taking 3 requires 3 different colors");
        for (const g of tokens) {
          if (s.board.tokens[g] <= 0) throw new GameError(`No ${g} tokens left`);
          s.board.tokens[g] -= 1;
          player.tokens[g] += 1;
        }
      }
      const totalTokens = GEMS.reduce((a, g) => a + player.tokens[g], 0) + player.tokens.gold;
      if (totalTokens > 10) {
        s.log.push(`${player.name} must discard down to 10 tokens.`);
      }
      s.log.push(`${player.name} took ${tokens.join(", ")}.`);
      break;
    }

    case "RESERVE_CARD": {
      if (player.reserved.length >= 3) throw new GameError("Max 3 reserved cards");
      const { tier, cardId, fromDeck } = action;
      let card: DevCard | undefined;
      if (fromDeck) {
        card = s.board.decks[tier].shift();
        if (!card) throw new GameError("Deck is empty");
      } else {
        const idx = s.board.display[tier].findIndex((c) => c?.id === cardId);
        if (idx === -1) throw new GameError("Card not found on display");
        card = s.board.display[tier][idx]!;
        const next = s.board.decks[tier].shift() || null;
        s.board.display[tier][idx] = next;
      }
      player.reserved.push(card);
      if (s.board.tokens.gold > 0) {
        s.board.tokens.gold -= 1;
        player.tokens.gold += 1;
      }
      s.log.push(`${player.name} reserved a tier ${tier} card.`);
      break;
    }

    case "BUY_CARD": {
      const { cardId, fromReserved } = action;
      let card: DevCard | undefined;
      let sourceTier: 1 | 2 | 3 | null = null;
      let displayIdx = -1;

      if (fromReserved) {
        const idx = player.reserved.findIndex((c) => c.id === cardId);
        if (idx === -1) throw new GameError("Reserved card not found");
        card = player.reserved[idx];
      } else {
        for (const tier of [1, 2, 3] as const) {
          const idx = s.board.display[tier].findIndex((c) => c?.id === cardId);
          if (idx !== -1) {
            card = s.board.display[tier][idx]!;
            sourceTier = tier;
            displayIdx = idx;
            break;
          }
        }
        if (!card) throw new GameError("Card not found on display");
      }

      const { ok, goldNeeded } = canAfford(player, card);
      if (!ok) throw new GameError("Cannot afford this card");

      // pay: use own-color tokens first, then gold for shortfall
      let goldToSpend = goldNeeded;
      for (const gem of GEMS) {
        const need = card.cost[gem] || 0;
        if (need === 0) continue;
        const fromBonus = Math.min(player.bonuses[gem], need);
        let remaining = need - fromBonus;
        const fromTokens = Math.min(player.tokens[gem], remaining);
        player.tokens[gem] -= fromTokens;
        s.board.tokens[gem] += fromTokens;
        remaining -= fromTokens;
        if (remaining > 0) {
          // covered by gold
          player.tokens.gold -= remaining;
          s.board.tokens.gold += remaining;
          goldToSpend -= remaining;
        }
      }

      if (fromReserved) {
        player.reserved = player.reserved.filter((c) => c.id !== cardId);
      } else if (sourceTier) {
        const next = s.board.decks[sourceTier].shift() || null;
        s.board.display[sourceTier][displayIdx] = next;
      }

      player.cards.push(card);
      player.bonuses[card.bonus] += 1;
      player.points += card.points;
      s.log.push(`${player.name} bought a tier ${card.tier} card (+${card.points} pts).`);

      // noble check (auto-assign first qualifying noble if multiple, simplest rule variant)
      const visiting = checkNobleVisits(player, s.board);
      if (visiting.length > 0) {
        const noble = visiting[0];
        player.nobles.push(noble);
        player.points += noble.points;
        s.board.nobles = s.board.nobles.filter((n) => n.id !== noble.id);
        s.log.push(`${player.name} was visited by a noble (+${noble.points} pts).`);
      }

      if (player.points >= 15 && !s.lastRound) {
        s.lastRound = true;
        s.log.push(`${player.name} reached ${player.points} points — final round triggered!`);
      }
      break;
    }

    case "DISCARD_TOKEN": {
      const { token } = action;
      if (player.tokens[token] <= 0) throw new GameError("No such token to discard");
      player.tokens[token] -= 1;
      s.board.tokens[token] += 1;
      break;
    }
  }

  // advance turn (unless action was a discard, which happens mid-turn-cleanup)
  if (action.type !== "DISCARD_TOKEN") {
    const totalTokens = GEMS.reduce((a, g) => a + player.tokens[g], 0) + player.tokens.gold;
    if (totalTokens <= 10) {
      advanceTurn(s);
    }
    // if over 10, client must send DISCARD_TOKEN actions until <=10, then we advance
  } else {
    const totalTokens = GEMS.reduce((a, g) => a + player.tokens[g], 0) + player.tokens.gold;
    if (totalTokens <= 10) advanceTurn(s);
  }

  s.updatedAt = new Date().toISOString();
  return s;
}

function advanceTurn(s: GameState) {
  const isLastPlayerOfRound = s.turnIndex === s.players.length - 1;
  if (s.lastRound && isLastPlayerOfRound) {
    finishGame(s);
    return;
  }
  s.turnIndex = (s.turnIndex + 1) % s.players.length;
}

function finishGame(s: GameState) {
  s.status = "finished";
  let winner = s.players[0];
  for (const p of s.players) {
    if (
      p.points > winner.points ||
      (p.points === winner.points && p.cards.length < winner.cards.length)
    ) {
      winner = p;
    }
  }
  s.winnerId = winner.id;
  s.log.push(`Game over! ${winner.name} wins with ${winner.points} points.`);
}
