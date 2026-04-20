import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';

interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface TaskCommentsProps {
  taskId: string;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function AuthorAvatar({ author }: { author: CommentAuthor }) {
  if (author.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
    );
  }

  const initials = author.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-blue-600 flex items-center justify-center text-xs font-medium text-white">
      {initials}
    </div>
  );
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newBody, setNewBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        body: newBody.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setNewBody('');
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editBody.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/comments/${id}`, { body: editBody.trim() });
      setComments((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      setEditingId(null);
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* ignore */
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments
        {comments.length > 0 && (
          <span className="text-xs text-zinc-500">({comments.length})</span>
        )}
      </div>

      {loading && comments.length === 0 ? (
        <div className="text-sm text-zinc-500 text-center py-4">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="border border-zinc-800 rounded-md p-4 text-center text-sm text-zinc-500 bg-zinc-800/20">
          No comments yet. Start the discussion.
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <AuthorAvatar author={comment.author} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {user?.id === comment.authorId &&
                    editingId !== comment.id && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                </div>
                {editingId === comment.id ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(comment.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(comment.id)}
                      className="p-1 text-green-400 hover:text-green-300"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300 mt-0.5 whitespace-pre-wrap break-words">
                    {comment.body}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={!newBody.trim() || submitting}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
