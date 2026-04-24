import React from 'react';

export interface ProjectFormFieldsState {
  name: string;
  description: string;
  clientId: string;
  status: string;
  hourlyRate: string;
  currency: string;
  defaultVatRate: string;
  budget: string;
  startDate: string;
  endDate: string;
}

interface ProjectFormFieldsProps {
  formData: ProjectFormFieldsState;
  clients: { id: string; name: string }[];
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}

const inputClass =
  'w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-violet-500';
const labelClass = 'text-sm font-medium text-gray-400';

export function ProjectFormFields({
  formData,
  clients,
  onChange,
}: ProjectFormFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="project-name" className={labelClass}>
          Name
        </label>
        <input
          id="project-name"
          required
          name="name"
          value={formData.name}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="project-client" className={labelClass}>
          Client
        </label>
        <select
          id="project-client"
          name="clientId"
          value={formData.clientId}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">No Client (Internal)</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="project-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="project-status" className={labelClass}>
          Status
        </label>
        <select
          id="project-status"
          name="status"
          value={formData.status}
          onChange={onChange}
          className={inputClass}
        >
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="project-hourly-rate" className={labelClass}>
            Hourly Rate
          </label>
          <input
            id="project-hourly-rate"
            type="number"
            min="0"
            step="0.01"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={onChange}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="project-currency" className={labelClass}>
            Currency
          </label>
          <select
            id="project-currency"
            name="currency"
            value={formData.currency}
            onChange={onChange}
            className={inputClass}
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="project-default-vat" className={labelClass}>
            Default VAT Rate (%)
          </label>
          <input
            id="project-default-vat"
            type="number"
            min="0"
            max="100"
            step="0.01"
            name="defaultVatRate"
            value={formData.defaultVatRate}
            onChange={onChange}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="project-budget" className={labelClass}>
            Budget
          </label>
          <input
            id="project-budget"
            type="number"
            min="0"
            step="0.01"
            name="budget"
            value={formData.budget}
            onChange={onChange}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="project-start-date" className={labelClass}>
            Start Date
          </label>
          <input
            id="project-start-date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={onChange}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="project-end-date" className={labelClass}>
            End Date
          </label>
          <input
            id="project-end-date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={onChange}
            className={inputClass}
          />
        </div>
      </div>
    </>
  );
}
