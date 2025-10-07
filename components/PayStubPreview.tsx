

import React from 'react';
import type { PayrollFormData } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PreviewRow: React.FC<{ label: string; value: string | number; isBold?: boolean; className?: string }> = ({ label, value, isBold = false, className = '' }) => (
    <div className={`flex justify-between py-1.5 text-sm ${isBold ? 'font-bold' : ''} ${className}`}>
        <span>{label}</span>
        <span>{typeof value === 'number' ? formatCurrency(value) : value}</span>
    </div>
);

export function PayStubPreview({ data }: { data: PayrollFormData }) {

    const calculateGrossPay = (): number => {
        if (!data || data.rate <= 0) return 0;

        if (data.payType === 'hourly') {
            return data.rate * data.hoursWorked;
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
    
    const payPeriodEndDate = data.payPeriodEnd;

    // FIX: Define a union type for deductions to use in helper functions, which resolves type errors when calling `filter` and `getDeductionName` with different deduction types.
    type AnyDeduction = (typeof data.preTaxDeductions)[number] | (typeof data.postTaxDeductions)[number];

    const isDeductionActive = (ded: AnyDeduction) => {
        // If no end date is selected yet, assume all deductions are active for preview purposes.
        if (!payPeriodEndDate) return true;
        // Always active if not recurring.
        if (!ded.isRecurring) return true;
        
        // Check date range for recurring deductions
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
    
    const totalDeductions = preTaxTotal + postTaxTotal;
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
                    <PreviewRow label="Gross Pay" value={grossPay} isBold />
                    
                    <p className="text-xs font-semibold text-gray-500 pt-2">DEDUCTIONS</p>
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
                    <PreviewRow label="Taxes" value="(Calculated on submit)" className="text-gray-500 italic" />
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
                    This is an estimate. Final tax withholdings will be calculated upon submission. Inactive deductions are struck through.
                </p>
            </div>
        </div>
    );
}