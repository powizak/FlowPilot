import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Client } from '../types';

interface ClientFormProps {
  initialData?: Client;
  onSave: (data: Partial<Client>) => Promise<void>;
  onCancel: () => void;
}

export function ClientForm({ initialData, onSave, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    isCompany: true,
    ic: '',
    dic: '',
    email: '',
    phone: '',
    website: '',
    billingAddress: { street: '', city: '', zip: '' },
    defaultPaymentTermsDays: 14,
    vatSubject: false,
    country: 'CZ',
    ...initialData,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);

  // Auto-lookup ARES when IČO reaches 8 digits
  useEffect(() => {
    if (formData.ic && formData.ic.length === 8 && formData.country === 'CZ') {
      lookupIco(formData.ic);
    }
  }, [formData.ic]);

  const lookupIco = async (ico: string) => {
    setAresLoading(true);
    try {
      const { data } = await api.get(`/clients/lookup-ico/${ico}`);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          ic: data.ic || prev.ic,
          dic: data.dic || prev.dic,
          billingAddress: {
            street: data.billingAddress?.street || prev.billingAddress?.street,
            city: data.billingAddress?.city || prev.billingAddress?.city,
            zip: data.billingAddress?.zip || prev.billingAddress?.zip,
          },
          vatSubject: !!data.dic, // usually if DIC is present, they are VAT registered
        }));
      }
    } catch (error) {
      console.error('ARES lookup failed', error);
    } finally {
      setAresLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith('billingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-[#2d2d2d] flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10">
          <h2 className="text-xl font-semibold text-[#e5e5e5]">
            {initialData ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center space-x-2 text-sm text-[#e5e5e5]">
                <input
                  type="checkbox"
                  name="isCompany"
                  checked={formData.isCompany}
                  onChange={handleChange}
                  className="rounded bg-[#1a1a1a] border-[#2d2d2d] text-violet-500 focus:ring-violet-500"
                />
                <span>Is Company</span>
              </label>
            </div>

            {formData.isCompany && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">IČO</label>
                  <div className="relative">
                    <input
                      name="ic"
                      value={formData.ic || ''}
                      onChange={handleChange}
                      className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
                      placeholder="8 digits for ARES"
                    />
                    {aresLoading && (
                      <span className="absolute right-3 top-2.5 text-xs text-violet-500 animate-pulse">
                        Looking up...
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">DIČ</label>
                  <input
                    name="dic"
                    value={formData.dic || ''}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
                  />
                </div>
              </>
            )}

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-400">Name</label>
              <input
                required
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Phone</label>
              <input
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <h3 className="text-sm font-medium text-gray-400 mt-4 border-b border-[#2d2d2d] pb-2">Billing Address</h3>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-400">Street</label>
              <input
                name="billingAddress.street"
                value={formData.billingAddress?.street || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">City</label>
              <input
                name="billingAddress.city"
                value={formData.billingAddress?.city || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">ZIP</label>
              <input
                name="billingAddress.zip"
                value={formData.billingAddress?.zip || ''}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-400">Notes</label>
              <textarea
                name="note"
                rows={3}
                value={formData.note || ''}
                onChange={handleChange as any}
                className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#2d2d2d] flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded text-sm font-medium text-gray-300 hover:bg-[#2d2d2d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
