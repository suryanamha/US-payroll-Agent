

import React from 'react';
import type { PayrollFormData, Taxes } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PreviewRow: React.FC<{ label: string; value: string | number; isBold?: boolean; className?: string }> = ({ label, value, isBold = false, className = '' }) => (
    <div className={`flex justify-between py-1.5 text-sm ${isBold ? 'font-bold' : ''} ${className}`}>
        <span>{label}</span>
        <span>{typeof value === 'number' ? formatCurrency(value) : value}</span>
    </div>
);

export function PayStubPreview({ data, suggestedTaxes }: { data: PayrollFormData, suggestedTaxes: Taxes | null }) {

    const calculateGrossPay = (): number => {
        if (!data || data.rate <= 0) return 0;

        if (data.payType === 'hourly') {
             const regularPay = data.rate * data.hoursWorked;
            const overtimePay = data.overtimeHoursWorked * data.rate * data.overtimeRateMultiplier;
            return regularPay + overtimePay;
        }

        if (data.payType === 'salary') {
            switch (data.payFrequency) {
                case 'weekly': return data.rate / 52;
                case 'bi-weekly': return data.rate / 26;
                case 'semi-monthly': return data.rate / 24;
                case 'monthly': return data.rate / 12;
                default: return 0;
            }
        }
        return 0;
    };

    const grossPay = calculateGrossPay();
    const regularPay = data.payType === 'hourly' ? data.rate * data.hoursWorked : 0;
    const overtimePay = data.payType === 'hourly' && data.overtimeRateMultiplier >= 1 ? data.overtimeHoursWorked * data.rate * data.overtimeRateMultiplier : 0;
    
    const payPeriodEndDate = data.payPeriodEnd;

    type AnyDeduction = (typeof data.preTaxDeductions)[number] | (typeof data.postTaxDeductions)[number];

    const isDeductionActive = (ded: AnyDeduction) => {
        if (!payPeriodEndDate) return true;
        if (!ded.isRecurring) return true;
        
        const startDate = ded.startDate;
        const endDate = ded.endDate;
        const isAfterStart = !startDate || payPeriodEndDate >= startDate;
        const isBeforeEnd = !endDate || payPeriodEndDate <= endDate;
        
        return isAfterStart && isBeforeEnd;
    };

    const activePreTaxDeductions = data.preTaxDeductions.filter(isDeductionActive);
    const activePostTaxDeductions = data.postTaxDeductions.filter(isDeductionActive);

    const preTaxTotal = activePreTaxDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const postTaxTotal = activePostTaxDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalSuggestedTaxes = suggestedTaxes && data.employeeType === 'employee' ? Object.values(suggestedTaxes).reduce((sum, tax) => sum + (tax || 0), 0) : 0;

    const totalDeductions = preTaxTotal + postTaxTotal + totalSuggestedTaxes;
    const netPayEstimate = grossPay - totalDeductions;
    const employerSutaContribution = data.employeeType === 'employee' ? grossPay * (data.employerSutaRate / 100) : 0;

    const getDeductionName = (ded: AnyDeduction) => {
        if (ded.type === 'Other') {
            return ded.customName || 'Other Deduction';
        }
        return ded.type;
    };


    return (
        <div className="sticky top-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-blue-500 h-full">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Pay Stub Preview</h3>
                
                <div className="space-y-2">
                    <PreviewRow label="Employee" value={data.employeeName || '...'} />
                    <hr className="my-2"/>
                    
                    {data.payType === 'hourly' && grossPay > 0 ? (
                        <>
                            <PreviewRow label="Regular Pay" value={regularPay} />
                            {overtimePay > 0 && <PreviewRow label="Overtime Pay" value={overtimePay} />}
                            <PreviewRow label="Gross Pay" value={grossPay} isBold className="border-t pt-1.5" />
                        </>
                    ) : (
                        <PreviewRow label="Gross Pay" value={grossPay} isBold />
                    )}

                    <p className="text-xs font-semibold text-gray-500 pt-2">VOLUNTARY DEDUCTIONS</p>
                    {data.preTaxDeductions.map((ded, i) => {
                        const isActive = isDeductionActive(ded);
                        return (
                             <PreviewRow 
                                key={`pre-${i}`} 
                                label={getDeductionName(ded)} 
                                value={-(ded.amount || 0)} 
                                className={!isActive ? 'text-gray-400 line-through' : ''}
                             />
                        );
                    })}
                    
                    {data.employeeType === 'employee' && (
                        <>
                            <p className="text-xs font-semibold text-gray-500 pt-2">TAXES (ESTIMATED)</p>
                            {suggestedTaxes ? (
                                <>
                                    {suggestedTaxes.federalIncomeTax > 0 && <PreviewRow label="Federal Income Tax" value={-suggestedTaxes.federalIncomeTax} />}
                                    {suggestedTaxes.socialSecurity > 0 && <PreviewRow label="Social Security" value={-suggestedTaxes.socialSecurity} />}
                                    {suggestedTaxes.medicare > 0 && <PreviewRow label="Medicare" value={-suggestedTaxes.medicare} />}
                                    {Object.entries(suggestedTaxes).map(([key, value]) => {
                                        if (value > 0 && key.toLowerCase().includes(data.state.toLowerCase())) {
                                            const name = key.replace(/([A-Z])/g, ' $1').replace('Income Tax', 'IT').replace('State', '').trim()
                                            return <PreviewRow key={key} label={name} value={-value} />
                                        }
                                        return null;
                                    })}
                                    <PreviewRow label="Total Taxes" value={-totalSuggestedTaxes} className="font-semibold" />
                                </>
                            ) : (
                                <PreviewRow label="Taxes" value="(Click 'Calculate' in form)" className="text-gray-500 italic" />
                            )}
                        </>
                    )}

                    {data.postTaxDeductions.map((ded, i) => {
                        const isActive = isDeductionActive(ded);
                        return (
                             <PreviewRow 
                                key={`post-${i}`} 
                                label={getDeductionName(ded)}
                                value={-(ded.amount || 0)} 
                                className={!isActive ? 'text-gray-400 line-through' : ''}
                             />
                        );
                    })}
                    
                    <hr className="my-2" />

                    <div className="bg-blue-50 p-3 rounded-md mt-4">
                        <PreviewRow label="Estimated Net Pay" value={netPayEstimate} isBold className="text-lg text-blue-800" />
                    </div>

                    {data.employeeType === 'employee' && employerSutaContribution > 0 && (
                        <div className="mt-4">
                             <p className="text-xs font-semibold text-gray-500 pt-2">EMPLOYER CONTRIBUTIONS</p>
                             <PreviewRow label="State Unemployment (SUTA)" value={employerSutaContribution} />
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center italic">
                    This is an estimate. Final calculations occur upon submission. Inactive deductions are struck through.
                </p>
            </div>
        </div>
    );
}
