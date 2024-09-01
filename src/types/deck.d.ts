type DeckCard = {
  code: string;
  image: string;
  images: {
    svg: string;
    png: string;
  };
  value: string;
  suit: string;
  isVisible: boolean;
};

export type DealData = {
  success: boolean;
  deck_id: string;
  cards: DeckCard[];
  remaining: number;
};

export type DeckData = {
  success: boolean;
  deck_id: string;
  shuffled: boolean;
  remaining: number;
};

export type Player = {
  name: string;
  hand: DeckCard[];
  isDealer: boolean;
  total: number;
  isStanding: boolean;
}

export interface Game {
  id: number;
  name: string;
  deckId: string;
  dealt: boolean;
  players: Player[];
}