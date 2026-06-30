'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { importApi, analyticsApi } from '@/lib/api';
import { Sheet, ChartData } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    importApi.listFiles(1, 100).then(({ data }) => {
      const allSheets: Sheet[] = [];
      data.data.forEach((f: any) => f.sheets?.forEach((s: Sheet) => allSheets.push(s)));
      setSheets(allSheets);
    }).catch(() => {});
  }, []);

  const loadChart = async () => {
    if (!selectedSheet || !selectedField) return;
    setLoading(true);
    try {
      const { data } = await analyticsApi.getChart({ sheetId: selectedSheet, field: selectedField, chartType });
      setChartData(data);
    } catch {} finally { setLoading(false); }
  };

  const selectedSheetData = sheets.find((s) => s.id === selectedSheet);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">{t.analytics.title}</h1>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="select-field" value={selectedSheet} onChange={(e) => { setSelectedSheet(e.target.value); setSelectedField(''); }}>
            <option value="">{t.data.sheetName}</option>
            {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select-field" value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
            <option value="">{t.data.columnCount}</option>
            {selectedSheetData?.columns?.map((c) => <option key={c.name} value={c.name}>{c.originalName || c.name}</option>)}
          </select>
          <select className="select-field" value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="bar">{t.analytics.bar}</option>
            <option value="pie">{t.analytics.pie}</option>
            <option value="line">{t.analytics.line}</option>
            <option value="radar">{t.analytics.radar}</option>
          </select>
          <button onClick={loadChart} className="btn-primary" disabled={loading}>{t.common.apply}</button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

      {chartData && chartData.labels && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{chartData.field} - {chartType}</h2>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'bar' ? (
              <BarChart data={chartData.labels.map((l: string, i: number) => ({ name: l, value: chartData.datasets[0].data[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Pie data={chartData.labels.map((l: string, i: number) => ({ name: l, value: chartData.datasets[0].data[i] }))} cx="50%" cy="50%" outerRadius={150} dataKey="value" label>
                  {chartData.labels.map((_: string, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <LineChart data={chartData.labels.map((l: string, i: number) => ({ name: l, value: chartData.datasets[0].data[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
