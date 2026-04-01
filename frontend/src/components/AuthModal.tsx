import { useState } from 'react';
import { X } from 'lucide-react';

export default function AuthModal({ onClose, onLogin }: { onClose: () => void, onLogin: (user: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(username);
        onClose();
      } else {
        setError(data.message || 'Error occurred');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Enter username..." />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Enter password..." />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">{isLogin ? 'Sign In' : 'Sign Up'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">{isLogin ? 'Sign Up' : 'Sign In'}</button>
        </div>
      </div>
    </div>
  );
}
