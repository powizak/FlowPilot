import { api } from '../../lib/api';

export async function downloadCsv(url: string, params: Record<string, any>, filename: string) {
  try {
    const response = await api.get(url, {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Failed to download CSV', error);
  }
}
