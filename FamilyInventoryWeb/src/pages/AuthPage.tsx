import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]           = useState<'login' | 'signup'>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) { toast.error('名前を入力してください'); return; }
        if (password.length < 8) { toast.error('パスワードは8文字以上にしてください'); return; }
        await signUp(email, password, name.trim());
        toast.success('アカウントを作成しました！');
      } else {
        await signIn(email, password);
        toast.success('ログインしました');
      }
      navigate('/groups');
    } catch (err: unknown) {
      const msg = (err as { code?: string }).code;
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        toast.error('メールアドレスまたはパスワードが違います');
      } else if (msg === 'auth/email-already-in-use') {
        toast.error('このメールアドレスは既に使われています');
      } else if (msg === 'auth/weak-password') {
        toast.error('パスワードが短すぎます（8文字以上）');
      } else {
        toast.error('エラーが発生しました');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🏠</div>
        <h1 className="text-2xl font-black text-gray-800">おうち在庫帳</h1>
        <p className="text-sm text-gray-400 mt-1">家族みんなで使える在庫管理アプリ</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 w-full max-w-sm">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
            }`}
          >
            {m === 'login' ? 'ログイン' : '新規登録'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {mode === 'signup' && (
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="表示名（例：田中ファミリー）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input pl-10"
              autoComplete="name"
            />
          </div>
        )}

        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-10"
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder={mode === 'signup' ? 'パスワード（8文字以上）' : 'パスワード'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-10 pr-12"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-8 text-center max-w-xs leading-relaxed">
        登録することで利用規約とプライバシーポリシーに同意したものとみなします。
      </p>
    </div>
  );
};
