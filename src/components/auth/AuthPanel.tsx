import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  loginUser,
  requestPasswordReset,
} from '../../utils/auth';

export const AuthPanel: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [formError, setFormError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const [tiltStyle, setTiltStyle] =
    useState<React.CSSProperties>({});

  const [lightStyle, setLightStyle] =
    useState<React.CSSProperties>({
      opacity: 0,
    });

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 3;
    const rotateY = ((x - centerX) / centerX) * 3;

    setTiltStyle({
      transform:
        `perspective(1000px) rotateX(${rotateX}deg) ` +
        `rotateY(${rotateY}deg)`,
    });

    setLightStyle({
      opacity: 1,
      background:
        `radial-gradient(circle at ${x}px ${y}px, ` +
        'rgba(255,255,255,0.05) 0%, transparent 65%)',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform:
        'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    });

    setLightStyle({
      opacity: 0,
    });
  };

  const validate = (): boolean => {
    const nextErrors: {
      email?: string;
      password?: string;
    } = {};

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Official email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email =
        'Please enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password =
        'Password must be at least 6 characters';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setFormError('');
    setResetMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const session = await loginUser(
        email.trim(),
        password,
      );

      navigate(
        session.role === 'supervisor'
          ? '/supervisor/dashboard'
          : '/field/dashboard',
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Invalid email or password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setFormError('');
    setResetMessage('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrors({
        email: 'Enter your email address first',
      });

      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrors({
        email: 'Please enter a valid email address',
      });

      return;
    }

    setErrors({});
    setIsResetLoading(true);

    try {
      await requestPasswordReset(trimmedEmail);

      setResetMessage(
        'Password reset link sent. Check your inbox.',
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to send the reset email.',
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="relative w-full group">
      {/* Dark Yellowish-Green Radial Glow Backdrop - Activated ON HOVER ONLY */}
      <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-[#8A956B]/40 via-[#A3B173]/50 to-[#556B2F]/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          ...tiltStyle,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10 w-full bg-[#141C13]/90 border border-[#44503E]/50 hover:border-[#A3B173] p-6 md:p-8 rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,0.6)] hover:shadow-[0_0_60px_rgba(163,177,115,0.5),0_0_110px_rgba(85,107,47,0.35)] text-[#EEE9DC] backdrop-blur-2xl transition-all duration-500 auth-panel-card"
      >
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none z-30 transition-opacity duration-300"
        style={lightStyle}
      />

      <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 120 C80 170, 130 80, 450 160"
            stroke="#8A956B"
            strokeWidth="1.5"
          />

          <path
            d="M-50 150 C80 200, 160 110, 450 190"
            stroke="#8A956B"
            strokeWidth="1.5"
          />

          <path
            d="M-50 180 C100 240, 180 140, 450 220"
            stroke="#8A956B"
            strokeWidth="1.5"
          />

          <path
            d="M-50 220 C110 290, 200 180, 450 260"
            stroke="#8A956B"
            strokeWidth="1.5"
          />

          <path
            d="M-50 260 C120 340, 220 220, 450 300"
            stroke="#8A956B"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="flex border-b border-[#44503E]/30 mb-6 relative z-10">
        <div className="flex-1 pb-3 text-xs md:text-sm font-semibold tracking-wider uppercase border-[#8A956B] text-[#EEE9DC] border-b-2 text-center">
          Sign in
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 relative z-10"
        noValidate
      >
        {formError && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 text-xs rounded-lg text-center font-medium">
            {formError}
          </div>
        )}

        {resetMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 text-xs rounded-lg text-center font-medium">
            {resetMessage}
          </div>
        )}

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-[10px] font-semibold text-[#B9B6A7]/80 uppercase tracking-widest"
          >
            Official Email
          </label>

          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                setErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }}
              placeholder="name@agency.gov"
              autoComplete="email"
              className={`w-full bg-[#0E130D]/95 border text-[#EEE9DC] placeholder-[#8E907F]/50 text-sm rounded-xl py-3 pl-10 pr-4 outline-hidden premium-input ${
                errors.email
                  ? 'border-red-500/80'
                  : 'border-[#44503E]/40'
              }`}
            />

            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9B6A7]/40" />
          </div>

          {errors.email && (
            <p className="text-[11px] text-red-400/90 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-[10px] font-semibold text-[#B9B6A7]/80 uppercase tracking-widest"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                setErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full bg-[#0E130D]/95 border text-[#EEE9DC] placeholder-[#8E907F]/50 text-sm rounded-xl py-3 pl-10 pr-10 outline-hidden premium-input ${
                errors.password
                  ? 'border-red-500/80'
                  : 'border-[#44503E]/40'
              }`}
            />

            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9B6A7]/40" />

            <button
              type="button"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B6A7]/40 hover:text-[#EEE9DC] p-1 cursor-pointer"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-[11px] text-red-400/90 font-medium">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              defaultChecked
              className="w-3.5 h-3.5 border-[#44503E]/60 rounded-sm bg-[#0E130D] accent-[#8A956B] cursor-pointer"
            />

            <span className="text-[#B9B6A7]/80">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isResetLoading || isLoading}
            className="text-[#8A956B] hover:text-[#A5B17C] disabled:opacity-50 font-semibold transition-colors font-mono text-[10px] tracking-wider cursor-pointer"
          >
            {isResetLoading
              ? 'Sending...'
              : 'Forgot password?'}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || isResetLoading}
          className="w-full bg-[#8A956B] disabled:bg-[#8A956B]/40 text-[#171C15] font-bold text-xs uppercase tracking-widest rounded-xl py-3.5 transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer premium-button"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-[#171C15]/30 border-t-[#171C15] animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-[8px] text-[#B9B6A7]/40 font-mono tracking-widest relative z-10">
        <ShieldCheck className="w-3.5 h-3.5" />

        <span>
          SECURE END-TO-END GOVERNMENT PORTAL
        </span>
      </div>

      <style>{`
        .auth-panel-card {
          animation: cardEntrance 0.9s
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.15s ease-out;
        }

        @keyframes cardEntrance {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .premium-input {
          transition: all 0.3s
            cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-input:focus {
          border-color: #8A956B;
          box-shadow:
            0 0 0 3px rgba(138, 149, 107, 0.15);
          outline: none;
        }

        .premium-button {
          transition: all 0.3s
            cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 8px 24px rgba(138, 149, 107, 0.25);
          background-color: #A5B17C;
        }
      `}</style>
      </div>
    </div>
  );
};

export default AuthPanel;

