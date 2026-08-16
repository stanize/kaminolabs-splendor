export type Gem = "white" | "blue" | "green" | "red" | "black";
export type Token = Gem | "gold";

export type Cost = Partial<Record<Gem, number>>;

export interface DevCard {
  id: string;
  tier: 1 | 2 | 3;
  bonus: Gem;
  points: number;
  cost: Cost;
}

export interface Noble {
  id: string;
  points: number;
  requirement: Cost; // requires N cards of each bonus color, not tokens
}

export interface PlayerState {
  id: string;
  name: string;
  tokens: Record<Token, number>;
  bonuses: Record<Gem, number>; // count of purchased cards per color
  cards: DevCard[]; // purchased cards
  reserved: DevCard[]; // reserved cards (face up to owner)
  nobles: Noble[];
  points: number;
}

export interface BoardState {
  tokens: Record<Token, number>;
  decks: Record<1 | 2 | 3, DevCard[]>; // remaining draw pile, order = draw order
  display: Record<1 | 2 | 3, (DevCard | null)[]>; // 4 face-up slots per tier
  nobles: Noble[];
}

export interface GameState {
  id: string;
  status: "lobby" | "in_progress" | "finished";
  players: PlayerState[];
  turnIndex: number;
  board: BoardState;
  lastRound: boolean; // triggered when someone hits 15+, play finishes the round
  winnerId: string | null;
  log: string[];
  createdAt: string;
  updatedAt: string;
}

export type GameAction =
  | { type: "TAKE_TOKENS"; playerId: string; tokens: Gem[] } // 3 different, or 2 same
  | { type: "RESERVE_CARD"; playerId: string; cardId: string; tier: 1 | 2 | 3; fromDeck?: boolean }
  | { type: "BUY_CARD"; playerId: string; cardId: string; fromReserved: boolean }
  | { type: "DISCARD_TOKEN"; playerId: string; token: Token };
