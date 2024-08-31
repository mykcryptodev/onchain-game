import { createThirdwebClient } from "thirdweb";

import { env } from "~/env";

export const thirdwebClient = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});