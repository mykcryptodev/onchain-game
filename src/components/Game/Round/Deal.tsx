import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  id: string;
  onDealt: () => void;
};
export const Deal: FC<Props> = ({ id, onDealt }) => {
  const { mutateAsync: deal } = api.game.deal.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await deal({ id });
        onDealt();
      }}
    >
      Deal
    </button>
  );
}
