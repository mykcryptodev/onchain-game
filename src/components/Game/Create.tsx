import { useRouter } from "next/router";
import { type FC,useState } from "react";

import { api } from "~/utils/api";

const CreateGame: FC = () => {
  const router = useRouter();
  const { mutateAsync: createGame } = api.game.create.useMutation();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <button
      className="btn"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          const game = await createGame({
            name: "My Game",
          });
          void router.push(`/game/${game.id}`);
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
      Create Game
    </button>
  );
};

export default CreateGame;