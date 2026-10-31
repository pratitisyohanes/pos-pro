import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuthStore } from '../../store/authStore';
import { loginSchema } from '../../schemas/forms.schema';
import { applyFieldErrors } from '../../utils/errors';
import { BOOKING_URL } from '../../utils/config';
import { isSsoEnabled } from '../../utils/oidc';
import AuthCard from '../../components/AuthCard';
import MfaStep from '../../components/MfaStep';
import SsoLogin from '../../components/SsoLogin';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/FormField';

// With single sign-on the password is typed on the KandangID page, not here
export default function LoginPage() {
  return isSsoEnabled ? <SsoLogin /> : <PasswordLoginPage />;
}

function PasswordLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  // Set when the password was right but a second step (code or authenticator setup) is still needed
  const [challenge, setChallenge] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const completeLogin = (session) => {
    setSession(session);
    toast.success(`Welcome, ${session.user.name}`);
    // Return to the page that required login, otherwise go to the role home page
    const fallback = session.user.role === 'ADMIN' ? '/admin/cashier' : '/products';
    navigate(location.state?.from?.pathname || fallback, { replace: true });
  };

  const login = useApiMutation(authApi.login, {
    onSuccess: (result) => (result.mfaToken ? setChallenge(result) : completeLogin(result)),
  });

  const onSubmit = (values) => login.mutate(values, { onError: (error) => applyFieldErrors(error, setError) });

  if (challenge) {
    return (
      <AuthCard title={challenge.requiresMfaSetup ? 'Set up two-factor login' : 'Two-factor verification'} subtitle="One more step before opening the cashier.">
        <MfaStep challenge={challenge} onSession={completeLogin} onCancel={() => setChallenge(null)} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Use the same account as the farm services booking app."
      footer={
        <>
          No account yet?{' '}
          <a href={`${BOOKING_URL}/register`} className="font-medium text-brand-700 hover:underline">
            Sign up on the booking app
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input id="email" type="email" label="Email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input id="password" type="password" label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" isLoading={login.isPending}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
