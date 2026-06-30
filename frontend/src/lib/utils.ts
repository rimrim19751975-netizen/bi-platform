export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function downloadFromResponse(response: any, defaultFilename: string) {
  const disposition = response.headers?.['content-disposition'];
  let filename = defaultFilename;
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, '');
  }
  downloadBlob(response.data, filename);
}
