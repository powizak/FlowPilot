import React, { useState } from 'react';
import { api } from '../../../lib/api';
import { Contact } from '../types';

interface ContactsTableProps {
  clientId: string;
  contacts: Contact[];
  onRefresh: () => void;
}

export function ContactsTable({
  clientId,
  contacts,
  onRefresh,
}: ContactsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditForm({ ...contact });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', email: '', phone: '', role: '', isPrimary: false });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await api.post(`/clients/${clientId}/contacts`, editForm);
      } else if (editingId) {
        await api.put(`/clients/${clientId}/contacts/${editingId}`, editForm);
      }
      onRefresh();
      handleCancel();
    } catch (error) {
      console.error('Failed to save contact', error);
      alert('Failed to save contact');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/clients/${clientId}/contacts/${contactId}`);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete contact', error);
      alert('Failed to delete contact');
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden">
      <div className="p-4 border-b border-[#2d2d2d] flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#e5e5e5]">Contacts</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding || editingId !== null}
          className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
        >
          Add Contact
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#2d2d2d]/50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Primary</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="border-b border-[#2d2d2d] bg-[#222]">
                <td className="px-4 py-3">
                  <input
                    name="name"
                    value={editForm.name || ''}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    name="role"
                    value={editForm.role || ''}
                    onChange={handleChange}
                    placeholder="Role"
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    name="email"
                    type="email"
                    value={editForm.email || ''}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    name="phone"
                    value={editForm.phone || ''}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    name="isPrimary"
                    type="checkbox"
                    checked={editForm.isPrimary || false}
                    onChange={handleChange}
                    className="rounded bg-[#1a1a1a] border-[#2d2d2d] text-violet-500"
                  />
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="text-violet-500 hover:text-violet-400"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-[#2d2d2d] hover:bg-[#2d2d2d]/30"
              >
                {editingId === contact.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        name="name"
                        value={editForm.name || ''}
                        onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name="role"
                        value={editForm.role || ''}
                        onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name="email"
                        type="email"
                        value={editForm.email || ''}
                        onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name="phone"
                        value={editForm.phone || ''}
                        onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded p-1.5 text-[#e5e5e5]"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        name="isPrimary"
                        type="checkbox"
                        checked={editForm.isPrimary || false}
                        onChange={handleChange}
                        className="rounded bg-[#1a1a1a] border-[#2d2d2d] text-violet-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="text-violet-500 hover:text-violet-400"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-400"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-[#e5e5e5]">
                      {contact.name}
                    </td>
                    <td className="px-4 py-3">{contact.role}</td>
                    <td className="px-4 py-3 text-blue-400 hover:underline">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </td>
                    <td className="px-4 py-3">{contact.phone}</td>
                    <td className="px-4 py-3 text-center">
                      {contact.isPrimary && (
                        <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-1 rounded-full border border-violet-500/30">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(contact)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {!isAdding && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No contacts found. Add a contact to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
