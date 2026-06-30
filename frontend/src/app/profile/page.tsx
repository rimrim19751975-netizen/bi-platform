'use client';
import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success(t.common.success);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) { toast.error(err.response?.data?.error || t.errors.validationError); }
  };

  const handleSetup2FA = async () => {
    try {
      const { data } = await authApi.setup2FA();
      setSecret(data.secret);
      setQrUrl(data.qrUrl);
    } catch { toast.error(t.errors.serverError); }
  };

  const handleEnable2FA = async () => {
    try {
      await authApi.enable2FA(secret, code);
      toast.success(t.profile.enable2FA);
      setQrUrl('');
      setCode('');
    } catch (err: any) { toast.error(err.response?.data?.error || t.errors.validationError); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.profile.title}</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</div>
          <div>
            <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge-blue text-xs mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.profile.changePassword}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t.profile.currentPassword}</label><input type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
          <div><label className="block text-sm font-medium mb-1">{t.profile.newPassword}</label><input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
          <button type="submit" className="btn-primary">{t.common.save}</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.profile.twoFactor}</h2>
        {!qrUrl ? (
          <button onClick={handleSetup2FA} className="btn-primary">{t.profile.setup2FA}</button>
        ) : (
          <div className="space-y-4">
            <img src={qrUrl} alt="QR Code" className="mx-auto" />
            <p className="text-xs text-slate-500 text-center break-all">Secret: {secret}</p>
            <div><label className="block text-sm font-medium mb-1">{t.auth.code}</label><input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></div>
            <button onClick={handleEnable2FA} className="btn-primary">{t.profile.enable2FA}</button>
          </div>
        )}
      </div>
    </div>
  );
}
