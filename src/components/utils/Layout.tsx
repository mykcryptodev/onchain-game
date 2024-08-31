import Image from "next/image";
import Link from "next/link";
import { type FC, type ReactNode,useEffect, useState } from "react";

import { Wallet } from "~/components/Wallet";
import { APP_NAME } from "~/constants";

type Props = {
  children: ReactNode;
};

export const Layout: FC<Props> = ({ children }) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;
  return (
    <div className="flex flex-col gap-2 max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto my-4 mb-20">
        <Link href="/">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image src="/images/icon.png" width={48} height={48} alt={`${APP_NAME} Logo`} />
            <span className="sm:flex hidden">{APP_NAME}</span>
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Wallet />
        </div>
      </div>
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;