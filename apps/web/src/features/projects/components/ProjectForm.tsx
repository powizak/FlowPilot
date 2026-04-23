import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { ProjectFormFields, ProjectFormFieldsState } from './ProjectFormFields';

export type ProjectStatusValue = 'active' | 'archived' | 'on_hold';
export type ProjectCurrency = 'CZK' | 'EUR' | 'USD';

export interface ProjectFormValues {
  name: string;
  description: string;
  clientId: string | null;
  status: ProjectStatusValue;
  hourlyRate: number | null;
  currency: ProjectCurrency;
  defaultVatRate: number | null;
  billable: boolean;
  startDate: string;
  endDate: string;
  budget: number | null;
}

export type ProjectFormData = ProjectFormValues;

interface ProjectFormProps {
  initialData?: Partial<ProjectFormValues>;
  initialValues?: Partial<ProjectFormValues>;
  mode?: 'create' | 'edit';
  onSave: (data: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

const numberToField = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? ''
    : String(value);

const fieldToNumber = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const buildInitialState = (
  seed: Partial<ProjectFormValues> | undefined,
): ProjectFormFieldsState => ({
  name: seed?.name ?? '',
  description: seed?.description ?? '',
  clientId: seed?.clientId ?? '',
  status: seed?.status ?? 'active',
  hourlyRate: numberToField(seed?.hourlyRate ?? null),
  currency: seed?.currency ?? 'CZK',
  defaultVatRate: numberToField(seed?.defaultVatRate ?? null),
  billable: seed?.billable ?? true,
  startDate: seed?.startDate ?? '',
  endDate: seed?.endDate ?? '',
  budget: numberToField(seed?.budget ?? null),
});

export function ProjectForm({
  initialData,
  initialValues,
  mode = 'create',
  onSave,
  onCancel,
}: ProjectFormProps) {
  const seed = initialValues ?? initialData;
  const [formData, setFormData] = useState<ProjectFormFieldsState>(() =>
    buildInitialState(seed),
  );

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/clients?limit=100');
        setClients(data.data || []);
      } catch (error) {
        console.error('Failed to fetch clients', error);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: ProjectFormValues = {
        name: formData.name,
        description: formData.description,
        clientId: formData.clientId === '' ? null : formData.clientId,
        status: formData.status as ProjectStatusValue,
        hourlyRate: fieldToNumber(formData.hourlyRate),
        currency: formData.currency as ProjectCurrency,
        defaultVatRate: fieldToNumber(formData.defaultVatRate),
        billable: formData.billable,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: fieldToNumber(formData.budget),
      };
      await onSave(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target;
    const { name } = target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const checked = target.checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    const value = target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isEdit = mode === 'edit' || Boolean(initialData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
      <div className="bg-[#1a1a1a] border-[#2d2d2d] md:border w-full h-full md:h-auto md:max-w-lg md:rounded-lg shadow-2xl flex flex-col">
        <div className="p-4 md:p-6 border-b border-[#2d2d2d] flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-[#e5e5e5]">
            {isEdit ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
            type="button"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1"
        >
          <ProjectFormFields
            formData={formData}
            clients={clients}
            onChange={handleChange}
          />

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
              {isLoading ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
