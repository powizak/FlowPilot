import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Client } from './types';
import { ClientForm } from './components/ClientForm';
import { ContactsTable } from './components/ContactsTable';

type Tab = 'projects' | 'invoices' | 'contacts' | 'notes';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [showEditForm, setShowEditForm] = useState(false);


  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchClient = async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data.data || data);
    } catch (error) {
      console.error('Failed to fetch client', error);
      navigate('/clients');
    }
  };

  const fetchTabData = async () => {
    if (!id) return;
    try {
      if (activeTab === 'projects') {
        const { data } = await api.get(`/clients/${id}/projects`);
        setProjects(data.data || data);
      } else if (activeTab === 'invoices') {
        const { data } = await api.get(`/clients/${id}/invoices`);
        setInvoices(data.data || data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}`, error);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  useEffect(() => {
    fetchTabData();
  }, [id, activeTab]);

  const handleUpdateClient = async (formData: Partial<Client>) => {
    if (!id) return;
    await api.put(`/clients/${id}`, formData);
    setShowEditForm(false);
    fetchClient();
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this client?')) return;
    await api.delete(`/clients/${id}`);
    navigate('/clients');
  };

  if (!client) {
    return <div className="p-8 text-gray-500">Loading client...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/clients" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">&larr; Back to Clients</Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#e5e5e5]">{client.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {client.isCompany ? 'Company' : 'Individual'}
              {client.ic && ` • IČO: ${client.ic}`}
              {client.dic && ` • DIČ: ${client.dic}`}
            </p>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 border border-[#2d2d2d] rounded text-sm font-medium hover:bg-[#2d2d2d] text-[#e5e5e5] transition-colors"
            >
              Edit Client
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-500/30 text-red-500 rounded text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6 p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact Info</span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              {client.email && <p className="mb-1">📧 <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a></p>}
              {client.phone && <p className="mb-1">📱 {client.phone}</p>}
              {client.website && <p className="mb-1">🌐 <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{client.website}</a></p>}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Billing Address</span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              {client.billingAddress?.street || client.billingAddress?.city ? (
                <>
                  <p>{client.billingAddress.street}</p>
                  <p>{client.billingAddress.city}, {client.billingAddress.zip}</p>
                  <p>{client.country}</p>
                </>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Details</span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              <p className="mb-1">Payment terms: {client.defaultPaymentTermsDays} days</p>
              <p className="mb-1">VAT Subject: {client.vatSubject ? 'Yes' : 'No'}</p>
              <p className="mb-1 text-gray-500 text-xs mt-2">Added: {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="border-b border-[#2d2d2d] mb-6">
        <nav className="flex space-x-8">
          {(['projects', 'invoices', 'contacts', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab}
              {tab === 'contacts' && client.contacts?.length > 0 && (
                <span className="ml-2 bg-[#2d2d2d] text-xs px-2 py-0.5 rounded-full">{client.contacts.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'projects' && (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects found for this client.</p>
            ) : (
              <ul className="space-y-3">
                {projects.map(p => (
                  <li key={p.id} className="p-3 border border-[#2d2d2d] rounded hover:border-gray-600 transition-colors">
                    <Link to={`/projects/${p.id}`} className="font-medium text-violet-400 hover:underline">{p.name}</Link>
                    <p className="text-sm text-gray-400 mt-1">{p.description || 'No description'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices found for this client.</p>
            ) : (
              <ul className="space-y-3">
                {invoices.map(inv => (
                  <li key={inv.id} className="p-3 border border-[#2d2d2d] rounded flex justify-between">
                    <div>
                      <span className="font-medium text-[#e5e5e5]">{inv.number}</span>
                      <p className="text-sm text-gray-400 mt-1">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-[#e5e5e5]">{inv.totalAmount} {inv.currency}</span>
                      <p className="text-sm text-gray-400 mt-1">{inv.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <ContactsTable
            clientId={client.id}
            contacts={client.contacts || []}
            onRefresh={fetchClient}
          />
        )}

        {activeTab === 'notes' && (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
            <h3 className="text-lg font-medium text-[#e5e5e5] mb-4">Internal Notes</h3>
            {client.note ? (
              <div className="whitespace-pre-wrap text-sm text-gray-300 bg-[#222] p-4 rounded border border-[#2d2d2d]">
                {client.note}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No internal notes for this client.</p>
            )}
            <button
              onClick={() => setShowEditForm(true)}
              className="mt-4 text-sm text-violet-500 hover:text-violet-400"
            >
              Edit Notes
            </button>
          </div>
        )}
      </div>

      {showEditForm && (
        <ClientForm
          initialData={client}
          onSave={handleUpdateClient}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
