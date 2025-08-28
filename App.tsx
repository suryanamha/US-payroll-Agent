import React, { useState, useRef } from 'react';
import { PayrollForm } from './components/PayrollForm';
import { PayStub } from './components/PayStub';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { ComplianceReportModal } from './components/ComplianceModal';
import { FormsModal } from './components/FormsModal';
import { calculatePayroll, checkPayStubCompliance, getRequiredForms } from './services/geminiService';
import type { PayrollFormData, PayStubData, RequiredForm } from './types';

// Define a type for the imperative handle ref
interface PayStubRef {
  handlePrint: () => void;
}

function App() {
  const [payStubData, setPayStubData] = useState<PayStubData | null>(null);
  const [lastFormData, setLastFormData] = useState<PayrollFormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const payStubRef = useRef<PayStubRef>(null);

  // Compliance check states
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [report, setReport] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  
  // States for required forms
  const [isFormsModalOpen, setIsFormsModalOpen] = useState<boolean>(false);
  const [isFormsLoading, setIsFormsLoading] = useState<boolean>(false);
  const [requiredForms, setRequiredForms] = useState<RequiredForm[] | null>(null);


  const handleFormSubmit = async (formData: PayrollFormData) => {
    setIsLoading(true);
    setError(null);
    setPayStubData(null);
    setLastFormData(formData);
    try {
      const result = await calculatePayroll(formData);
      setPayStubData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to generate pay stub. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setPayStubData(null);
    setLastFormData(null);
    setError(null);
    setIsLoading(false);
    // reset compliance state
    setReport(null);
    setIsReportModalOpen(false);
    setIsReportLoading(false);
    // reset forms state
    setRequiredForms(null);
    setIsFormsModalOpen(false);
    setIsFormsLoading(false);
  };

  const handlePrint = () => {
    payStubRef.current?.handlePrint();
  };

  const handleCheckCompliance = async () => {
    if (!payStubData || !lastFormData) return;

    setIsReportModalOpen(true);
    setIsReportLoading(true);
    setReport(null);

    try {
      const complianceReport = await checkPayStubCompliance(payStubData, lastFormData);
      setReport(complianceReport);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setReport(`Failed to generate compliance report. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsReportLoading(false);
    }
  };
  
  const closeReportModal = () => {
      setIsReportModalOpen(false);
  }

  // Handler for fetching required forms
  const handleViewForms = async () => {
    if (!lastFormData) return;

    setIsFormsModalOpen(true);
    setIsFormsLoading(true);
    setRequiredForms(null);

    try {
      const forms = await getRequiredForms(lastFormData);
      setRequiredForms(forms);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      console.error(errorMessage);
    } finally {
      setIsFormsLoading(false);
    }
  };
  
  const closeFormsModal = () => {
    setIsFormsModalOpen(false);
  }


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {!payStubData && !isLoading && (
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
                    Payroll Calculator
                </h2>
                <p className="text-gray-600">Enter employee details below to generate a compliant pay stub for NJ or FL.</p>
            </div>
          )}
          
          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md text-center" role="alert">
              <strong className="font-bold text-lg">Calculation Error</strong>
              <span className="block mt-2">{error}</span>
               <button onClick={handleReset} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                Try Again
              </button>
            </div>
          ) : payStubData ? (
            <div>
              <PayStub ref={payStubRef} data={payStubData} />
              <div className="text-center mt-8 flex justify-center items-center gap-4 flex-wrap">
                 <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                    Calculate Another
                  </button>
                  <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                    Print PDF
                  </button>
                  <button onClick={handleCheckCompliance} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                    Check Compliance
                  </button>
                  <button onClick={handleViewForms} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                    View Compliance Forms
                  </button>
              </div>
            </div>
          ) : (
            <PayrollForm onSubmit={handleFormSubmit} />
          )}
        </div>
      </main>
      <Footer />
       <ComplianceReportModal 
        isOpen={isReportModalOpen} 
        onClose={closeReportModal} 
        report={report} 
        isLoading={isReportLoading} 
      />
      <FormsModal 
        isOpen={isFormsModalOpen}
        onClose={closeFormsModal}
        forms={requiredForms}
        isLoading={isFormsLoading}
      />
    </div>
  );
}

export default App;