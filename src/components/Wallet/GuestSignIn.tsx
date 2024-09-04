import { signIn, useSession } from 'next-auth/react';
import React, { type FC, useState } from 'react';

const SignInGuest: FC = () => {
  const { data: sessionData } = useSession();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
 
  const promptToSign = async () => {
    setIsSigningIn(true);
    
    try {
      const response = await signIn("guest");

      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (e) {
      console.error('Error signing in:', e);
    } finally {
      setIsSigningIn(false);
    }
  };
  if (sessionData?.user) return null;
  return (
    <button 
      onClick={promptToSign}
      className="btn"
      disabled={isSigningIn}
    >
      {isSigningIn && (
        <div className="loading loading-spinner" />
      )}
      Sign In as Guest
    </button>
  );
}

export default SignInGuest;