import { type Card,type CardFid, type PrismaClient } from "@prisma/client";
import { tracked } from "@trpc/server";
import EventEmitter, { on } from "events";
import { zeroAddress } from "viem";
import { z } from "zod";

import { type cardValues } from "~/constants/cards";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { type DealData, type DeckCard, type DeckData } from "~/types/deck";

const ee = new EventEmitter();

type CardValue = typeof cardValues[number];
const getCardImage = (card: Card, cardFids: CardFid[]) => {
  const defaultCardFids = getDefaultCardFids();
  if (!card.isVisible) return '/images/farcard.png';
  let cardValue = card.code.slice(0, -1);
  if (cardValue === '0') {
    cardValue = '10' as CardValue;
  }
  const suitLetter = card.code.slice(-1);
  const customFid = cardFids.find((cardFid) => cardFid.cardValue === cardValue);
  const defaultFid = defaultCardFids[cardValue as CardValue];
  const fid = customFid?.fid ?? defaultFid;
  return `https://far.cards/api/deck/${suitLetter}/${cardValue}/${fid}`;
}

const transformCard = (card: Card, cardFids: CardFid[]): Card => {
  if (!card.isVisible) {
    return {
      ...card,
      suit: 'XX',
      value: 'XX',
      code: 'XX',
      image: getCardImage(card, cardFids),
    };
  }
  return {
    ...card,
    image: getCardImage(card, cardFids),
  };
};

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
            connectOrCreate: [
              {
                where: {
                  id: ctx.session.user.id,
                  position: 0,
                },
                create: {
                  user: {
                    connect: {
                      id: ctx.session.user.id,
                    },
                  },
                  position: 0,
                },
              },
              {
                where: {
                  id: dealer.id,
                  position: 6,
                },
                create: {
                  user: {
                    connect: {
                      id: dealer.id,
                    },
                  },
                  position: 6,
                },
              },
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
      return await getGame({ input, ctx });
    }),
  onUpdate: publicProcedure
    .input(
      z.object({
        // lastEventId is the last event id that the client has received
        // On the first call, it will be whatever was passed in the initial setup
        // If the client reconnects, it will be the last event id that the client received
        lastEventId: z.string().nullish(),
      }).optional(),
    )
    .subscription(async function* (opts) {
      console.log("Subscription initiated for game:", opts?.input?.lastEventId);
      if (opts?.input?.lastEventId) {
        // [...] get the game since the last event id and yield them
        const game = await getGame({ input: { id: opts.input.lastEventId }, ctx: opts.ctx });
        yield tracked(game.id, game);
      }
      // listen for new events
      for await (const [data] of on(ee, 'updateGame')) {
        const gameId = data as string;
        const game = await getGame({ input: { id: gameId }, ctx: opts.ctx });
        // tracking the post id ensures the client can reconnect at any time and get the latest events this id
        yield tracked(game.id, game);
      }
    }),
  join: protectedProcedure
    .input(z.object({
      id: z.string(),
      position: z.number(),
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
      if (game.players.some((player) => player.userId === ctx.session.user.id)) {
        throw new Error("Already joined game");
      }
      const joined = await ctx.db.game.update({
        where: {
          id: input.id,
        },
        data: {
          players: {
            connectOrCreate: {
              create: {
                user: {
                  connect: {
                    id: ctx.session.user.id,
                  },
                },
                position: input.position,
              },
              where: {
                id: ctx.session.user.id,
                position: input.position,
                gameId: input.id,
              },
            },
          },
        },
      });
      ee.emit(`updateGame`, input.id);
      return joined;
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
      // find the player in the game with the user id for this session and disconnect them
      const player = game.players.find((player) => player.userId === ctx.session.user.id);
      if (!player) {
        throw new Error("Player not found in game");
      }
      const left = await ctx.db.player.delete({
        where: {
          id: player.id,
        },
      });
      ee.emit(`updateGame`, input.id);
      return left;
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
      ee.emit(`updateGame`, input.id);
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
              bets: {
                include: {
                  player: true
                }
              },
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
      const userPlayer = game.players.find((player) => player.userId === ctx.session.user.id);
      // player must be in the game
      if (!userPlayer) {
        throw new Error("Player not in game");
      }
      // player must not have already placed a bet
      if (round.bets.some((bet) => bet.player.userId === ctx.session.user.id)) {
        throw new Error("Player already placed a bet");
      }

      // Create the bet
      const bet = await ctx.db.bet.create({
        data: {
          playerId: userPlayer.id,
          roundId: round.id,
          amount: input.bet,
        },
      });
      
      ee.emit(`updateGame`, input.id);
      return bet;
    }),
  deal: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await getGame({ input, ctx });
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
      if (!await playerHasBetInActiveRoundOfGame({ ctx, gameId: input.id, userId: ctx.session.user.id })) {
        throw new Error("Player not in round");
      }
      // there must be at least one bet
      if (round.bets.length < 1) {
        throw new Error("No bets placed");
      }

      // get the dealer in the game
      const dealerPlayer = game.players.find((player) => player.user.isDealer);
      if (!dealerPlayer) {
        throw new Error("Dealer not found");
      }

      // Check if the dealer already has a bet for this round
      const dealerBet = round.bets.find((bet) => bet.playerId === dealerPlayer.id);

      if (!dealerBet) {
        // If the dealer doesn't have a bet, create one
        await ctx.db.bet.create({
          data: {
            playerId: dealerPlayer.id,
            roundId: round.id,
            amount: 0,
          },
        });
      }

      const gameWithDealerBet = await getGame({ input, ctx });
      if (!gameWithDealerBet) {
        throw new Error("Game with dealer bet not found");
      }
      const roundWithDealer = gameWithDealerBet.rounds.find((round) => round.status === "active");
      if (!roundWithDealer) {
        throw new Error("No active round with dealer");
      }

      // deal cards
      const numPlayers = roundWithDealer.bets.length // dealer included
      const numCardsDrawn = numPlayers * 2;
      const dealRes = await fetch(`https://www.deckofcardsapi.com/api/deck/${game.deckId}/draw/?count=${numCardsDrawn}`);
      const dealData = await dealRes.json() as DealData;

      // Sort the players based on their position and create a mapping of playerId to position
      const playerPositions = roundWithDealer.bets
        .sort((a, b) => a.player.position - b.player.position)
        .reduce((acc, bet, index) => {
          acc[bet.playerId] = index;
          return acc;
        }, {} as Record<string, number>
      );

      // Give each player their hand in the sorted order
      const playerHands = dealData.cards.reduce((acc, card, i) => {
        const playerIndex = playerPositions[roundWithDealer.bets[i % numPlayers]!.playerId]!;
        const playerId = roundWithDealer.bets[playerIndex]!.playerId;

        if (!acc[playerId]) {
          acc[playerId] = [];
        }
        acc[playerId].push(card);
        return acc;
      }, {} as Record<string, DeckCard[]>);

      // update the player hands
      await Promise.all(Object.entries(playerHands).map(async ([playerId, hand], index) => {
        const isDealer = playerId === dealerPlayer.id;
        const player = await ctx.db.player.findUnique({
          where: {
            id: playerId,
          },
        });

        if (!player) {
          throw new Error(`Player with id ${playerId} not found`);
        }

        const existingHand = await ctx.db.hand.findFirst({
          where: {
            gameId: input.id,
            roundId: round.id,
            playerId,
          },
        });

        if (existingHand) {
          console.log(`Player ${playerId} already has a hand for this game`);
          // Skip creating a new hand for this player
        } else {
          await ctx.db.hand.create({
            data: {
              gameId: input.id,
              roundId: round.id,
              playerId: playerId,
              status: index === 0 ? "active" : "pending",
              cards: {
                create: hand.map((card, cardIndex) => ({
                  code: card.code,
                  image: card.image,
                  value: card.value,
                  suit: card.suit,
                  isVisible: isDealer && cardIndex === 0 ? false : true,
                })),
              },
            },
          });
        }
      }));

      // finalize the round
      const finalizedRound = await ctx.db.round.update({
        where: {
          id: roundWithDealer.id,
        },
        data: {
          betsFinal: true,
        },
      });
      ee.emit(`updateGame`, input.id);
      return finalizedRound;
    }),
  hit: protectedProcedure
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
          rounds: {
            where: {
              status: "active",
            },
            include: {
              bets: {
                include: {
                  player: true,
                }
              },
              hands: {
                include: {
                  cards: true,
                },
              },
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
      if (!await playerHasBetInActiveRoundOfGame({ ctx, gameId: input.id, userId: ctx.session.user.id })) {
        throw new Error("Player not in round");
      }
      const userPlayer = game.players.find((player) => player.userId === ctx.session.user.id);
      if (!userPlayer) {
        throw new Error("Player not found in game");
      }
      // player must have a hand
      const hand = round.hands.find((hand) => hand.playerId === userPlayer.id);
      if (!hand) {
        throw new Error("Player has no hand");
      }
      // hand must be active
      if (hand.status !== "active") {
        throw new Error("Hand not active");
      }
      // hand must not be busted
      if (hand.cards.reduce((acc, card) => acc + (card.value === 'A' ? 11 : card.value === 'K' || card.value === 'Q' || card.value === 'J' || card.value === '10' ? 10 : parseInt(card.value)), 0) > 21) {
        throw new Error("Hand is busted");
      }
      // get the next card
      const dealRes = await fetch(`https://www.deckofcardsapi.com/api/deck/${game.deckId}/draw/?count=1`);
      const dealData = await dealRes.json() as DealData;
      const card = dealData.cards[0];
      if (!card) {
        throw new Error("No card drawn");
      }
      // add the card to the hand
      await ctx.db.card.create({
        data: {
          handId: hand.id,
          code: card.code,
          image: card.image,
          value: card.value,
          suit: card.suit,
          isVisible: true,
        },
      });
      // check if the hand is busted
      const handWithCard = await ctx.db.hand.findUnique({
        where: {
          id: hand.id,
        },
        include: {
          cards: true,
        },
      });
      if (!handWithCard) {
        throw new Error("Hand not found");
      }
      const handValue = handWithCard.cards.reduce((acc, card) => {
        const value = card.value === 'A' ? 11 : // Treat Aces as 11 initially
          ['KING', 'QUEEN', 'JACK'].includes(card.value) ? 10 : // Face cards are 10
          parseInt(card.value) || 0; // Other cards use their numeric value, or 0 if not a number
      
        // If the total exceeds 21 and there's an Ace that was counted as 11, treat it as 1 instead
        if (acc + value > 21 && card.value === 'A') {
          return acc + 1;
        }
      
        return acc + value;
      }, 0);
      if (handValue > 21) {
        // bust the hand
        await ctx.db.hand.update({
          where: {
            id: hand.id,
          },
          data: {
            status: "busted",
          },
        });
        // find the player in the game with the next position and a bet
        // the next position may be empty so we need to loop through the players
        // sort the players in the round bets by position
        const sortedPlayers = round.bets.sort((a, b) => a.player.position - b.player.position);
        const currentPlayer = sortedPlayers.findIndex((bet) => bet.playerId === userPlayer.id);
        const nextPlayer = sortedPlayers[currentPlayer + 1];

        if (!nextPlayer) {
          // if there is no next player, end the round
          const updatedRound = await ctx.db.round.update({
            where: {
              id: round.id,
            },
            data: {
              status: "ended",
            },
          });
          ee.emit(`updateGame`, input.id);
          return updatedRound;
        }

        // find the next player's hand
        const nextHand = round.hands.find((hand) => hand.playerId === nextPlayer.playerId);

        if (!nextHand) {
          // if there is no next hand, end the round
          const endedRound = await ctx.db.round.update({
            where: {
              id: round.id,
            },
            data: {
              status: "ended",
            },
          });
          ee.emit(`updateGame`, input.id);
          return endedRound;
        }
        // make the next hand active
        const updatedNextHand = await ctx.db.hand.update({
          where: {
            id: nextHand.id,
          },
          data: {
            status: "active",
          },
        });
        ee.emit(`updateGame`, input.id);
        return updatedNextHand;
      }
      ee.emit(`updateGame`, input.id);
      return handWithCard;
    }),
  stand: protectedProcedure
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
          rounds: {
            where: {
              status: "active",
            },
            include: {
              bets: {
                include: {
                  player: true,
                }
              },
              hands: {
                include: {
                  cards: true,
                },
              },
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
      if (!await playerHasBetInActiveRoundOfGame({ ctx, gameId: input.id, userId: ctx.session.user.id })) {
        throw new Error("Player not in round");
      }
      const userPlayer = game.players.find((player) => player.userId === ctx.session.user.id);
      if (!userPlayer) {
        throw new Error("Player not found in game");
      }
      // player must have a hand
      const hand = round.hands.find((hand) => hand.playerId === userPlayer.id);
      if (!hand) {
        throw new Error("Player has no hand");
      }
      // hand must be active
      if (hand.status !== "active") {
        throw new Error("Hand not active");
      }
      // make the hand stand
      await ctx.db.hand.update({
        where: {
          id: hand.id,
        },
        data: {
          status: "standing",
        },
      });
      // find the player in the game with the next position and a bet
      // the next position may be empty so we need to loop through the players
      // sort the players in the round bets by position
      const sortedPlayers = round.bets.sort((a, b) => a.player.position - b.player.position);
      const currentPlayer = sortedPlayers.findIndex((bet) => bet.playerId === userPlayer.id);
      const nextPlayer = sortedPlayers[currentPlayer + 1];

      if (!nextPlayer) {
        // if there is no next player, end the round
        const updatedRound = await ctx.db.round.update({
          where: {
            id: round.id,
          },
          data: {
            status: "ended",
          },
        });
        ee.emit(`updateGame`, input.id);
        return updatedRound;
      }

      // find the next player's hand
      const nextHand = round.hands.find((hand) => hand.playerId === nextPlayer.playerId);

      if (!nextHand) {
        // if there is no next hand, end the round
        return await ctx.db.round.update({
          where: {
            id: round.id,
          },
          data: {
            status: "ended",
          },
        });
      }
      // make the next hand active
      const updatedHand = await ctx.db.hand.update({
        where: {
          id: nextHand.id,
        },
        data: {
          status: "active",
        },
      });
      ee.emit(`updateGame`, input.id);
      return updatedHand;
    }),
  dealerPlay: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          players: {
            include: {
              user: true,
            }
          },
          rounds: {
            where: {
              status: "active",
            },
            include: {
              bets: true,
              hands: {
                include: {
                  cards: true,
                },
              },
            }
          },
        }
      });

      if (!game) {
        throw new Error("Game not found");
      }

      const round = game.rounds.find((round) => round.status === "active");
      if (!round) {
        throw new Error("No active round");
      }

      // player must be in the round
      if (!await playerHasBetInActiveRoundOfGame({ ctx, gameId: input.id, userId: ctx.session.user.id })) {
        throw new Error("Player not in round");
      }
      const userPlayer = game.players.find((player) => player.userId === ctx.session.user.id);
      if (!userPlayer) {
        throw new Error("Player not found in game");
      }
      // player must have a hand
      const hand = round.hands.find((hand) => hand.playerId === userPlayer.id);
      if (!hand) {
        throw new Error("Player has no hand");
      }

      // Find the dealer's hand
      const dealerPlayer = game.players.find((player) => player.user.isDealer);
      if (!dealerPlayer) {
        throw new Error("Dealer not found");
      }
      let dealerHand = round.hands.find((hand) => hand.playerId === dealerPlayer.id)!;
      if (!dealerHand) {
        throw new Error("Dealer hand not found");
      }

      // if all other hands have busted, dealer stands
      const allOtherHandsAreBusted = round.hands.filter((hand) => 
        hand.playerId !== dealerPlayer.id
      ).every((hand) =>
        hand.status === "busted"
      );
      if (allOtherHandsAreBusted) {
        // make all of the dealer's cards visible
        await Promise.all(dealerHand.cards.map(async (card) => {
          await ctx.db.card.update({
            where: {
              id: card.id,
            },
            data: {
              isVisible: true,
            },
          });
        }));
        // stand
        const updatedHand = await ctx.db.hand.update({
          where: {
            id: dealerHand.id,
          },
          data: {
            status: "standing",
          },
        });
        ee.emit(`updateGame`, input.id);
        return updatedHand;
      }

      // Play the dealer's hand
      while (dealerHand.cards.reduce((sum, card) => sum + getCardValue(card.value), 0) < 17) {
        const dealRes = await fetch(`https://www.deckofcardsapi.com/api/deck/${game.deckId}/draw/?count=1`);
        const dealData = await dealRes.json() as DealData;
        const card = dealData.cards[0];
        if (!card) {
          throw new Error("No card drawn");
        }

        // add the card to the hand
        await ctx.db.card.create({
          data: {
            handId: dealerHand.id,
            code: card.code,
            image: card.image,
            value: card.value,
            suit: card.suit,
            isVisible: true,
          },
        });

        // Fetch the updated dealer hand from the database and update local value
        const updatedDealerHand = await ctx.db.hand.findUnique({
          where: {
            id: dealerHand.id,
          },
          include: {
            cards: true,
          },
        });
        if (!updatedDealerHand) {
          throw new Error("Dealer hand not found");
        }
        dealerHand = updatedDealerHand;
      }

      // make all of the dealer's cards visible
      await Promise.all(dealerHand.cards.map(async (card) => {
        await ctx.db.card.update({
          where: {
            id: card.id,
          },
          data: {
            isVisible: true,
          },
        });
      }));

      // Update the dealer's hand status
      const handValue = dealerHand.cards.reduce((sum, card) => sum + getCardValue(card.value), 0);
      const updatedStatus = handValue > 21 ? "busted" : "standing";
      const updatedHand = await ctx.db.hand.update({
        where: {
          id: dealerHand.id,
        },
        data: {
          status: updatedStatus,
        },
      });
      ee.emit(`updateGame`, input.id);
      return updatedHand;
    }),
  endRound: protectedProcedure
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
          rounds: {
            where: {
              status: "active",
            },
            include: {
              bets: true,
              hands: {
                include: {
                  cards: true,
                },
              },
            }
          },
        }
      });
      if (!game) {
        throw new Error("Game not found");
      }
      const round = game.rounds.find((round) => round.status === "active");
      if (!round) {
        throw new Error("No active round");
      }
      // player must be in the round
      if (!await playerHasBetInActiveRoundOfGame({ ctx, gameId: input.id, userId: ctx.session.user.id })) {
        throw new Error("Player not in round");
      }
      const userPlayer = game.players.find((player) => player.userId === ctx.session.user.id);
      if (!userPlayer) {
        throw new 
        Error("Player not found in game");
      }
      // player must have a hand
      const hand = round.hands.find((hand) => hand.playerId === userPlayer.id);
      if (!hand) {
        throw new Error("Player has no hand");
      }
      // all of the hands must be standing or busted
      if (round.hands.some((hand) => hand.status === "active")) {
        throw new Error("Not all hands are standing or busted");
      }
      // end the round
      const endedRound = await ctx.db.round.update({
        where: {
          id: round.id,
        },
        data: {
          status: "ended",
        },
      });
      ee.emit(`updateGame`, input.id);
      return endedRound;
    }),
  setCustomCardFids: protectedProcedure
    .input(z.object({
      id: z.string(),
      cardFids: z.array(z.object({
        cardValue: z.string(),
        fid: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      // for each cardValue that is already in the game and passed in the input, update the fid
      const cardFidsToUpdate = await ctx.db.cardFid.findMany({
        where: {
          gameId: input.id,
          cardValue: {
            in: input.cardFids.map((cardFid) => cardFid.cardValue),
          },
        },
      });
      const updatedCardFids = await Promise.all(cardFidsToUpdate.map(async (cardFid) => {
        const newFid = input.cardFids.find((newCardFid) => newCardFid.cardValue === cardFid.cardValue);
        if (!newFid) {
          throw new Error(`No fid found for card value ${cardFid.cardValue}`);
        }
        await ctx.db.cardFid.update({
          where: {
            id: cardFid.id,
          },
          data: {
            fid: newFid.fid,
          },
        });
      }));
      // for each cardValue that is not already in the game, create a new cardFid
      const cardFidsToCreate = input.cardFids.filter((cardFid) => !cardFidsToUpdate.some((existingCardFid) => existingCardFid.cardValue === cardFid.cardValue));
      const createdCardFids = await Promise.all(cardFidsToCreate.map(async (cardFid) => {
        await ctx.db.cardFid.create({
          data: {
            gameId: input.id,
            cardValue: cardFid.cardValue,
            fid: cardFid.fid,
          },
        });
      }));
      ee.emit(`updateGame`, input.id);
      return [...updatedCardFids, ...createdCardFids];
    }),
  getDefaultCardFids: publicProcedure
    .query(async () => {
      return getDefaultCardFids();
    }),
});

// Helper function to get the numeric value of a card
function getCardValue(value: string): number {
  if (value === 'A') return 11; // Treat Aces as 11 initially
  if (['KING', 'QUEEN', 'JACK'].includes(value)) return 10; // Face cards are 10
  return parseInt(value) || 0; // Other cards use their numeric value, or 0 if not a number
}

// helper function to get a game with all of the data we need
async function getGame({ input, ctx }: { input: { id: string }, ctx: { db: PrismaClient } }) {
  const game = await ctx.db.game.findUnique({
    where: {
      id: input.id,
    },
    include: {
      players: {
        include: {
          user: true,
        }
      },
      rounds: {
        include: {
          bets: {
            include: {
              player: true,
            }
          },
          hands: {
            include: {
              cards: true,
            },
          },
        }
      },
      cardFids: true,
    },
  });
  if (!game) {
    throw new Error("Game not found");
  }
  // before you return the game, hide cards that are not visible
  return {
    ...game,
    rounds: game.rounds.map((round) => ({
      ...round,
      hands: round.hands.map((hand) => ({
        ...hand,
        cards: hand.cards.map((card) => transformCard(card, game.cardFids)),
      })),
    })),
  };
}

async function playerHasBetInActiveRoundOfGame ({ ctx, gameId, userId } : {
  ctx: { db: PrismaClient },
  gameId: string,
  userId: string
}) {
  const game = await getGame({ input: { id: gameId }, ctx });
  if (!game) {
    return false;
  }
  const round = game.rounds.find((round) => round.status === "active");
  if (!round) {
    return false;
  }
  return round.bets.some((bet) => bet.player.userId === userId);
}

function getDefaultCardFids() {
  const defaultCardFids = {
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
  };
  return defaultCardFids;
}