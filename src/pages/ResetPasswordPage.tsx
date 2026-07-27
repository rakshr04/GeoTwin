import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { updatePassword } from '../utils/auth';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);

      setSuccess(
        'Password updated successfully. Redirecting to sign in...',
      );

      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
        });
      }, 1800);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update your password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0E130D] flex items-center justify-center px-5 py-10 text-[#EEE9DC]">
      <section className="w-full max-w-md rounded-[24px] border border-[#44503E]/45 bg-[#1A2017]/90 p-7 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#8A956B]/40 bg-[#8A956B]/10">
            <Lock className="h-5 w-5 text-[#A5B17C]" />
          </div>

          <h1 className="text-xl font-bold tracking-wide">
            Reset password
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-[#B9B6A7]/70">
            Enter a new password for your GeoTwin
            account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-center text-xs font-medium text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-center text-xs font-medium text-emerald-200">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-[10px] font-semibold uppercase tracking-widest text-[#B9B6A7]/80"
            >
              New password
            </label>

            <div className="relative">
              <input
                id="new-password"
                type={
                  showPassword ? 'text' : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#44503E]/40 bg-[#0E130D]/95 py-3 pl-10 pr-10 text-sm text-[#EEE9DC] outline-none transition focus:border-[#8A956B] focus:ring-3 focus:ring-[#8A956B]/10"
              />

              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B9B6A7]/40" />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B9B6A7]/40 transition hover:text-[#EEE9DC]"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-[10px] font-semibold uppercase tracking-widest text-[#B9B6A7]/80"
            >
              Confirm password
            </label>

            <div className="relative">
              <input
                id="confirm-password"
                type={
                  showPassword ? 'text' : 'password'
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#44503E]/40 bg-[#0E130D]/95 py-3 pl-10 pr-4 text-sm text-[#EEE9DC] outline-none transition focus:border-[#8A956B] focus:ring-3 focus:ring-[#8A956B]/10"
              />

              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B9B6A7]/40" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(success)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8A956B] py-3.5 text-xs font-bold uppercase tracking-widest text-[#171C15] transition hover:bg-[#A5B17C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#171C15]/30 border-t-[#171C15]" />
                Updating...
              </>
            ) : (
              'Update password'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-mono tracking-widest text-[#B9B6A7]/40">
          <ShieldCheck className="h-3.5 w-3.5" />
          SECURE GEOTWIN ACCOUNT RECOVERY
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;