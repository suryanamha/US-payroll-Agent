import React, { useState, useEffect } from 'react';
import type { CompanyInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyInfo) => void;
  currentInfo: CompanyInfo;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentInfo }) => {
  const [info, setInfo] = useState<CompanyInfo>(currentInfo);

  useEffect(() => {
    setInfo(currentInfo);
  }, [currentInfo, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(info);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Company Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold" aria-label="Close modal">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={info.name}
              onChange={handleChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={info.address}
              onChange={handleChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">Federal Tax ID (EIN) (Optional)</label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={info.taxId || ''}
              onChange={handleChange}
              placeholder="e.g., 12-3456789"
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
          >
            Save Changes
          </button>
        </div>
        <style>{`
          @keyframes fade-in-scale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale {
            animation: fade-in-scale 0.2s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};
