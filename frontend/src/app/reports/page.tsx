'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { reportApi } from '@/lib/api';
import { Report } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.list().then(({ data }) => setReports(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (id: string, name: string) => {
    try {
      const response = await reportApi.generate(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t.common.success);
    } catch { toast.error(t.errors.serverError); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.reports.title}</h1>
        <button className="btn-primary" onClick={() => toast.success('Feature coming soon')}>{t.reports.create}</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-2">📄</p>
            <p>{t.reports.title}</p>
            <p className="text-xs mt-1">{t.reports.automatic}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.reports.name}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.reports.type}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.reports.schedule}</th>
                <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">{t.reports.lastRun}</th>
                <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase">{t.data.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 text-sm font-medium">{r.name}</td>
                  <td className="p-3 text-sm"><span className="badge-blue">{r.type}</span></td>
                  <td className="p-3 text-sm">{r.schedule || '-'}</td>
                  <td className="p-3 text-sm text-slate-500">{r.lastRunAt ? formatDate(r.lastRunAt) : '-'}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleGenerate(r.id, r.name)} className="text-blue-600 hover:text-blue-800 text-sm">{t.reports.generate}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
