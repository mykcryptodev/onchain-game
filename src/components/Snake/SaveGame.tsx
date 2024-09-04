import { useSession } from "next-auth/react";
import { type FC,useEffect,useState } from "react";
import { useAccount } from "wagmi";

import { Portal } from "~/components/utils/Portal";
import { Wallet } from "~/components/Wallet";
import MergeEthereumAccount from "~/components/Wallet/MergeEthereumAccount";
import { api } from "~/utils/api";

type Props = {
  gameId: string;
}
export const SaveSnakeGame: FC<Props> = ({ gameId }) => {
  const { address } = useAccount();
  const { data: sessionData } = useSession();
  const tabs = ['Scan', 'Save Scan'] as readonly string[];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]!);
  const { mutateAsync: saveGame, isPending } = api.snake.saveGame.useMutation();

  useEffect(() => {
    if (!address) return;
    setActiveTab('Save Scan');
  }, [address]);

  const handleSave = async () => {
    await saveGame({ id: gameId });
  }

  if (!sessionData?.user) return null;

  if (!sessionData?.user.address) {
    return (
      <>
        <label htmlFor="connect_modal" className="btn">Save game with your face</label>
        <Portal>
          <input type="checkbox" id="connect_modal" className="modal-toggle" />
          <div className="modal" role="dialog">
            <div className="modal-box">
              <label htmlFor="connect_modal" className="absolute top-4 right-4 btn btn-ghost btn-circle btn-xs">
                &times;
              </label>
              <ul className="steps w-full mb-4">
                {tabs.map((tab, i) => (
                  <li 
                    key={i} 
                    className={`step ${i <= tabs.indexOf(activeTab) ? 'step-primary' : ''}`}
                  >
                    <button
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
              {activeTab === 'Scan' && (
                <div className="w-full justify-center flex">
                  <Wallet btnLabel="Scan your face" />
                </div>
              )}
              {activeTab === 'Save Scan' && (
                <div className="w-full justify-center flex">
                  <MergeEthereumAccount btnLabel="Save Scan" />
                </div>
              )}
            </div>
          </div>
        </Portal>
      </>
    );
  }

  if (!sessionData?.user.address) {
    return (
      <MergeEthereumAccount btnLabel="Save game with your face" />
    )
  }

  return (
    <button 
      className="btn"
      disabled={isPending}
      onClick={handleSave}
    >
      {isPending && (
        <div className="loading loading-spinner" />
      )}
      Save Game
    </button>
  );
};

export default SaveSnakeGame;