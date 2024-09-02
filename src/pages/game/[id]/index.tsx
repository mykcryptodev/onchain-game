import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
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

  const renderPlayerPosition = (position: number) => {
    if (!game) return null;
    return (
      <div key={position} className="grid w-full justify-center">
        {/* if there is a player in this position, show them */}
        {game.players.find((player) => player.position === position) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <Avatar
                address={
                  game.players.find((player) => player.position === position)!
                    .user.address
                }
              />
              <Name
                address={
                  game.players.find((player) => player.position === position)!
                    .user.address
                }
              />
            </div>
            {/* if there are bets for this player, show them */}
            {activeRound?.bets.find((bet) => bet.playerId === game.players.find((player) => player.position === position)!.id) && (
              <div>
                {activeRound.bets.find((bet) => bet.playerId === game.players.find((player) => player.position === position)!.id)!.amount}
              </div>
            )}
          </div>
        )}
        {/* if there is no player in this position, show a Join component */}
        {!game.players.find((player) => player.position === position) && (
          <Join
            id={id}
            onJoined={refetchGame}
            position={position}
          />
        )}
        {/* if the player is in this position and is in the session, show a leave button */}
        {game.players.find((player) => player.position === position && player.user.id === session?.user?.id) && (
          <Leave id={id} onLeft={refetchGame} />
        )}
        {/* print the hand for the player in this position */}
        {activeRound?.hands.find((hand) => hand.playerId === game.players.find((player) => player.position === position)?.id) && (
          <div>
            <HandComponent 
              gameId={id}
              players={game.players}
              hand={activeRound.hands.find((hand) => hand.playerId === game.players.find((player) => player.position === position)!.id)}
              onAction={() => refetchGame()}
            />
          </div>
        )}
      </div>
    )
  };
  
  if (!game) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between w-full">
        <div>{game.name}</div>
        <Link href={`/game/${id}/settings`} className="btn btn-sm btn-ghost">
          Settings
        </Link>
      </div>
      <div className="w-fit">
        {userIsPlayerInGame && (
          <Leave id={id} onLeft={refetchGame} />
        )}
      </div>
      <CreateRound id={id} onRoundCreated={refetchGame} />
      <PlaceBet id={id} onBetPlaced={refetchGame} />
      <Deal id={id} onDealt={refetchGame} />
      {activeRound && (
        <div>
          {activeRound.id}
        </div>
      )}
      <div className="divider" />
      {/* Horseshoe layout */}
      <div className="grid grid-cols-5 grid-rows-1 gap-4">
        {/* Dealer */}
        <div className="col-start-1 col-span-5 place-content-center">
          {renderPlayerPosition(6)}
          {activeRound?.hands.find(hand => {
              const dealer = game.players.find(player => player.user.isDealer);
              if (!dealer) return false;
              return hand.playerId === dealer.id && hand.status === 'active';
            }) && (
              <div className="flex w-full justify-center">
                <div className="flex items-center gap-1">
                  <DealerPlay gameId={id} onDealerPlayed={refetchGame} />
                </div>
              </div>
            )}
        </div>
      </div>
      <div className="grid grid-cols-5 grid-rows-2 gap-4">
        {/* Top row */}
        <div className="col-start-1 row-start-1 place-content-end">
          {renderPlayerPosition(0)}
        </div>

        {/* Middle row */}
        <div className="col-start-2 row-start-2">
          {renderPlayerPosition(1)}
        </div>
        <div className="col-start-3 row-start-2">
          {renderPlayerPosition(2)}
        </div>
        <div className="col-start-4 row-start-2">
          {renderPlayerPosition(3)}
        </div>

        {/* Bottom row */}
        <div className="col-start-5 row-start-1 place-content-end">
          {renderPlayerPosition(4)}
        </div>
      </div>
      <div className="flex items-center gap-2">
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