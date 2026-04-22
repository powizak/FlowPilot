import React from 'react';
import { Link } from 'react-router-dom';

export interface ClientProjectSummary {
  id: string;
  name: string;
  description?: string;
}

export interface ClientInvoiceSummary {
  id: string;
  number: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  status: string;
}

interface ClientProjectsSectionProps {
  projects: ClientProjectSummary[];
}

interface ClientInvoicesSectionProps {
  invoices: ClientInvoiceSummary[];
}

interface ClientNotesSectionProps {
  note?: string;
  onEdit: () => void;
}

export function ClientProjectsSection({
  projects,
}: ClientProjectsSectionProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No projects found for this client.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="p-3 border border-[#2d2d2d] rounded hover:border-gray-600 transition-colors"
            >
              <Link
                to={`/projects/${project.id}`}
                className="font-medium text-violet-400 hover:underline"
              >
                {project.name}
              </Link>
              <p className="text-sm text-gray-400 mt-1">
                {project.description || 'No description'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ClientInvoicesSection({
  invoices,
}: ClientInvoicesSectionProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No invoices found for this client.
        </p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="p-3 border border-[#2d2d2d] rounded flex justify-between"
            >
              <div>
                <span className="font-medium text-[#e5e5e5]">
                  {invoice.number}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="font-medium text-[#e5e5e5]">
                  {invoice.totalAmount} {invoice.currency}
                </span>
                <p className="text-sm text-gray-400 mt-1">{invoice.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ClientNotesSection({ note, onEdit }: ClientNotesSectionProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] p-6">
      <h3 className="text-lg font-medium text-[#e5e5e5] mb-4">
        Internal Notes
      </h3>
      {note ? (
        <div className="whitespace-pre-wrap text-sm text-gray-300 bg-[#222] p-4 rounded border border-[#2d2d2d]">
          {note}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No internal notes for this client.
        </p>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="mt-4 text-sm text-violet-500 hover:text-violet-400"
      >
        Edit Notes
      </button>
    </div>
  );
}
