import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { allowAutoStart, startLogin } from '../utils/oidc';
import AuthCard from './AuthCard';
import Button from './ui/Button';
import { PageLoader } from './ui/Spinner';

// Values of ?prompt= that KandangID understands: "login" asks for the password again (switch account), "create" opens sign-up
const PROMPTS = ['login', 'create'];

const MESSAGES = {
  start: 'The ELEFEZ FARM login page could not be opened. Please try again.',
  loop: 'Login keeps returning to this page. Please try again, and contact the farm if it continues.',
};

// Login when single sign-on is on. The browser goes straight to the KandangID page and comes back to /login/callback;
// with an active KandangID session it comes back at once, without typing a password again.
// The card below only shows when that redirect could not start.
export default function SsoLogin({ mode = 'login' }) {
  const location = useLocation();
  const isRegister = mode === 'register';
  // The page that asked for login; empty means "go to the home page for my role"
  const returnTo = location.state?.from?.pathname || null;
  // /login?prompt=login lets someone switch account even though a KandangID session is still active
  const requested = new URLSearchParams(location.search).get('prompt');
  const prompt = isRegister ? 'create' : PROMPTS.includes(requested) ? requested : undefined;

  const [problem, setProblem] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development, and a second start would overwrite the saved PKCE verifier
    if (started.current) return;
    started.current = true;

    if (!allowAutoStart()) {
      setProblem(MESSAGES.loop);
      return;
    }
    startLogin({ returnTo, prompt }).catch(() => setProblem(MESSAGES.start));
  }, [returnTo, prompt]);

  const retry = () => {
    setProblem(null);
    startLogin({ returnTo, prompt }).catch(() => setProblem(MESSAGES.start));
  };

  if (!problem) return <PageLoader label="Opening the ELEFEZ FARM login page..." />;

  return (
    <AuthCard title="Could not open the login page" subtitle={problem}>
      <Button className="w-full" size="lg" onClick={retry}>
        {isRegister ? 'Create account with ELEFEZ FARM' : 'Log in with ELEFEZ FARM'}
      </Button>
    </AuthCard>
  );
}
