import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  id: string;
  onRoundCreated: () => void;
};
export const CreateRound: FC<Props> = ({ id, onRoundCreated }) => {
  const { mutateAsync: createRound } = api.game.createRound.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await createRound({ id });
        onRoundCreated();
      }}
    >
      Create Round
    </button>
  )
};

export default CreateRound;
  