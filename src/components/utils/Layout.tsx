import { useName } from "@coinbase/onchainkit/identity";
import Image from "next/image";
import Link from "next/link";
import { type FC, type ReactNode,useEffect, useState } from "react";
import { zeroAddress } from "viem";
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

import { Wallet } from "~/components/Wallet";
import { APP_NAME } from "~/constants";

type Props = {
  children: ReactNode;
};

export const Layout: FC<Props> = ({ children }) => {
  const { address } = useAccount();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
   
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: name } = useName({ 
    address: address ?? zeroAddress, 
    chain: base 
  });

  if (!isMounted) return null;
  return (
    <div className="flex flex-col gap-2 max-w-3xl mx-auto px-2">
      <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto my-4 mb-20">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Image src="/images/icon.png" width={48} height={48} alt={`${APP_NAME} Logo`} />
              <span className="sm:flex hidden">{APP_NAME}</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <Wallet withWalletAggregator />
          </div>
        </div>
        {address && !name && (
          <Link 
            href="https://base.org/names"
            className="flex items-center gap-1 justify-end text-xs -mt-1 pr-3 cursor-pointer hover:underline"
          >
            <Image
              src="/images/basename.svg"
              alt="BaseName"
              className="rounded-full"
              width={14}
              height={14}
            />
            Customize your name
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        )}
      </div>
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;