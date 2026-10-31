import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { finishLogin, startLogin } from '../../utils/oidc';
import AuthCard from '../../components/AuthCard';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';

const homeFor = (role) => (role === 'ADMIN' ? '/admin/cashier' : '/products');

// KandangID sends the browser here with ?code&state after login
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development, but a code can only be exchanged once
    if (started.current) return;
    started.current = true;

    finishLogin(window.location.search)
      .then(({ session, returnTo }) => {
        setSession(session);
        toast.success(`Welcome, ${session.user.name}`);
        navigate(returnTo || homeFor(session.user.role), { replace: true });
      })
      .catch((err) => setError(err.message));
  }, [navigate, setSession]);

  if (error) {
    return (
      <AuthCard title="Login did not finish" subtitle={error}>
        <Button className="w-full" onClick={() => startLogin()}>
          Try again
        </Button>
      </AuthCard>
    );
  }
  return <PageLoader label="Finishing login..." />;
}
