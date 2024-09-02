import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { type FC, useEffect, useState } from "react";

import { cardValues } from "~/constants/cards";
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
  const { data: fetchedGame} = api.game.getById.useQuery({ id });
  const { data: defaultCardFids } = api.game.getDefaultCardFids.useQuery();
  const [game, setGame] = useState<typeof fetchedGame>();
  
  api.game.onUpdate.useSubscription(
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

  const CardSetting: FC<{ cardValue: string }> = ({ cardValue }) => {
    const customCardFid = game?.cardFids.find((cardFid) => cardFid.cardValue === cardValue)?.fid;
    const cardFid = customCardFid ?? defaultCardFids?.[cardValue as unknown as keyof typeof defaultCardFids] ?? 0;
    const [newFid, setNewFid] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { mutateAsync: setCustomCardFids } = api.game.setCustomCardFids.useMutation();
    return (
      <div className="flex items-center justify-between gap-2 w-full">
        <Image
          src={`https://far.cards/api/deck/S/${cardValue}/${cardFid}`}
          alt={"Card"}
          width={100}
          height={150}
        />
        <div className="flex items-center gap-2">
          <input
            className="input input-sm input-bordered"
            type="number"
            value={newFid}
            onChange={(e) => {
              const newCardFid = parseInt(e.target.value, 10);
              if (Number.isNaN(newCardFid)) return;
              setNewFid(e.target.value);
            }}
          />
          <button
            className="btn btn-sm"
            disabled={isLoading}
            onClick={async () => {
              if (!newFid || !game || !cardValue) return;
              setIsLoading(true);
              try {
                await setCustomCardFids({ 
                  id: game.id, 
                  cardFids: [{
                    cardValue,
                    fid: parseInt(newFid, 10),
                  }],
                });
              } catch (e) {
                console.error(e);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading && (
              <div className="loading loading-spinner" />
            )}
            Update
          </button>
        </div>
      </div>
    )
  };

  if (!game || !defaultCardFids) return null;
  return (
    <div className="flex flex-col gap-2">
      <Link href={`/game/${game.id}`} className="btn btn-sm btn-ghost w-fit">
        Back to Game
      </Link>
      <div>{game.name} Settings</div>
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="w-full">Card</div>
        <div className="text-center w-full">FID</div>
      </div>
      <div className="flex flex-col gap-2">
        {cardValues.map((card, i) => (
          <CardSetting key={i} cardValue={card} />
        )).reverse()}
      </div>
    </div>
  );
}

export default Game;