import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser } from '../../utils/auth';

export const AuthPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 3D Parallax Tilt & Light Reflection Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [lightStyle, setLightStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Extremely subtle 3D tilt (max 3 degrees for high-end SaaS feel)
    const rotateX = ((centerY - y) / centerY) * 3;
    const rotateY = ((x - centerX) / centerX) * 3;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    });

    // Light reflection layer mapped to cursor
    setLightStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.05) 0%, transparent 65%)`,
    });
  };

  const handleMouseLeave = () => {
    // Reset to flat
    setTiltStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg)`,
    });
    setLightStyle({
      opacity: 0,
    });
  };

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (activeTab === 'signup' && !name.trim()) {
      tempErrors.name = 'Full name is required';
    }
    if (!email) {
      tempErrors.email = 'Official email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const session = await loginUser(email, password);
      setIsLoading(false);
      if (session.role === 'officer') {
        navigate('/field/dashboard');
      } else if (session.role === 'supervisor') {
        navigate('/supervisor/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      setFormError('Invalid email or password');
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...tiltStyle,
        transformStyle: 'preserve-3d',
      }}
      className="relative w-full bg-[#1A2017]/85 border border-[#44503E]/45 p-6 md:p-8 rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,0.6)] text-[#EEE9DC] backdrop-blur-xl auth-panel-card"
    >
      {/* Light Reflection Layer Overlay */}
      <div 
        className="absolute inset-0 rounded-[24px] pointer-events-none z-30 transition-opacity duration-300"
        style={lightStyle}
      />

      {/* Topographic contour vector art inside the Card (Earthy element) */}
      <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
        <svg className="w-full h-full" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 120 C80 170, 130 80, 450 160" stroke="#8A956B" strokeWidth="1.5" />
          <path d="M-50 150 C80 200, 160 110, 450 190" stroke="#8A956B" strokeWidth="1.5" />
          <path d="M-50 180 C100 240, 180 140, 450 220" stroke="#8A956B" strokeWidth="1.5" />
          <path d="M-50 220 C110 290, 200 180, 450 260" stroke="#8A956B" strokeWidth="1.5" />
          <path d="M-50 260 C120 340, 220 220, 450 300" stroke="#8A956B" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Tab Header (Sign in only) */}
      <div className="flex border-b border-[#44503E]/30 mb-6 relative z-10">
        <div className="flex-1 pb-3 text-xs md:text-sm font-semibold tracking-wider uppercase border-[#8A956B] text-[#EEE9DC] border-b-2 text-center">
          Sign in
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10" noValidate>
        {formError && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 text-xs rounded-lg text-center font-medium">
            {formError}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-[10px] font-semibold text-[#B9B6A7]/80 uppercase tracking-widest">
            Official Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.gov"
              className={`w-full bg-[#0E130D]/95 border text-[#EEE9DC] placeholder-[#8E907F]/50 text-sm rounded-xl py-3 pl-10 pr-4 outline-hidden premium-input ${
                errors.email 
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-3 focus:ring-red-500/10' 
                  : 'border-[#44503E]/40 focus:border-[#8A956B]'
              }`}
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9B6A7]/40" />
          </div>
          {errors.email && <p className="text-[11px] text-red-400/90 font-medium">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-[10px] font-semibold text-[#B9B6A7]/80 uppercase tracking-widest">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-[#0E130D]/95 border text-[#EEE9DC] placeholder-[#8E907F]/50 text-sm rounded-xl py-3 pl-10 pr-10 outline-hidden premium-input ${
                errors.password 
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-3 focus:ring-red-500/10' 
                  : 'border-[#44503E]/40 focus:border-[#8A956B]'
              }`}
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9B6A7]/40" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B6A7]/40 hover:text-[#EEE9DC] p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-red-400/90 font-medium">{errors.password}</p>}
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 border-[#44503E]/60 rounded-sm bg-[#0E130D] text-[#8A956B] accent-[#8A956B] cursor-pointer"
            />
            <span className="text-[#B9B6A7]/80">Remember me</span>
          </label>
          <a href="#forgot" className="text-[#8A956B] hover:text-[#A5B17C] font-semibold transition-colors font-mono text-[10px] tracking-wider">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
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
        <span>SECURE END-TO-END GOVERNMENT PORTAL</span>
      </div>

      <style>{`
        /* Card slide up entrance */
        .auth-panel-card {
          animation: cardEntrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

        /* Input field active styles */
        .premium-input {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-input:focus {
          border-color: #8A956B;
          box-shadow: 0 0 0 3px rgba(138, 149, 107, 0.15);
          outline: none;
        }

        /* Button Hover & Lift */
        .premium-button {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(138, 149, 107, 0.25);
          background-color: #A5B17C;
        }
      `}</style>
    </div>
  );
};

export default AuthPanel;
