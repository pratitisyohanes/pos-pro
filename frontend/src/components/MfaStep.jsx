import { useEffect, useRef, useState } from 'react';
import { authApi } from '../api/auth.api';
import { useApiMutation } from '../hooks/useApiMutation';
import Button from './ui/Button';
import { Input } from './ui/FormField';

// Second login step: enter the 6-digit code, or set up the authenticator app first (admins when enforced)
export default function MfaStep({ challenge, onSession, onCancel }) {
  const isSetup = Boolean(challenge.requiresMfaSetup);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const setup = useApiMutation(authApi.mfaSetup);
  const submit = useApiMutation(isSetup ? authApi.mfaEnable : authApi.mfaVerify, { onSuccess: onSession });

  // The QR code is created once; StrictMode runs effects twice in development and a second call
  // would store a new secret that no longer matches the QR code on screen
  const setupStarted = useRef(false);
  const startSetup = setup.mutate;
  useEffect(() => {
    if (!isSetup || setupStarted.current) return;
    setupStarted.current = true;
    startSetup({ mfaToken: challenge.mfaToken });
  }, [isSetup, challenge.mfaToken, startSetup]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Code must be 6 digits');
      return;
    }
    setCodeError('');
    submit.mutate(
      { mfaToken: challenge.mfaToken, code },
      { onError: (error) => setCodeError(error?.response?.data?.errors?.[0]?.message || '') },
    );
  };

  return (
    <div className="space-y-4">
      {isSetup ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p>Admin accounts need two-factor authentication. Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code it shows.</p>
          {setup.data ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4">
              <img src={setup.data.qrCode} alt="QR code for the authenticator app" className="h-44 w-44" />
              <p className="text-xs text-slate-500">Cannot scan? Enter this key manually:</p>
              <code className="break-all rounded bg-slate-100 px-2 py-1 text-xs">{setup.data.secret}</code>
            </div>
          ) : (
            <p className="text-slate-500">{setup.isError ? 'Could not start the setup. Log in again.' : 'Preparing your QR code...'}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Open your authenticator app and enter the 6-digit code for this account.</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          id="mfa-code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          error={codeError}
        />
        <Button type="submit" className="w-full" isLoading={submit.isPending} disabled={isSetup && !setup.data}>
          {isSetup ? 'Turn on and log in' : 'Verify'}
        </Button>
        <button type="button" onClick={onCancel} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
          Back to login
        </button>
      </form>
    </div>
  );
}
