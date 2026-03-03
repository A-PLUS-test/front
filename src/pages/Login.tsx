import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFormCard from '../components/auth/AuthFormCard';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('로그인 실패:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error: any) {
      console.error('Google 로그인 실패:', error);
      setError('Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormCard
      header={
        <div>
          <div className="flex justify-center">
            <img src="/aplus_icon.png" alt="APLUS" className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-center">
            <span className="text-3xl logo-font" style={{ color: '#22C7FB' }}>APLUS</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">로그인하여 학습을 시작하세요</p>
        </div>
      }
    >

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#22C7FB] focus:border-[#22C7FB]"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#22C7FB] focus:border-[#22C7FB]"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#22C7FB] hover:bg-[#1BB0E0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22C7FB] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-white/90 group-hover:text-white" />
              </span>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <GoogleAuthButton onClick={handleGoogleSignIn} disabled={loading} text="Google로 로그인" />

          <div className="text-center">
            <span className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="font-medium text-[#22C7FB] hover:text-[#1BB0E0]">
                회원가입
              </Link>
            </span>
          </div>
        </form>
    </AuthFormCard>
  );
};

export default Login;
