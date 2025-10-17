import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PayrollForm, initialFormData } from './components/PayrollForm';
import { PayStub } from './components/PayStub';
import { PayStubPreview } from './components/PayStubPreview';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { ComplianceReportModal } from './components/ComplianceModal';
import { FormsModal } from './components/FormsModal';
import { SettingsModal } from './components/SettingsModal';
import { calculatePayroll, checkPayStubCompliance, getRequiredForms } from './services/geminiService';
import type { PayrollFormData, PayStubData, RequiredForm, CompanyInfo, Taxes } from './types';

// Define a type for the imperative handle ref
interface PayStubRef {
  handlePrint: () => Promise<void>;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Payroll Agent',
  address: '123 Main St, Anytown, USA 12345',
  taxId: '',
};


function App() {
  const [payStubData, setPayStubData] = useState<PayStubData | null>(null);
  const [formData, setFormData] = useState<PayrollFormData>(initialFormData);
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
  
  // Company settings states
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // State for suggested taxes
  const [suggestedTaxes, setSuggestedTaxes] = useState<Taxes | null>(null);
  
  // State for printing
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem('companyInfo');
      if (savedInfo) {
        setCompanyInfo(JSON.parse(savedInfo));
      }
    } catch (error) {
      console.error("Failed to load company info from localStorage", error);
    }
  }, []);


  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPayStubData(null);

    try {
      const result = await calculatePayroll(formData, companyInfo);
      setPayStubData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to generate pay stub. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [formData, companyInfo]);
  
  const handleReset = useCallback(() => {
    setPayStubData(null);
    setFormData(initialFormData);
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
    // reset suggested taxes
    setSuggestedTaxes(null);
  }, []);

  const handlePrint = useCallback(async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
        await payStubRef.current?.handlePrint();
    } catch (error) {
        console.error("Printing failed", error);
        alert("An error occurred while trying to generate the PDF. Please try again.");
    } finally {
        setIsPrinting(false);
    }
  }, [isPrinting]);

  const handleCheckCompliance = useCallback(async () => {
    if (!payStubData) return;

    setIsReportModalOpen(true);
    setIsReportLoading(true);
    setReport(null);

    try {
      const complianceReport = await checkPayStubCompliance(payStubData, formData);
      setReport(complianceReport);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setReport(`Failed to generate compliance report. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsReportLoading(false);
    }
  }, [payStubData, formData]);
  
  const closeReportModal = useCallback(() => {
      setIsReportModalOpen(false);
  }, []);

  // Handler for fetching required forms
  const handleViewForms = useCallback(async () => {
    setIsFormsModalOpen(true);
    setIsFormsLoading(true);
    setRequiredForms(null);

    try {
      const forms = await getRequiredForms(formData);
      setRequiredForms(forms);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      console.error(errorMessage);
    } finally {
      setIsFormsLoading(false);
    }
  }, [formData]);
  
  const closeFormsModal = useCallback(() => {
    setIsFormsModalOpen(false);
  }, []);
  
  const handleSaveSettings = useCallback((newInfo: CompanyInfo) => {
    setCompanyInfo(newInfo);
    try {
      localStorage.setItem('companyInfo', JSON.stringify(newInfo));
    } catch (error) {
      console.error("Failed to save company info to localStorage", error);
    }
  }, []);

  const openSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header onSettingsClick={openSettingsModal} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {!payStubData && !isLoading && (
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
                    Payroll Calculator
                </h2>
                <p className="text-gray-600">Enter employee details below to generate a compliant pay stub for all 50 states and the District of Columbia.</p>
            </div>
          )}
          
          {isLoading ? (
            <Loader state={formData?.state} />
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md text-center" role="alert">
              <strong className="font-bold text-lg">Calculation Error</strong>
              <span className="block mt-2">{error}</span>
               <button onClick={handleReset} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                Try Again
              </button>
            </div>
          ) : payStubData ? (
            <div className="max-w-4xl mx-auto">
              <PayStub ref={payStubRef} data={payStubData} />
              <div className="text-center mt-8 flex justify-center items-center gap-4 flex-wrap">
                 <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg">
                    Calculate Another
                  </button>
                  <button onClick={handlePrint} disabled={isPrinting} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isPrinting ? 'Generating PDF...' : 'Print PDF'}
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
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <PayrollForm 
                  data={formData}
                  onDataChange={setFormData}
                  onSubmit={handleFormSubmit} 
                  suggestedTaxes={suggestedTaxes}
                  onSuggestionsChange={setSuggestedTaxes}
                />
              </div>
              <div className="lg:col-span-2">
                <PayStubPreview data={formData} suggestedTaxes={suggestedTaxes} />
              </div>
            </div>
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
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        onSave={handleSaveSettings}
        currentInfo={companyInfo}
      />
    </div>
  );
}

export default App;