import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Paperclip,
  Download,
  Trash2,
  Upload,
  FileText,
  Image,
  Film,
  Music,
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
}

interface TaskAttachmentsProps {
  taskId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/'))
    return <Image className="h-4 w-4 text-purple-400" />;
  if (mimeType.startsWith('video/'))
    return <Film className="h-4 w-4 text-pink-400" />;
  if (mimeType.startsWith('audio/'))
    return <Music className="h-4 w-4 text-green-400" />;
  return <FileText className="h-4 w-4 text-blue-400" />;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${taskId}/attachments`);
      setAttachments(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments((prev) => [res.data, ...prev]);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/attachments/${id}/url`);
      window.open(res.data.url, '_blank');
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/attachments/${id}`);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments
        {attachments.length > 0 && (
          <span className="text-xs text-zinc-500">({attachments.length})</span>
        )}
      </div>

      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full border border-dashed rounded-md p-3 text-center text-sm transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
            : 'border-zinc-700 bg-zinc-800/20 text-zinc-500 hover:border-zinc-600'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mx-auto mb-1" />
        {uploading ? 'Uploading...' : 'Drop file here or click to upload'}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </button>

      {loading && attachments.length === 0 ? (
        <div className="text-sm text-zinc-500 text-center py-2">Loading...</div>
      ) : attachments.length > 0 ? (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-800/50 hover:bg-zinc-800 group transition-colors"
            >
              <FileIcon mimeType={att.mimeType} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-200 truncate">
                  {att.fileName}
                </div>
                <div className="text-xs text-zinc-500">
                  {formatFileSize(att.sizeBytes)} · {att.uploadedBy.name}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleDownload(att.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  className="p-1 text-zinc-400 hover:text-red-400 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
