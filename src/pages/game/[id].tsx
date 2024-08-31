import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import Join from "~/components/Game/Join";
import Leave from "~/components/Game/Leave";
import CreateRound from "~/components/Game/Round/Create";
import { Deal } from "~/components/Game/Round/Deal";
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
              <div>
                {activeRound.hands.find((hand) => hand.playerId === player.id)?.cards.map((card) => (
                  <div key={card.id}>{card.code}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Game;