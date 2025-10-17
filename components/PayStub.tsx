
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import type { PayStubData } from '../types';

// Declare globals from CDN scripts for TypeScript
declare const html2canvas: any;
declare const jspdf: any;


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
    const isNJ = employeeInfo.state === 'NJ';
    const isNY = employeeInfo.state === 'NY';
    const isIN = employeeInfo.state === 'IN';
    const isCA = employeeInfo.state === 'CA';
    const isOR = employeeInfo.state === 'OR';
    const isDE = employeeInfo.state === 'DE';
    const isDC = employeeInfo.state === 'DC';
    const isAL = employeeInfo.state === 'AL';
    const isAK = employeeInfo.state === 'AK';
    const isAZ = employeeInfo.state === 'AZ';
    const isAR = employeeInfo.state === 'AR';
    const isGA = employeeInfo.state === 'GA';
    const isFL = employeeInfo.state === 'FL';
    const isTX = employeeInfo.state === 'TX';
    const isNV = employeeInfo.state === 'NV';
    const isNH = employeeInfo.state === 'NH';
    const isSD = employeeInfo.state === 'SD';
    const isTN = employeeInfo.state === 'TN';
    const isWY = employeeInfo.state === 'WY';
    const isOH = employeeInfo.state === 'OH';
    const isPA = employeeInfo.state === 'PA';
    const isMI = employeeInfo.state === 'MI';
    const isKY = employeeInfo.state === 'KY';
    const isCO = employeeInfo.state === 'CO';
    const isCT = employeeInfo.state === 'CT';
    const isHI = employeeInfo.state === 'HI';
    const isID = employeeInfo.state === 'ID';
    const isIL = employeeInfo.state === 'IL';
    const isIA = employeeInfo.state === 'IA';
    const isKS = employeeInfo.state === 'KS';
    const isLA = employeeInfo.state === 'LA';
    const isME = employeeInfo.state === 'ME';
    const isMD = employeeInfo.state === 'MD';
    const isMA = employeeInfo.state === 'MA';
    const isMN = employeeInfo.state === 'MN';
    const isMS = employeeInfo.state === 'MS';
    const isMO = employeeInfo.state === 'MO';
    const isMT = employeeInfo.state === 'MT';
    const isNE = employeeInfo.state === 'NE';
    const isNM = employeeInfo.state === 'NM';
    const isNC = employeeInfo.state === 'NC';
    const isND = employeeInfo.state === 'ND';
    const isOK = employeeInfo.state === 'OK';
    const isRI = employeeInfo.state === 'RI';
    const isSC = employeeInfo.state === 'SC';
    const isUT = employeeInfo.state === 'UT';
    const isVT = employeeInfo.state === 'VT';
    const isVA = employeeInfo.state === 'VA';
    const isWA = employeeInfo.state === 'WA';
    const isWV = employeeInfo.state === 'WV';
    const isWI = employeeInfo.state === 'WI';
    const printContainerRef = useRef<HTMLDivElement>(null);

    const { taxes } = deductions;
    const totalTaxes = !isContractor && taxes ? Object.values(taxes).reduce((sum, amount) => sum + (amount || 0), 0) : 0;
    const totalNJTaxes = isNJ && taxes ? (taxes.njStateIncomeTax + taxes.njSUI + taxes.njSDI + taxes.njFLI) : 0;
    const totalNYTaxes = isNY && taxes ? (taxes.nyStateIncomeTax + taxes.nyLocalIncomeTax + taxes.nyDisabilityInsurance + taxes.nyPaidFamilyLeave) : 0;
    const totalINTaxes = isIN && taxes ? (taxes.inStateIncomeTax + taxes.inCountyIncomeTax) : 0;
    const totalCATaxes = isCA && taxes ? (taxes.caStateIncomeTax + taxes.caSDI) : 0;
    const totalORTaxes = isOR && taxes ? taxes.orStateIncomeTax : 0;
    const totalDETaxes = isDE && taxes ? taxes.deStateIncomeTax : 0;
    const totalDCTaxes = isDC && taxes ? taxes.dcStateIncomeTax : 0;
    const totalFLTaxes = isFL && taxes ? taxes.flStateIncomeTax : 0; // Always 0
    const totalALTaxes = isAL && taxes ? taxes.alStateIncomeTax : 0;
    const totalAKTaxes = isAK && taxes ? taxes.akStateIncomeTax : 0; // Always 0
    const totalAZTaxes = isAZ && taxes ? taxes.azStateIncomeTax : 0;
    const totalARTaxes = isAR && taxes ? taxes.arStateIncomeTax : 0;
    const totalGATaxes = isGA && taxes ? taxes.gaStateIncomeTax : 0;
    const totalTXTaxes = isTX && taxes ? taxes.txStateIncomeTax : 0; // Always 0
    const totalNVTaxes = isNV && taxes ? taxes.nvStateIncomeTax : 0; // Always 0
    const totalNHTaxes = isNH && taxes ? taxes.nhStateIncomeTax : 0; // Always 0
    const totalSDTaxes = isSD && taxes ? taxes.sdStateIncomeTax : 0; // Always 0
    const totalTNTaxes = isTN && taxes ? taxes.tnStateIncomeTax : 0; // Always 0
    const totalWYTaxes = isWY && taxes ? taxes.wyStateIncomeTax : 0; // Always 0
    const totalOHTaxes = isOH && taxes ? (taxes.ohStateIncomeTax + taxes.ohLocalIncomeTax) : 0;
    const totalPATaxes = isPA && taxes ? (taxes.paStateIncomeTax + taxes.paLocalIncomeTax) : 0;
    const totalMITaxes = isMI && taxes ? (taxes.miStateIncomeTax + taxes.miLocalIncomeTax) : 0;
    const totalKYTaxes = isKY && taxes ? (taxes.kyStateIncomeTax + taxes.kyLocalIncomeTax) : 0;
    const totalCOTaxes = isCO && taxes ? taxes.coStateIncomeTax : 0;
    const totalCTTaxes = isCT && taxes ? taxes.ctStateIncomeTax : 0;
    const totalHITaxes = isHI && taxes ? taxes.hiStateIncomeTax : 0;
    const totalIDTaxes = isID && taxes ? taxes.idStateIncomeTax : 0;
    const totalILTaxes = isIL && taxes ? taxes.ilStateIncomeTax : 0;
    const totalIATaxes = isIA && taxes ? taxes.iaStateIncomeTax : 0;
    const totalKSTaxes = isKS && taxes ? taxes.ksStateIncomeTax : 0;
    const totalLATaxes = isLA && taxes ? taxes.laStateIncomeTax : 0;
    const totalMETaxes = isME && taxes ? taxes.meStateIncomeTax : 0;
    const totalMDTaxes = isMD && taxes ? (taxes.mdStateIncomeTax + taxes.mdCountyIncomeTax) : 0;
    const totalMATaxes = isMA && taxes ? (taxes.maStateIncomeTax + taxes.maPFML) : 0;
    const totalMNTaxes = isMN && taxes ? taxes.mnStateIncomeTax : 0;
    const totalMSTaxes = isMS && taxes ? taxes.msStateIncomeTax : 0;
    const totalMOTaxes = isMO && taxes ? taxes.moStateIncomeTax : 0;
    const totalMTTaxes = isMT && taxes ? taxes.mtStateIncomeTax : 0;
    const totalNETaxes = isNE && taxes ? taxes.neStateIncomeTax : 0;
    const totalNMTaxes = isNM && taxes ? taxes.nmStateIncomeTax : 0;
    const totalNCTaxes = isNC && taxes ? taxes.ncStateIncomeTax : 0;
    const totalNDTaxes = isND && taxes ? taxes.ndStateIncomeTax : 0;
    const totalOKTaxes = isOK && taxes ? taxes.okStateIncomeTax : 0;
    const totalRITaxes = isRI && taxes ? (taxes.riStateIncomeTax + taxes.riTDI) : 0;
    const totalSCTaxes = isSC && taxes ? taxes.scStateIncomeTax : 0;
    const totalUTTaxes = isUT && taxes ? taxes.utStateIncomeTax : 0;
    const totalVTTaxes = isVT && taxes ? taxes.vtStateIncomeTax : 0;
    const totalVATaxes = isVA && taxes ? taxes.vaStateIncomeTax : 0;
    const totalWATaxes = isWA && taxes ? (taxes.waStateIncomeTax + taxes.waPFML) : 0; // waStateIncomeTax is 0
    const totalWVTaxes = isWV && taxes ? taxes.wvStateIncomeTax : 0;
    const totalWITaxes = isWI && taxes ? taxes.wiStateIncomeTax : 0;


    const handlePrint = () => {
        const input = printContainerRef.current;
        if (!input) {
            console.error("Pay stub element not found for printing.");
            return;
        }

        html2canvas(input, {
            scale: 2, // Higher scale for better resolution
            useCORS: true, 
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            
            // A4 dimensions in mm: 210 x 297
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasRatio = canvasWidth / canvasHeight;

            // Fit image to page width, maintaining aspect ratio
            let finalWidth = pdfWidth;
            let finalHeight = pdfWidth / canvasRatio;

            // If the calculated height is greater than the page height, fit to height instead
            if (finalHeight > pdfHeight) {
                finalHeight = pdfHeight;
                finalWidth = pdfHeight * canvasRatio;
            }
            
            const xOffset = (pdfWidth - finalWidth) / 2;
            const yOffset = 0;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
            
            const fileName = `PayStub-${employeeInfo.name.replace(/\s/g, '_')}-${payPeriod.endDate}.pdf`;
            pdf.save(fileName);
        });
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
                </div>
                <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-bold text-gray-700 mb-2">Pay Period</h4>
                    <p>{payPeriod.startDate} - {payPeriod.endDate}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-bold text-gray-700 mb-2">Pay Date</h4>
                    <p>{payPeriod.payDate}</p>
                </div>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {/* Left Column: Earnings & Deductions */}
                <div>
                    {/* Earnings */}
                    <div className="mb-6 bg-white p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Earnings</h4>
                        {earnings.map((earning, index) => (
                             <div key={index} className="flex justify-between items-center text-sm mb-1">
                                <span>{earning.description} ({earning.hours > 0 ? `${formatCurrency(earning.rate)} x ${earning.hours} hrs` : 'Salary'})</span>
                                <span className="font-mono text-right">{formatCurrency(earning.amount)}</span>
                            </div>
                        ))}
                        <hr className="my-2"/>
                        <StubRow label="Gross Pay" value={grossPay} isBold />
                    </div>

                    {/* Deductions */}
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">{isContractor ? 'Adjustments' : 'Deductions'}</h4>
                        {deductions.preTax.length > 0 && (
                            <>
                                <p className="text-xs font-semibold text-gray-500 mt-2">PRE-TAX DEDUCTIONS</p>
                                {deductions.preTax.map((ded, i) => <StubRow key={`pre-${i}`} label={ded.name} value={-ded.amount} />)}
                            </>
                        )}
                        {!isContractor && totalTaxes > 0 && (
                             <>
                                <p className="text-xs font-semibold text-gray-500 mt-2">FEDERAL TAXES</p>
                                <StubRow label="Federal Income Tax" value={-taxes.federalIncomeTax} />
                                <StubRow label="Social Security" value={-taxes.socialSecurity} />
                                <StubRow label="Medicare" value={-taxes.medicare} />
                                
                                {isNJ && totalNJTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">NEW JERSEY TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.njStateIncomeTax} />
                                        <StubRow label="State Unemployment (SUI)" value={-taxes.njSUI} />
                                        <StubRow label="State Disability (SDI)" value={-taxes.njSDI} />
                                        <StubRow label="Family Leave (FLI)" value={-taxes.njFLI} />
                                    </>
                                )}

                                {isNY && totalNYTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">NEW YORK TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.nyStateIncomeTax} />
                                        <StubRow label="Local Income Tax" value={-taxes.nyLocalIncomeTax} />
                                        <StubRow label="State Disability (NYSDI)" value={-taxes.nyDisabilityInsurance} />
                                        <StubRow label="Paid Family Leave (NYPFL)" value={-taxes.nyPaidFamilyLeave} />
                                    </>
                                )}
                                
                                {isIN && totalINTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">INDIANA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.inStateIncomeTax} />
                                        <StubRow label="County Income Tax" value={-taxes.inCountyIncomeTax} />
                                    </>
                                )}

                                {isCA && totalCATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">CALIFORNIA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.caStateIncomeTax} />
                                        <StubRow label="State Disability (SDI)" value={-taxes.caSDI} />
                                    </>
                                )}

                                {isOR && totalORTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">OREGON TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.orStateIncomeTax} />
                                    </>
                                )}

                                {isDE && totalDETaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">DELAWARE TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.deStateIncomeTax} />
                                    </>
                                )}

                                {isDC && totalDCTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">DISTRICT OF COLUMBIA TAXES</p>
                                        <StubRow label="DC Income Tax" value={-taxes.dcStateIncomeTax} />
                                    </>
                                )}

                                {isFL && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">FLORIDA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.flStateIncomeTax} />
                                    </>
                                )}
                                
                                {isAL && totalALTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">ALABAMA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.alStateIncomeTax} />
                                    </>
                                )}

                                {isAK && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">ALASKA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.akStateIncomeTax} />
                                    </>
                                )}

                                {isAZ && totalAZTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">ARIZONA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.azStateIncomeTax} />
                                    </>
                                )}

                                {isAR && totalARTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">ARKANSAS TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.arStateIncomeTax} />
                                    </>
                                )}
                                
                                {isGA && totalGATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">GEORGIA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.gaStateIncomeTax} />
                                    </>
                                )}
                                
                                {isTX && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">TEXAS TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.txStateIncomeTax} />
                                    </>
                                )}
                                
                                {isNV && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">NEVADA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.nvStateIncomeTax} />
                                    </>
                                )}

                                {isNH && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">NEW HAMPSHIRE TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.nhStateIncomeTax} />
                                    </>
                                )}

                                {isSD && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">SOUTH DAKOTA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.sdStateIncomeTax} />
                                    </>
                                )}

                                {isTN && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">TENNESSEE TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.tnStateIncomeTax} />
                                    </>
                                )}
                                
                                {isWY && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">WYOMING TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.wyStateIncomeTax} />
                                    </>
                                )}

                                {isOH && totalOHTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">OHIO TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.ohStateIncomeTax} />
                                        <StubRow label="Local Income Tax" value={-taxes.ohLocalIncomeTax} />
                                    </>
                                )}

                                {isPA && totalPATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">PENNSYLVANIA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.paStateIncomeTax} />
                                        <StubRow label="Local Taxes (EIT/LST)" value={-taxes.paLocalIncomeTax} />
                                    </>
                                )}

                                {isMI && totalMITaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">MICHIGAN TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.miStateIncomeTax} />
                                        <StubRow label="City Income Tax" value={-taxes.miLocalIncomeTax} />
                                    </>
                                )}

                                {isKY && totalKYTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">KENTUCKY TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.kyStateIncomeTax} />
                                        <StubRow label="Local Occ. Tax" value={-taxes.kyLocalIncomeTax} />
                                    </>
                                )}
                                
                                {isCO && totalCOTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">COLORADO TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.coStateIncomeTax} />
                                    </>
                                )}
                                
                                {isCT && totalCTTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">CONNECTICUT TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.ctStateIncomeTax} />
                                    </>
                                )}

                                {isHI && totalHITaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">HAWAII TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.hiStateIncomeTax} />
                                    </>
                                )}

                                {isID && totalIDTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">IDAHO TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.idStateIncomeTax} />
                                    </>
                                )}

                                {isIL && totalILTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">ILLINOIS TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.ilStateIncomeTax} />
                                    </>
                                )}

                                {isIA && totalIATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">IOWA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.iaStateIncomeTax} />
                                    </>
                                )}

                                {isKS && totalKSTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">KANSAS TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.ksStateIncomeTax} />
                                    </>
                                )}

                                {isLA && totalLATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">LOUISIANA TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.laStateIncomeTax} />
                                    </>
                                )}

                                {isME && totalMETaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">MAINE TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.meStateIncomeTax} />
                                    </>
                                )}
                                
                                {isMD && totalMDTaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">MARYLAND TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.mdStateIncomeTax} />
                                        <StubRow label="County Income Tax" value={-taxes.mdCountyIncomeTax} />
                                    </>
                                )}

                                {isMA && totalMATaxes > 0 && (
                                    <>
                                        <p className="text-xs font-semibold text-gray-500 mt-2">MASSACHUSETTS TAXES</p>
                                        <StubRow label="State Income Tax" value={-taxes.maStateIncomeTax} />
                                        <StubRow label="Paid Family & Medical Leave" value={-taxes.maPFML} />
                                    </>
                                )}
                                
                                {isMN && totalMNTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">MINNESOTA TAXES</p> <StubRow label="State Income Tax" value={-taxes.mnStateIncomeTax} /> </> )}
                                {isMS && totalMSTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">MISSISSIPPI TAXES</p> <StubRow label="State Income Tax" value={-taxes.msStateIncomeTax} /> </> )}
                                {isMO && totalMOTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">MISSOURI TAXES</p> <StubRow label="State Income Tax" value={-taxes.moStateIncomeTax} /> </> )}
                                {isMT && totalMTTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">MONTANA TAXES</p> <StubRow label="State Income Tax" value={-taxes.mtStateIncomeTax} /> </> )}
                                {isNE && totalNETaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">NEBRASKA TAXES</p> <StubRow label="State Income Tax" value={-taxes.neStateIncomeTax} /> </> )}
                                {isNM && totalNMTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">NEW MEXICO TAXES</p> <StubRow label="State Income Tax" value={-taxes.nmStateIncomeTax} /> </> )}
                                {isNC && totalNCTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">NORTH CAROLINA TAXES</p> <StubRow label="State Income Tax" value={-taxes.ncStateIncomeTax} /> </> )}
                                {isND && totalNDTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">NORTH DAKOTA TAXES</p> <StubRow label="State Income Tax" value={-taxes.ndStateIncomeTax} /> </> )}
                                {isOK && totalOKTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">OKLAHOMA TAXES</p> <StubRow label="State Income Tax" value={-taxes.okStateIncomeTax} /> </> )}
                                {isRI && totalRITaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">RHODE ISLAND TAXES</p> <StubRow label="State Income Tax" value={-taxes.riStateIncomeTax} /> <StubRow label="Temporary Disability (TDI)" value={-taxes.riTDI} /> </> )}
                                {isSC && totalSCTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">SOUTH CAROLINA TAXES</p> <StubRow label="State Income Tax" value={-taxes.scStateIncomeTax} /> </> )}
                                {isUT && totalUTTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">UTAH TAXES</p> <StubRow label="State Income Tax" value={-taxes.utStateIncomeTax} /> </> )}
                                {isVT && totalVTTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">VERMONT TAXES</p> <StubRow label="State Income Tax" value={-taxes.vtStateIncomeTax} /> </> )}
                                {isVA && totalVATaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">VIRGINIA TAXES</p> <StubRow label="State Income Tax" value={-taxes.vaStateIncomeTax} /> </> )}
                                {isWA && totalWATaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">WASHINGTON TAXES</p> <StubRow label="Paid Family & Medical Leave" value={-taxes.waPFML} /> </> )}
                                {isWV && totalWVTaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">WEST VIRGINIA TAXES</p> <StubRow label="State Income Tax" value={-taxes.wvStateIncomeTax} /> </> )}
                                {isWI && totalWITaxes > 0 && ( <> <p className="text-xs font-semibold text-gray-500 mt-2">WISCONSIN TAXES</p> <StubRow label="State Income Tax" value={-taxes.wiStateIncomeTax} /> </> )}

                                <div className="border-t my-2"></div>
                                <StubRow label="Total Taxes" value={-totalTaxes} />

                            </>
                        )}
                        {deductions.postTax.length > 0 && (
                             <>
                                <p className="text-xs font-semibold text-gray-500 mt-2">POST-TAX DEDUCTIONS</p>
                                {deductions.postTax.map((ded, i) => <StubRow key={`post-${i}`} label={ded.name} value={-ded.amount} />)}
                            </>
                        )}
                        <hr className="my-2"/>
                        <StubRow label={isContractor ? 'Total Adjustments' : 'Total Deductions'} value={-totalDeductions} isBold />
                    </div>
                </div>

                {/* Right Column: Summary & YTD */}
                <div>
                     <div className="bg-blue-50 p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Summary</h4>
                        <StubRow label="Gross Pay" value={grossPay} />
                        <StubRow label={isContractor ? 'Total Adjustments' : 'Total Deductions'} value={-totalDeductions} />
                        <div className="border-t-2 border-gray-300 my-2"></div>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800">
                             <StubRow label={isContractor ? 'Net Payment' : 'Net Pay'} value={netPay} isBold/>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2">Year-to-Date (YTD)</h4>
                        <StubRow label="Gross Earnings" value={totalEarningsYTD} />
                        <StubRow label="Net Pay" value={netPayYTD} />
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
