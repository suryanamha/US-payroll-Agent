import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import type { PayStubData } from '../types';

// Declare globals that will be loaded from CDN scripts
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Resolve immediately if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error for ${src}`));
        document.body.appendChild(script);
    });
};

const HTML2CANVAS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
const JSPDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const StubRow: React.FC<{ label: string; value: string | number; isBold?: boolean }> = ({ label, value, isBold = false }) => (
    <div className={`flex justify-between py-1 ${isBold ? 'font-bold' : ''}`}>
        <span>{label}</span>
        <span>{typeof value === 'number' ? formatCurrency(value) : value}</span>
    </div>
);


export const PayStub = forwardRef(({ data }: { data: PayStubData }, ref) => {
    const { companyInfo, employeeInfo, payPeriod, earnings, grossPay, totalEarningsYTD, deductions, totalDeductions, netPay, netPayYTD, employerContributions } = data;
    const isContractor = employeeInfo.employeeType === 'contractor';
    const { flsaStatus } = employeeInfo;
    const printContainerRef = useRef<HTMLDivElement>(null);
    const { taxes } = deductions;
    
    const totalTaxes = !isContractor && taxes ? Object.values(taxes).reduce((sum, amount) => sum + (amount || 0), 0) : 0;
    
    // Helper to get state-specific tax totals
    const getStateTaxTotal = (stateAbbr: string) => {
        if (!taxes) return 0;
        switch (stateAbbr) {
            case 'NJ': return taxes.njStateIncomeTax + taxes.njSUI + taxes.njSDI + taxes.njFLI;
            case 'NY': return taxes.nyStateIncomeTax + taxes.nyLocalIncomeTax + taxes.nyDisabilityInsurance + taxes.nyPaidFamilyLeave;
            case 'IN': return taxes.inStateIncomeTax + taxes.inCountyIncomeTax;
            case 'CA': return taxes.caStateIncomeTax + taxes.caSDI;
            case 'OH': return taxes.ohStateIncomeTax + taxes.ohLocalIncomeTax;
            case 'PA': return taxes.paStateIncomeTax + taxes.paLocalIncomeTax;
            case 'MI': return taxes.miStateIncomeTax + taxes.miLocalIncomeTax;
            case 'KY': return taxes.kyStateIncomeTax + taxes.kyLocalIncomeTax;
            case 'MD': return taxes.mdStateIncomeTax + taxes.mdCountyIncomeTax;
            case 'MA': return taxes.maStateIncomeTax + taxes.maPFML;
            case 'RI': return taxes.riStateIncomeTax + taxes.riTDI;
            case 'WA': return taxes.waStateIncomeTax + taxes.waPFML;
            default:
                const key = `${stateAbbr.toLowerCase()}StateIncomeTax` as keyof typeof taxes;
                return taxes[key] || 0;
        }
    };
    
    const currentStateTaxTotal = getStateTaxTotal(employeeInfo.state);

    const handlePrint = async () => {
        const input = printContainerRef.current;
        if (!input) {
            console.error("Pay stub element not found for printing.");
            throw new Error("Pay stub element not found.");
        }

        await Promise.all([loadScript(HTML2CANVAS_SRC), loadScript(JSPDF_SRC)]);

        const canvas = await window.html2canvas(input, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasRatio = canvas.width / canvas.height;
        let finalWidth = pdfWidth;
        let finalHeight = pdfWidth / canvasRatio;

        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = pdfHeight * canvasRatio;
        }
        
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
        
        const fileName = `PayStub-${employeeInfo.name.replace(/\s/g, '_')}-${payPeriod.endDate}.pdf`;
        pdf.save(fileName);
    };
    
    useImperativeHandle(ref, () => ({
        handlePrint,
    }));


    return (
        <div ref={printContainerRef} className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-4xl mx-auto border-t-8 border-blue-600">
            <header className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800">{companyInfo.name}</h2>
                    <p className="text-gray-500">{companyInfo.address}</p>
                    {companyInfo.taxId && <p className="text-xs text-gray-500 mt-1">EIN: {companyInfo.taxId}</p>}
                </div>
                <h3 className="text-2xl font-bold text-gray-600">{isContractor ? 'Payment Voucher' : 'Pay Stub'}</h3>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm">
                <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-bold text-gray-700 mb-2">{isContractor ? 'Contractor' : 'Employee'}</h4>
                    <p>{employeeInfo.name} ({employeeInfo.state})</p>
                    {!isContractor && <p className="text-xs text-gray-600 mt-1">FLSA Status: {flsaStatus === 'exempt' ? 'Exempt' : 'Non-Exempt'}</p>}
                </div>
                <div className="bg-gray-50 p-4 rounded"><h4 className="font-bold text-gray-700 mb-2">Pay Period</h4><p>{payPeriod.startDate} - {payPeriod.endDate}</p></div>
                <div className="bg-gray-50 p-4 rounded"><h4 className="font-bold text-gray-700 mb-2">Pay Date</h4><p>{payPeriod.payDate}</p></div>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div>
                    <div className="mb-6 bg-white p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Earnings</h4>
                        {earnings.map((earning, index) => (<div key={index} className="flex justify-between items-center text-sm mb-1"><span>{earning.description} ({earning.hours > 0 ? `${formatCurrency(earning.rate)} x ${earning.hours} hrs` : 'Salary'})</span><span className="font-mono text-right">{formatCurrency(earning.amount)}</span></div>))}
                        <hr className="my-2"/><StubRow label="Gross Pay" value={grossPay} isBold />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">{isContractor ? 'Adjustments' : 'Deductions'}</h4>
                        {deductions.preTax.length > 0 && (<><p className="text-xs font-semibold text-gray-500 mt-2">PRE-TAX DEDUCTIONS</p>{deductions.preTax.map((ded, i) => <StubRow key={`pre-${i}`} label={ded.name} value={-ded.amount} />)}</>)}
                        {!isContractor && totalTaxes > 0 && (
                             <>
                                <p className="text-xs font-semibold text-gray-500 mt-2">FEDERAL TAXES</p>
                                <StubRow label="Federal Income Tax" value={-taxes.federalIncomeTax} />
                                <StubRow label="Social Security" value={-taxes.socialSecurity} />
                                <StubRow label="Medicare" value={-taxes.medicare} />
                                
                                {currentStateTaxTotal > 0 && (<p className="text-xs font-semibold text-gray-500 mt-2">{employeeInfo.state} STATE TAXES</p>)}
                                {employeeInfo.state === 'NJ' && (<><StubRow label="State Income Tax" value={-taxes.njStateIncomeTax} /><StubRow label="State Unemployment (SUI)" value={-taxes.njSUI} /><StubRow label="State Disability (SDI)" value={-taxes.njSDI} /><StubRow label="Family Leave (FLI)" value={-taxes.njFLI} /></>)}
                                {employeeInfo.state === 'NY' && (<><StubRow label="State Income Tax" value={-taxes.nyStateIncomeTax} /><StubRow label="Local Income Tax" value={-taxes.nyLocalIncomeTax} /><StubRow label="State Disability (NYSDI)" value={-taxes.nyDisabilityInsurance} /><StubRow label="Paid Family Leave (NYPFL)" value={-taxes.nyPaidFamilyLeave} /></>)}
                                {employeeInfo.state === 'IN' && (<><StubRow label="State Income Tax" value={-taxes.inStateIncomeTax} /><StubRow label="County Income Tax" value={-taxes.inCountyIncomeTax} /></>)}
                                {employeeInfo.state === 'CA' && (<><StubRow label="State Income Tax" value={-taxes.caStateIncomeTax} /><StubRow label="State Disability (SDI)" value={-taxes.caSDI} /></>)}
                                {employeeInfo.state === 'OH' && (<><StubRow label="State Income Tax" value={-taxes.ohStateIncomeTax} /><StubRow label="Local Income Tax" value={-taxes.ohLocalIncomeTax} /></>)}
                                {employeeInfo.state === 'PA' && (<><StubRow label="State Income Tax" value={-taxes.paStateIncomeTax} /><StubRow label="Local Taxes (EIT/LST)" value={-taxes.paLocalIncomeTax} /></>)}
                                {employeeInfo.state === 'MI' && (<><StubRow label="State Income Tax" value={-taxes.miStateIncomeTax} /><StubRow label="City Income Tax" value={-taxes.miLocalIncomeTax} /></>)}
                                {employeeInfo.state === 'KY' && (<><StubRow label="State Income Tax" value={-taxes.kyStateIncomeTax} /><StubRow label="Local Occ. Tax" value={-taxes.kyLocalIncomeTax} /></>)}
                                {employeeInfo.state === 'MD' && (<><StubRow label="State Income Tax" value={-taxes.mdStateIncomeTax} /><StubRow label="County Income Tax" value={-taxes.mdCountyIncomeTax} /></>)}
                                {employeeInfo.state === 'MA' && (<><StubRow label="State Income Tax" value={-taxes.maStateIncomeTax} /><StubRow label="Paid Family & Medical Leave" value={-taxes.maPFML} /></>)}
                                {employeeInfo.state === 'RI' && (<><StubRow label="State Income Tax" value={-taxes.riStateIncomeTax} /><StubRow label="Temporary Disability (TDI)" value={-taxes.riTDI} /></>)}
                                {employeeInfo.state === 'WA' && (<><StubRow label="Paid Family & Medical Leave" value={-taxes.waPFML} /></>)}
                                {currentStateTaxTotal > 0 && !['NJ', 'NY', 'IN', 'CA', 'OH', 'PA', 'MI', 'KY', 'MD', 'MA', 'RI', 'WA'].includes(employeeInfo.state) && <StubRow label="State Income Tax" value={-getStateTaxTotal(employeeInfo.state)} />}

                                <div className="border-t my-2"></div>
                                <StubRow label="Total Taxes" value={-totalTaxes} />
                            </>
                        )}
                        {deductions.postTax.length > 0 && (<><p className="text-xs font-semibold text-gray-500 mt-2">POST-TAX DEDUCTIONS</p>{deductions.postTax.map((ded, i) => <StubRow key={`post-${i}`} label={ded.name} value={-ded.amount} />)}</>)}
                        <hr className="my-2"/><StubRow label={isContractor ? 'Total Adjustments' : 'Total Deductions'} value={-totalDeductions} isBold />
                    </div>
                </div>

                <div>
                     <div className="bg-blue-50 p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Summary</h4>
                        <StubRow label="Gross Pay" value={grossPay} />
                        <StubRow label={isContractor ? 'Total Adjustments' : 'Total Deductions'} value={-totalDeductions} />
                        <div className="border-t-2 border-gray-300 my-2"></div>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800"><StubRow label={isContractor ? 'Net Payment' : 'Net Pay'} value={netPay} isBold/></div>
                    </div>
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Year-to-Date (YTD)</h4>
                        <StubRow label="Gross Earnings" value={totalEarningsYTD} /><StubRow label="Net Pay" value={netPayYTD} />
                    </div>
                    {employerContributions && employerContributions.suta > 0 && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-lg">
                            <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Employer Contributions</h4>
                            <p className="text-xs text-gray-500 italic mb-2">Note: These are amounts paid by the employer and are not deducted from your pay.</p>
                            <StubRow label="State Unemployment (SUTA)" value={employerContributions.suta} />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
});