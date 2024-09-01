import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import Join from "~/components/Game/Join";
import Leave from "~/components/Game/Leave";
import CreateRound from "~/components/Game/Round/Create";
import { Deal } from "~/components/Game/Round/Deal";
import DealerPlay from "~/components/Game/Round/DealerPlay";
import EndRound from "~/components/Game/Round/End";
import { HandComponent } from "~/components/Game/Round/Hand";
import PlaceBet from "~/components/Game/Round/PlaceBet";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  return {
    props: {
      id,
    },
  };
};

type Props = { id: string };
export const Game: NextPage<Props> = ({ id }) => {
  const { data: session } = useSession();
  const { data: fetchedGame, refetch: refetchGame } = api.game.getById.useQuery({ id });
  const [game, setGame] = useState<typeof fetchedGame>();
  const userIsPlayerInGame = useMemo(() => {
    return game?.players.some((player) => player.id === session?.user?.id);
  }, [game, session?.user]);
  const gameSubscription = api.game.onUpdate.useSubscription(
    { lastEventId: id },
    {
      onData: (updatedGame) => {
        console.log("Subscription data received:", { updatedGame });
        // void refetchGame();
        setGame(updatedGame.data);
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    }
  );
  useEffect(() => {
    setGame(fetchedGame);
  }, [fetchedGame]);
  console.log({ game, gameSubscription });


  const activeRound = useMemo(() => {
    return game?.rounds.find((round) => round.status === "active");
  }, [game]);

  console.log('everyone done', activeRound?.hands.every(hand => hand.status === 'standing' || hand.status === 'busted'))
  
  if (!game) return null;
  return (
    <div className="flex flex-col gap-2">
      <div>{game.name}</div>
      <div className="w-fit">
        {userIsPlayerInGame && (
          <Leave id={id} onLeft={refetchGame} />
        )}
      </div>
      <CreateRound id={id} onRoundCreated={refetchGame} />
      <PlaceBet id={id} onBetPlaced={refetchGame} />
      <Deal id={id} onDealt={refetchGame} />
      <div className="flex items-center gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i}>
            {/* if there is a player in this position, show them */}
            {game.players.find((player) => player.position === i) && (
              <div className="flex items-center gap-1">
                <Avatar
                  address={
                    game.players.find((player) => player.position === i)!
                      .user.address
                  }
                />
                <Name
                  address={
                    game.players.find((player) => player.position === i)!
                      .user.address
                  }
                />
              </div>
            )}
            {/* if there is no player in this position, show a Join component */}
            {!game.players.find((player) => player.position === i) && (
              <Join
                id={id}
                onJoined={refetchGame}
                position={i}
              />
            )}
            {/* if the player is in this position and is in the session, show a leave button */}
            {game.players.find((player) => player.position === i && player.user.id === session?.user?.id) && (
              <Leave id={id} onLeft={refetchGame} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {game.players.map((player) => (
          <div key={player.id} className="flex flex-col gap-2">
            {activeRound?.hands.find((hand) => hand.playerId === player.id) && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <HandComponent 
                    gameId={id}
                    hand={activeRound.hands.find((hand) => hand.playerId === player.id)}
                    onAction={() => refetchGame()}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {activeRound?.hands.find(hand => {
          const dealer = game.players.find(player => player.user.isDealer);
          if (!dealer) return false;
          return hand.playerId === dealer.id && hand.status === 'active';
        }) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <DealerPlay gameId={id} onDealerPlayed={refetchGame} />
            </div>
          </div>
        )}
        {/* if all hands are standing or busted show an EndRound component */}
        {activeRound?.hands.every(hand => hand.status === 'standing' || hand.status === 'busted') && 
         activeRound?.hands.length > 1 && (
          <EndRound gameId={id} onRoundEnded={refetchGame} />
        )}
      </div>
    </div>
  );
}

export default Game;