import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Download, Send, CheckCircle, XCircle, ArrowLeft, Edit } from 'lucide-react';
import { api } from '../../lib/api';
import { Invoice } from './types';

const statusColors = {
  DRAFT: 'bg-gray-500/20 text-gray-400',
  SENT: 'bg-blue-500/20 text-blue-400',
  VIEWED: 'bg-purple-500/20 text-purple-400',
  PAID: 'bg-green-500/20 text-green-400',
  OVERDUE: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-500 line-through'
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (action: 'send' | 'paid' | 'cancel') => {
    try {
      if (action === 'paid') {
        await api.post(`/invoices/${id}/paid`, { totalPaid: invoice?.total });
      } else {
        await api.post(`/invoices/${id}/${action}`);
      }
      fetchInvoice();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice?.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
    }
  };

  if (!invoice) return <div className="p-8 text-[#e5e5e5]">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="text-gray-400 hover:text-[#e5e5e5] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#e5e5e5] flex items-center gap-3">
            Invoice {invoice.invoiceNumber}
            <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[invoice.status] || ''}`}>
              {invoice.status}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <Link
              to={`/invoices/${id}/edit`}
              className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#e5e5e5] px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
          )}
          <button
            onClick={handleDownload}
            className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#e5e5e5] px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          {invoice.status === 'DRAFT' && (
            <button
              onClick={() => handleAction('send')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          )}
          {['SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status) && (
            <button
              onClick={() => handleAction('paid')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Mark Paid
            </button>
          )}
          {['DRAFT', 'SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status) && (
            <button
              onClick={() => handleAction('cancel')}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-8">
        <div className="flex justify-between border-b border-[#2d2d2d] pb-8 mb-8">
          <div>
            <h3 className="text-gray-400 font-medium mb-1">Billed To:</h3>
            <p className="text-[#e5e5e5] font-medium text-lg">{invoice.client?.name}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="text-gray-400 mr-2">Issue Date:</span>
              <span className="text-[#e5e5e5]">{new Date(invoice.issueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-400 mr-2">Due Date:</span>
              <span className="text-[#e5e5e5]">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <table className="w-full mb-8 text-sm">
          <thead className="text-gray-400 border-b border-[#2d2d2d] text-left">
            <tr>
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium text-right w-24">Qty</th>
              <th className="pb-3 font-medium text-right w-32">Price</th>
              <th className="pb-3 font-medium text-right w-24">VAT %</th>
              <th className="pb-3 font-medium text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="text-[#e5e5e5]">
            {invoice.lineItems?.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-[#2d2d2d]/50">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="py-3 text-right">{item.vatPercent}%</td>
                <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-3 text-sm text-[#e5e5e5]">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VAT:</span>
              <span>${invoice.vatAmount.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount:</span>
                <span>-${invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-3 border-t border-[#2d2d2d]">
              <span>Total:</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 pt-2">
              <span>Paid:</span>
              <span>${invoice.totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
