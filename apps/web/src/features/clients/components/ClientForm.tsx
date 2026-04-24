import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { Client } from '../types';
import { ClientInputField, ClientTextareaField } from './ClientFormFields';

function sanitizeClientPayload(data: Partial<Client>): Partial<Client> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === null || value === undefined) continue;
    if (key === 'billingAddress' || key === 'deliveryAddress') {
      const addr = value as Record<string, unknown> | null;
      if (!addr) continue;
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(addr)) {
        if (v !== '' && v !== null && v !== undefined) cleaned[k] = v;
      }
      if (Object.keys(cleaned).length > 0) out[key] = cleaned;
      continue;
    }
    out[key] = value;
  }
  return out as Partial<Client>;
}

const inputClassName =
  'w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500';

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
  const isEditing = !!initialData;
  // Skip the ARES auto-lookup on initial mount when editing an existing client
  // so we don't overwrite saved fields (especially vatSubject) with derived data.
  const hasUserEditedIcRef = useRef(!isEditing);

  const lookupIco = useCallback(
    async (ico: string) => {
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
              street:
                data.billingAddress?.street || prev.billingAddress?.street,
              city: data.billingAddress?.city || prev.billingAddress?.city,
              zip: data.billingAddress?.zip || prev.billingAddress?.zip,
            },
            // Only infer vatSubject when creating a new client. On edit we
            // respect the user's saved value to avoid silent overwrites.
            vatSubject: isEditing ? prev.vatSubject : !!data.dic,
          }));
        }
      } catch (error) {
        console.error('ARES lookup failed', error);
      } finally {
        setAresLoading(false);
      }
    },
    [isEditing],
  );

  useEffect(() => {
    if (!hasUserEditedIcRef.current) return;
    if (formData.ic && formData.ic.length === 8 && formData.country === 'CZ') {
      lookupIco(formData.ic);
    }
  }, [formData.country, formData.ic, lookupIco]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(sanitizeClientPayload(formData));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
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
      if (name === 'ic') hasUserEditedIcRef.current = true;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
      <div className="bg-[#1a1a1a] border-[#2d2d2d] md:border w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto md:rounded-lg shadow-2xl flex flex-col">
        <div className="p-4 md:p-6 border-b border-[#2d2d2d] flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10 shrink-0">
          <h2 className="text-xl font-semibold text-[#e5e5e5]">
            {initialData ? 'Edit Client' : 'New Client'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
            type="button"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 flex-1">
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
                  <label
                    htmlFor="client-ic"
                    className="text-sm font-medium text-gray-400"
                  >
                    IČO
                  </label>
                  <div className="relative">
                    <input
                      id="client-ic"
                      name="ic"
                      value={formData.ic || ''}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="8 digits for ARES"
                    />
                    {aresLoading && (
                      <span className="absolute right-3 top-2.5 text-xs text-violet-500 animate-pulse">
                        Looking up...
                      </span>
                    )}
                  </div>
                </div>

                <ClientInputField
                  id="client-dic"
                  label="DIČ"
                  name="dic"
                  value={formData.dic || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </>
            )}

            <ClientInputField
              id="client-name"
              label="Name"
              containerClassName="col-span-2 space-y-1"
              required
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <ClientInputField
              id="client-email"
              label="Email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <ClientInputField
              id="client-phone"
              label="Phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <div className="col-span-2 space-y-1">
              <h3 className="text-sm font-medium text-gray-400 mt-4 border-b border-[#2d2d2d] pb-2">
                Billing Address
              </h3>
            </div>

            <ClientInputField
              id="client-billing-street"
              label="Street"
              containerClassName="col-span-2 space-y-1"
              name="billingAddress.street"
              value={formData.billingAddress?.street || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <ClientInputField
              id="client-billing-city"
              label="City"
              name="billingAddress.city"
              value={formData.billingAddress?.city || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <ClientInputField
              id="client-billing-zip"
              label="ZIP"
              name="billingAddress.zip"
              value={formData.billingAddress?.zip || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <ClientTextareaField
              id="client-note"
              label="Notes"
              containerClassName="col-span-2 space-y-1"
              name="note"
              rows={3}
              value={formData.note || ''}
              onChange={handleChange}
              className={inputClassName}
            />

            <div className="col-span-2 space-y-1">
              <h3 className="text-sm font-medium text-gray-400 mt-4 border-b border-[#2d2d2d] pb-2">
                Billing Details
              </h3>
            </div>

            <ClientInputField
              id="client-payment-terms"
              label="Payment terms (days)"
              type="number"
              min={0}
              name="defaultPaymentTermsDays"
              value={formData.defaultPaymentTermsDays ?? 14}
              onChange={handleChange}
              className={inputClassName}
            />

            <div className="space-y-1 flex items-end">
              <label className="flex items-center space-x-2 text-sm text-[#e5e5e5] pb-2">
                <input
                  type="checkbox"
                  name="vatSubject"
                  checked={!!formData.vatSubject}
                  onChange={handleChange}
                  className="rounded bg-[#1a1a1a] border-[#2d2d2d] text-violet-500 focus:ring-violet-500"
                />
                <span>VAT Subject (plátce DPH)</span>
              </label>
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
