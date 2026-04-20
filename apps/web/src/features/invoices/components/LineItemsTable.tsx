import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { LineItem } from '../types';

interface Props {
  lineItems: Partial<LineItem>[];
  onChange: (items: Partial<LineItem>[]) => void;
  onOpenTimeEntriesModal: () => void;
}

export function LineItemsTable({ lineItems, onChange, onOpenTimeEntriesModal }: Props) {
  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (['quantity', 'unitPrice'].includes(field)) {
      const qty = Number(newItems[index].quantity || 0);
      const price = Number(newItems[index].unitPrice || 0);
      newItems[index].total = qty * price;
    }

    onChange(newItems);
  };

  const addItem = () => {
    onChange([
      ...lineItems,
      { description: '', quantity: 1, unit: 'hrs', unitPrice: 0, vatPercent: 21, total: 0, sortOrder: lineItems.length }
    ]);
  };

  const removeItem = (index: number) => {
    onChange(lineItems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#e5e5e5]">Line Items</h3>
        <div className="space-x-2">
          <button
            type="button"
            onClick={onOpenTimeEntriesModal}
            className="text-sm bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#e5e5e5] px-3 py-1.5 rounded transition-colors"
          >
            Add from Time Entries
          </button>
          <button
            type="button"
            onClick={addItem}
            className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#e5e5e5]">
          <thead className="text-xs uppercase bg-[#2d2d2d] text-gray-400">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 w-24">Qty</th>
              <th className="px-4 py-3 w-24">Unit</th>
              <th className="px-4 py-3 w-32">Price</th>
              <th className="px-4 py-3 w-24">VAT %</th>
              <th className="px-4 py-3 w-32">Total</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx} className="border-b border-[#2d2d2d] hover:bg-[#1a1a1a]/50">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-2 py-1 focus:border-violet-500 focus:outline-none"
                    placeholder="Description"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-2 py-1 focus:border-violet-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={item.unit || ''}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-2 py-1 focus:border-violet-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-2 py-1 focus:border-violet-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={item.vatPercent || ''}
                    onChange={(e) => handleItemChange(idx, 'vatPercent', Number(e.target.value))}
                    className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded px-2 py-1 focus:border-violet-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 font-medium">
                  {item.total?.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No line items yet. Add one manually or from time entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
