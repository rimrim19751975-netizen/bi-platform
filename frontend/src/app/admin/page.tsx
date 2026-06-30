'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { adminApi } from '@/lib/api';
import { User, AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes, statsRes] = await Promise.all([
        adminApi.listUsers(), adminApi.getAuditLogs(1, 20), adminApi.getStats(),
      ]);
      setUsers(usersRes.data);
      setLogs(logsRes.data.data);
      setStats(statsRes.data);
    } catch { toast.error(t.errors.network); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'badge-red', ADMIN: 'badge-purple', ANALYST: 'badge-blue', AGENT: 'badge-green', VIEWER: 'badge-yellow',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.admin.title}</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.userCount}</p><p className="text-xs text-slate-500">{t.admin.users}</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.fileCount}</p><p className="text-xs text-slate-500">{t.dashboard.files}</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats.sheetCount}</p><p className="text-xs text-slate-500">{t.dashboard.sheets}</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-orange-600">{stats.logCount}</p><p className="text-xs text-slate-500">{t.admin.auditLogs}</p></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setTab('users')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.admin.users}</button>
        <button onClick={() => setTab('audit')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${tab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.admin.auditLogs}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : tab === 'users' ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.auth.email}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.admin.firstName}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.admin.lastName}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.admin.role}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.admin.active}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.data.created}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 text-sm">{u.email}</td>
                  <td className="p-3 text-sm">{u.firstName}</td>
                  <td className="p-3 text-sm">{u.lastName}</td>
                  <td className="p-3 text-sm"><span className={roleColors[u.role] || 'badge-blue'}>{u.role}</span></td>
                  <td className="p-3 text-sm">{u.isActive ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</td>
                  <td className="p-3 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Entity</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 text-sm"><span className="badge-blue">{log.action}</span></td>
                  <td className="p-3 text-sm">{log.entity}</td>
                  <td className="p-3 text-sm">{log.user?.email || '-'}</td>
                  <td className="p-3 text-sm text-slate-500">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
