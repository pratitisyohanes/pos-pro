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
import AuthCard from '../../components/AuthCard';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/FormField';

const DEMO_ACCOUNTS = [
  { label: 'Admin (cashier)', email: 'admin@booking.com', password: 'Admin12345' },
  { label: 'Customer', email: 'budi@example.com', password: 'User12345' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const login = useApiMutation(authApi.login, {
    onSuccess: (session) => {
      setSession(session);
      toast.success(`Welcome, ${session.user.name}`);
      // Return to the page that required login, otherwise go to the role home page
      const fallback = session.user.role === 'ADMIN' ? '/admin/cashier' : '/products';
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    },
  });

  const onSubmit = (values) => login.mutate(values, { onError: (error) => applyFieldErrors(error, setError) });

  const fillDemo = (account) => {
    setValue('email', account.email);
    setValue('password', account.password);
  };

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

      <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Demo accounts</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.email} type="button" onClick={() => fillDemo(account)} className="rounded border border-slate-200 bg-white px-2 py-1 hover:border-brand-500">
              {account.label}: {account.email}
            </button>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
