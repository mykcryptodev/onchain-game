import { zeroAddress } from "viem";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { type Card, type DealData, type DeckData, type Player } from "~/types/deck";

const cardFids = {
  'A': 99, // jesse pollak
  'K': 8152, // undefined
  'Q': 239, // ted
  'J': 4085, // christopher
  '10': 680, // woj.eth
  '9': 576, // johnny mack nonlinear.eth
  '8': 2433, // seneca
  '7': 221578, // apex
  '6': 7143, // six
  '5': 7732, // aneri
  '4': 3621, // horsefacts
  '3': 3, // dwr.eth
  '2': 1317, // 0xdesigner
  '1': 3642, // toady hawk
}

const cardValues = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'] as const;
type CardValue = typeof cardValues[number];

const getCardImage = (card: Card) => {
  let cardValue = card.code.slice(0, -1);
  if (cardValue === '0') {
    cardValue = '10' as CardValue;
  }
  const suitLetter = card.code.slice(-1);
  const fid = cardFids[cardValue as CardValue];
  return `https://far.cards/api/deck/${suitLetter}/${cardValue}/${fid}`;
}

const transformPlayerHand = (player: Player) => ({
  ...player,
  hand: player.hand.map((card) => ({
    ...card,
    code: card.isVisible ? card.code : "XX",
    image: card.isVisible ? getCardImage(card) : "https://www.deckofcardsapi.com/static/img/back.png",
    images: {
      svg: card.isVisible ? card.images.svg : "https://www.deckofcardsapi.com/static/img/back.png",
      png: card.isVisible ? card.images.png : "https://www.deckofcardsapi.com/static/img/back.png",
    },
    suit: card.isVisible ? card.suit : "XX",
    value: card.isVisible ? card.value : "XX",
  })),
});

const NUM_DECKS = 6;

