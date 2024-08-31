import { type FC } from "react";
import { MediaRenderer, useChainMetadata } from "thirdweb/react";
import { type Chain } from "viem";

import { Portal } from "~/components/utils/Portal";
import { thirdwebClient } from "~/config/thirdweb";
import { SUPPORTED_CHAINS } from "~/constants";
import { classNames } from "~/helpers/classNames";
import { getThirdwebChain } from "~/helpers/getThirdwebChain";

type Props = {
  onChainSelected: (chain: Chain) => void;
  selectedChain?: Chain;
  id: string;
  className?: string;
}

export const ChainPicker: FC<Props> = ({ onChainSelected, selectedChain, id, className }) => {
  const handleSelectChain = (chain: Chain) => {
    onChainSelected(chain);
    // close modal
    document.getElementById(`chain-picker-modal-${id}`)?.click();
  }

  const ChainOption: FC<{ chain: Chain }> = ({ chain }) => {
    const { data: chainMetadata} = useChainMetadata(getThirdwebChain(chain.id));
    return (
      <div key={chain.id}>
        <button
          onClick={() => handleSelectChain(chain)}
          className="btn w-full"
        >
          <MediaRenderer
            src={chainMetadata?.icon?.url ?? ''}
            alt={chain.name}
            client={thirdwebClient}
            height={"24px"}
            width={"24px"}
          />
          <span>{chain.name}</span>
        </button>
      </div>
    )
  }

  const SelectedChain: FC<{ chain: Chain }> = ({ chain }) => {
    const { data: chainMetadata } = useChainMetadata(getThirdwebChain(chain.id));
    return (
      <MediaRenderer
        src={chainMetadata?.icon?.url ?? ''}
        alt={chain.name}
        client={thirdwebClient}
        height={"24px"}
        width={"24px"}
      />
    )
  }

  return (
    <>
      <label 
        htmlFor={`chain-picker-modal-${id}`} 
        className={classNames(
          `cursor-pointer bg-ock-secondary active:bg-ock-secondary-active hover:bg-[var(--bg-ock-secondary-hover)] rounded-xl px-4 py-3`,
          className
        )}
      >
        <div className="flex items-center down-chevron">
          {selectedChain && <SelectedChain chain={selectedChain} />}
          <span className="hidden sm:flex ml-2 font-bold">
            {selectedChain?.name}&nbsp;&nbsp;
          </span>
        </div>
      </label>

      <Portal>
        <input type="checkbox" id={`chain-picker-modal-${id}`} className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box flex flex-col gap-2">
            <h3 className="text-lg font-bold">Select a chain</h3>
            <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-96 min-h-80">
              {SUPPORTED_CHAINS.map((chain) => (
                <ChainOption 
                  chain={chain} 
                  key={chain.id}
                />
              ))}
            </div>
          </div>
          <label className="modal-backdrop" htmlFor={`chain-picker-modal-${id}`}>Close</label>
        </div>
      </Portal>
    </>
  )

};

export default ChainPicker;