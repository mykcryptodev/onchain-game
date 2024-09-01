import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

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
  const { data: game, refetch: refetchGame } = api.game.getById.useQuery({ id });
  const userIsPlayerInGame = useMemo(() => {
    return game?.players.some((player) => player.id === session?.user?.id);
  }, [game, session?.user]);
  console.log({ game });

  const activeRound = useMemo(() => {
    return game?.rounds.find((round) => round.status === "active");
  }, [game]);

  console.log('everyone done', activeRound?.hands.every(hand => hand.status === 'standing' || hand.status === 'busted'))
  
  if (!game) return null;
  return (
    <div className="flex flex-col gap-2">
      <div>{game.name}</div>
      <div className="w-fit">
        {userIsPlayerInGame ? (
          <Leave id={id} onLeft={refetchGame} />
        ) : (
          <Join id={id} onJoined={refetchGame} />
        )}
      </div>
      <CreateRound id={id} onRoundCreated={refetchGame} />
      <PlaceBet id={id} onBetPlaced={refetchGame} />
      <Deal id={id} onDealt={refetchGame} />
      <div className="flex items-center gap-2">
        {game.players.map((player) => (
          <div key={player.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <Avatar address={player.address} />
              <Name address={player.address} />
            </div>
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
          const dealer = game.players.find(player => player.isDealer);
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