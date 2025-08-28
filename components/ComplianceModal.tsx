import React from 'react';

interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: string | null;
  isLoading: boolean;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({ isOpen, onClose, report, isLoading }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Compliance Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>
        <div className="p-6 min-h-[250px] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Analyzing compliance regulations...</p>
            </div>
          ) : (
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
              {report || "No report generated."}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-lg text-right">
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
