import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Client } from './types';
import { ClientForm } from './components/ClientForm';
import {
  ClientInvoicesSection,
  ClientNotesSection,
  ClientProjectsSection,
  type ClientInvoiceSummary,
  type ClientProjectSummary,
} from './components/ClientDetailSections';
import { ContactsTable } from './components/ContactsTable';

type Tab = 'projects' | 'invoices' | 'contacts' | 'notes';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [showEditForm, setShowEditForm] = useState(false);
  const [projects, setProjects] = useState<ClientProjectSummary[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoiceSummary[]>([]);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data.data || data);
    } catch (error) {
      console.error('Failed to fetch client', error);
      navigate('/clients');
    }
  }, [id, navigate]);

  const fetchTabData = useCallback(async () => {
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
  }, [activeTab, id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

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
        <Link
          to="/clients"
          className="text-gray-400 hover:text-white text-sm mb-4 inline-block"
        >
          &larr; Back to Clients
        </Link>
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
              type="button"
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 border border-[#2d2d2d] rounded text-sm font-medium hover:bg-[#2d2d2d] text-[#e5e5e5] transition-colors"
            >
              Edit Client
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-red-500/30 text-red-500 rounded text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6 p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Contact Info
            </span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              {client.email && (
                <p className="mb-1">
                  📧{' '}
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:underline"
                  >
                    {client.email}
                  </a>
                </p>
              )}
              {client.phone && <p className="mb-1">📱 {client.phone}</p>}
              {client.website && (
                <p className="mb-1">
                  🌐{' '}
                  <a
                    href={
                      client.website.startsWith('http')
                        ? client.website
                        : `https://${client.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {client.website}
                  </a>
                </p>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Billing Address
            </span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              {client.billingAddress?.street || client.billingAddress?.city ? (
                <>
                  <p>{client.billingAddress.street}</p>
                  <p>
                    {client.billingAddress.city}, {client.billingAddress.zip}
                  </p>
                  <p>{client.country}</p>
                </>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Details
            </span>
            <div className="mt-2 text-sm text-[#e5e5e5]">
              <p className="mb-1">
                Payment terms: {client.defaultPaymentTermsDays} days
              </p>
              <p className="mb-1">
                VAT Subject: {client.vatSubject ? 'Yes' : 'No'}
              </p>
              <p className="mb-1 text-gray-500 text-xs mt-2">
                Added: {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="border-b border-[#2d2d2d] mb-6">
        <nav className="flex space-x-8">
          {(['projects', 'invoices', 'contacts', 'notes'] as Tab[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {tab}
                {tab === 'contacts' && client.contacts?.length > 0 && (
                  <span className="ml-2 bg-[#2d2d2d] text-xs px-2 py-0.5 rounded-full">
                    {client.contacts.length}
                  </span>
                )}
              </button>
            ),
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'projects' && (
          <ClientProjectsSection projects={projects} />
        )}

        {activeTab === 'invoices' && (
          <ClientInvoicesSection invoices={invoices} />
        )}

        {activeTab === 'contacts' && (
          <ContactsTable
            clientId={client.id}
            contacts={client.contacts || []}
            onRefresh={fetchClient}
          />
        )}

        {activeTab === 'notes' && (
          <ClientNotesSection
            note={client.note}
            onEdit={() => setShowEditForm(true)}
          />
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
