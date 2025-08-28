import React from 'react';
import type { RequiredForm } from '../types';

interface FormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  forms: RequiredForm[] | null;
  isLoading: boolean;
}

const FormCard: React.FC<{form: RequiredForm}> = ({ form }) => (
    <li className="border p-4 rounded-lg bg-gray-50 shadow-sm transition-all hover:shadow-md hover:bg-white">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-gray-800 pr-2">{form.formName} ({form.formId})</h3>
            <span className="text-xs font-semibold uppercase text-gray-500 bg-gray-200 px-2 py-1 rounded-full whitespace-nowrap">
                Filled by: {form.filledBy}
            </span>
        </div>
        <p className="text-sm text-gray-600 my-2">{form.purpose}</p>
        <div className="flex items-center gap-4 mt-3">
            <a 
                href={form.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                aria-label={`Official page for ${form.formId}`}
            >
                Official Page &rarr;
            </a>
            <a 
                href={form.pdfLink} 
                target="_blank" 
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium"
                aria-label={`Download PDF for ${form.formId}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
            </a>
        </div>
    </li>
);

export const FormsModal: React.FC<FormsModalProps> = ({ isOpen, onClose, forms, isLoading }) => {
  if (!isOpen) {
    return null;
  }
  
  const groupedForms = forms?.reduce((acc, form) => {
    const category = form.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(form);
    return acc;
  }, {} as Record<string, RequiredForm[]>);

  const handleOpenAll = () => {
    alert("This will attempt to open multiple tabs. Please ensure your pop-up blocker is disabled for this site.");
    forms?.forEach(form => {
        window.open(form.link, '_blank');
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Required Compliance Forms</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold" aria-label="Close modal">&times;</button>
        </div>
        <div className="p-6 min-h-[300px] max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Researching required documentation...</p>
            </div>
          ) : groupedForms && Object.keys(groupedForms).length > 0 ? (
            <div className="space-y-6">
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    Here are the essential forms for this worker. Download each form and follow the instructions provided on the official websites.
                </p>
                {Object.entries(groupedForms).sort(([a], [b]) => a.localeCompare(b)).map(([category, formsInCategory]) => (
                    <section key={category}>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">{category}</h3>
                        <ul className="space-y-4">
                            {formsInCategory.map((form, index) => <FormCard key={index} form={form} />)}
                        </ul>
                    </section>
                ))}
            </div>
          ) : (
             <p className="text-gray-700 text-center">No forms could be retrieved at this time. Please try again.</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-between items-center">
          <button 
            onClick={handleOpenAll} 
            disabled={!forms || forms.length === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Open All Official Pages
          </button>
          <button 
            onClick={onClose} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
          >
            Close
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