export const gameRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const deckRes = await fetch(`https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${NUM_DECKS}`);
      const deckData = await deckRes.json() as DeckData;

      // find the dealer user and add them to the game
      let dealer = await ctx.db.user.findFirst({
        where: {
          isDealer: true,
        },
      });
      if (!dealer) {
        dealer = await ctx.db.user.create({
          data: {
            isDealer: true,
            address: zeroAddress
          },
        });
      }
      
      // create a game
      return await ctx.db.game.create({
        data: {
          name: input.name,
          deckId: deckData.deck_id,
          createdById: ctx.session.user.id,
          players: {
            connect: [
              { id: ctx.session.user.id },
              { id: dealer.id },
            ],
          },
        },
      });
    }),
  getById: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: true,
          rounds: {
            include: {
              players: true,
              bets: true,
              hands: {
                include: {
                  cards: true,
                },
              },
            }
          },
        },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      return game;
    }),
  join: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: true,
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.players.some((player) => player.id === ctx.session.user.id)) {
        throw new Error("Already joined game");
      }
      return await ctx.db.game.update({
        where: {
          id: input.id,
        },
        data: {
          players: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),
  leave: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: true,
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (!game.players.some((player) => player.id === ctx.session.user.id)) {
        throw new Error("Not in game");
      }
      return await ctx.db.game.update({
        where: {
          id: input.id,
        },
        data: {
          players: {
            disconnect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),
  createRound: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: true,
          rounds: true,
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.players.length < 1) {
        throw new Error("Need at least 1 player to start a round");
      }
      // make sure there are no rounds with a status of "active"
      if (game.rounds.some((round) => round.status === "active")) {
        throw new Error("Round already active");
      }
      const round = await ctx.db.round.create({
        data: {
          gameId: input.id,
          status: "active",
          currentBetIndex: 0,
        },
      });
      return round;
    }),
  placeBet: protectedProcedure
    .input(z.object({
      id: z.string(),
      bet: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: true,
          rounds: {
            where: {
              status: "active",
            },
            include: {
              players: true,
              bets: true,
            }
          },
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.rounds.length < 1) {
        throw new Error("No active round");
      }
      // round is the first active round
      const round = game.rounds.find((round) => round.status === "active");
      if (!round) {
        throw new Error("No active round");
      }
      // player must be in the game
      if (!game.players.some((player) => player.id === ctx.session.user.id)) {
        throw new Error("Player not in game");
      }
      // if the player is not already in the round, add them
      if (!round.players.some((player) => player.id === ctx.session.user.id)) {
        await ctx.db.round.update({
          where: {
            id: round.id,
          },
          data: {
            players: {
              connect: {
                id: ctx.session.user.id,
              },
            },
          },
        });
      }
      // player must not have already placed a bet
      if (round.bets.some((bet) => bet.playerId === ctx.session.user.id)) {
        throw new Error("Player already placed a bet");
      }
      return await ctx.db.bet.create({
        data: {
          playerId: ctx.session.user.id,
          roundId: round.id,
          amount: input.bet,
        },
      });
    }),
  deal: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          rounds: {
            where: {
              status: "active",
            },
            include: {
              players: true,
              bets: true,
            }
          },
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.rounds.length < 1) {
        throw new Error("No active round");
      }
      // round is the first active round
      const round = game.rounds.find((round) => round.status === "active");
      if (!round) {
        throw new Error("No active round");
      }
      // player must be in the round
      if (!round.players.some((player) => player.id === ctx.session.user.id)) {
        throw new Error("Player not in round");
      }
      // there must be at least one bet
      if (round.bets.length < 1) {
        throw new Error("No bets placed");
      }

      // get the dealer
      const dealer = await ctx.db.user.findFirstOrThrow({
        where: {
          isDealer: true
        },
      });
      await Promise.all([
        // add the dealer to the round
        ctx.db.round.update({
          where: {
            id: round.id,
          },
          data: {
            players: {
              connect: {
                id: dealer.id,
              },
            },
          },
        }),
        // add a bet of zero for the dealer
        ctx.db.bet.create({
          data: {
            playerId: dealer.id,
            roundId: round.id,
            amount: 0,
          },
        }),
      ])

      // refetch the game now that the dealer is in the round
      const gameWithDealer = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          rounds: {
            where: {
              status: "active",
            },
            include: {
              players: true,
              bets: true,
            }
          },
        }
      });
      if (!gameWithDealer) {
        throw new Error("Game not found with dealer");
      }
      const roundWithDealer = gameWithDealer.rounds.find((round) => round.status === "active");
      if (!roundWithDealer) {
        throw new Error("No active round with dealer");
      }

      // deal cards
      const numPlayers = roundWithDealer.bets.length; // dealer is included
      const numCardsDrawn = numPlayers * 2;
      const dealRes = await fetch(`https://www.deckofcardsapi.com/api/deck/${game.deckId}/draw/?count=${numCardsDrawn}`);
      const dealData = await dealRes.json() as DealData;

      // give each player their hand
      const playerHands = dealData.cards.reduce((acc, card, i) => {
        const playerIndex = i % numPlayers;
        const playerId = roundWithDealer.bets[playerIndex]?.playerId ?? ctx.session.user.id;

        if (!acc[playerId]) {
          acc[playerId] = [];
        }
        acc[playerId].push(card);
        return acc;
      }, {} as Record<string, Card[]>);

      // update the player hands
      await Promise.all(Object.entries(playerHands).map(async ([playerId, hand], index) => {
        await ctx.db.hand.create({
          data: {
            playerId,
            roundId: roundWithDealer.id,
            gameId: gameWithDealer.id,
            status: index === 0 ? "active" : "pending",
            cards: {
              create: hand.map((card) => ({
                code: card.code,
                image: card.image,
                value: card.value,
                suit: card.suit,
                isVisible: true,
              })),
            },
          },
        });
      }));

      // finalize the round
      return await ctx.db.round.update({
        where: {
          id: roundWithDealer.id,
        },
        data: {
          betsFinal: true,
        },
      });
    }),
});