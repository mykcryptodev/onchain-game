import { type Token, TokenImage } from "@coinbase/onchainkit/token";
import { type FC } from "react";
import { erc20Abi, formatUnits } from 'viem';
import { useReadContracts } from 'wagmi';

import { maxDecimals } from "~/helpers/maxDecimals";

type Props = {
  token: Token;
  address: string;
  chainId: number;
  className?: string;
};
export const Balance: FC<Props> = ({ address, token, className, chainId }) => {
  const { 
    data: [decimals, balance] = [6, BigInt(0)],
  } = useReadContracts({ 
    allowFailure: false, 
    contracts: [ 
      { 
        address: token.address,
        abi: erc20Abi, 
        functionName: 'decimals', 
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }
    ] 
  });
  const tokenData = {
    address: token,
    chainId,
    decimals,
    image: "/images/usdc.png", // usdc only for now
    name: `${maxDecimals(formatUnits(balance, decimals), 2)}`,
    symbol: `${maxDecimals(formatUnits(balance, decimals), 2)}`,
  };

  return (
    <div className={`flex items-center gap-1 font-bold ${className}`}>
      <TokenImage 
        token={tokenData.address} 
        className={`shadow-none bg-transparent ${className}`}
      />
      <span>{maxDecimals(formatUnits(balance ?? BigInt(0), decimals), 2)}</span>
    </div>
  )
};

export default Balance;