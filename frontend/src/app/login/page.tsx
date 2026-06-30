'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@biplatform.com');
  const [password, setPassword] = useState('admin123');
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, lang, isRtl, toggleLang } = useI18n();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires2FA) {
        setShow2FA(true);
        setTempToken(result.tempToken);
      } else {
        toast.success(t.common.success);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.errors.unauthorized);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authApi = await import('@/lib/api').then((m) => m.authApi);
      const { data } = await authApi.verify2FA(tempToken, code);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.errors.validationError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">{t.app.name}</h1>
          <p className="text-slate-500 mt-1">{t.app.subtitle}</p>
        </div>

        <div className="card p-6">
          {!show2FA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t.common.loading : t.auth.loginBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <h2 className="text-lg font-semibold">{t.auth.twoFactor}</h2>
              <div>
                <label className="block text-sm font-medium mb-1">{t.auth.code}</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="input-field" placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t.common.loading : t.auth.verify}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <button onClick={toggleLang} className="text-sm text-blue-600 hover:underline">
            {lang === 'fr' ? 'English' : lang === 'en' ? 'العربية' : 'Français'}
          </button>
        </div>
      </div>
    </div>
  );
}
