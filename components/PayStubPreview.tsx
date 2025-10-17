import React, { useMemo } from 'react';
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

    const grossPay = useMemo(() => {
        let earnings = 0;
        if (data.rate > 0) {
            if (data.payType === 'hourly') {
                earnings = (data.rate * data.hoursWorked) + (data.overtimeHoursWorked * data.rate * data.overtimeRateMultiplier);
            } else { // salary
                const periods: Record<typeof data.payFrequency, number> = { 'weekly': 52, 'bi-weekly': 26, 'semi-monthly': 24, 'monthly': 12 };
                earnings = data.rate / periods[data.payFrequency];
            }
        }
        return earnings + (data.bonus || 0);
    }, [data.rate, data.hoursWorked, data.overtimeHoursWorked, data.overtimeRateMultiplier, data.bonus, data.payType, data.payFrequency]);

    const { activePreTaxDeductions, preTaxTotal, activePostTaxDeductions, postTaxTotal } = useMemo(() => {
        const payPeriodEndDate = data.payPeriodEnd;

        // FIX: Use a structural type for the function parameter to make it compatible with both
        // pre-tax and post-tax deduction objects, as it only depends on common properties.
        const isDeductionActive = (ded: { isRecurring: boolean; startDate: string; endDate: string; }) => {
            if (!ded.isRecurring || !payPeriodEndDate) return true;
            const isAfterStart = !ded.startDate || payPeriodEndDate >= ded.startDate;
            const isBeforeEnd = !ded.endDate || payPeriodEndDate <= ded.endDate;
            return isAfterStart && isBeforeEnd;
        };

        const activePreTax = data.preTaxDeductions.filter(isDeductionActive);
        const activePostTax = data.postTaxDeductions.filter(isDeductionActive);
        const preTotal = activePreTax.reduce((sum, d) => sum + (d.amount || 0), 0);
        const postTotal = activePostTax.reduce((sum, d) => sum + (d.amount || 0), 0);

        return { activePreTaxDeductions: activePreTax, preTaxTotal: preTotal, activePostTaxDeductions: activePostTax, postTaxTotal: postTotal };
    }, [data.preTaxDeductions, data.postTaxDeductions, data.payPeriodEnd]);
    
    const totalSuggestedTaxes = useMemo(() => {
        return suggestedTaxes && data.employeeType === 'employee' ? Object.values(suggestedTaxes).reduce((sum, tax) => sum + (tax || 0), 0) : 0;
    }, [suggestedTaxes, data.employeeType]);

    const netPayEstimate = grossPay - preTaxTotal - postTaxTotal - totalSuggestedTaxes;
    
    const employerSutaContribution = data.employeeType === 'employee' ? grossPay * (data.employerSutaRate / 100) : 0;
    
    // FIX: Use a union type for the parameter to allow this function to be used
    // with both pre-tax and post-tax deduction objects.
    const getDeductionName = (ded: (typeof data.preTaxDeductions)[number] | (typeof data.postTaxDeductions)[number]) => ded.type === 'Other' ? ded.customName || 'Other Deduction' : ded.type;

    return (
        <div className="sticky top-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-blue-500 h-full">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Pay Stub Preview</h3>
                <div className="space-y-2">
                    <PreviewRow label="Employee" value={data.employeeName || '...'} />
                    <hr className="my-2"/>
                    
                    {grossPay > 0 && <PreviewRow label="Gross Pay" value={grossPay} isBold className="border-t pt-1.5" />}
                    
                    {activePreTaxDeductions.length > 0 && <p className="text-xs font-semibold text-gray-500 pt-2">VOLUNTARY DEDUCTIONS</p>}
                    {activePreTaxDeductions.map((ded, i) => <PreviewRow key={`pre-${i}`} label={getDeductionName(ded)} value={-(ded.amount || 0)} />)}
                    
                    {data.employeeType === 'employee' && (
                        <>
                            <p className="text-xs font-semibold text-gray-500 pt-2">TAXES (ESTIMATED)</p>
                            {suggestedTaxes ? (
                                <>
                                    {Object.entries(suggestedTaxes).map(([key, value]) => {
                                        if (value > 0) {
                                            const name = key.replace(/([A-Z])/g, ' $1').replace('IT', 'Income Tax').replace(/nj|ny|ca|in|.../i, '').trim();
                                            return <PreviewRow key={key} label={name} value={-value} />;
                                        }
                                        return null;
                                    })}
                                    <PreviewRow label="Total Taxes" value={-totalSuggestedTaxes} className="font-semibold" />
                                </>
                            ) : <PreviewRow label="Taxes" value="(Click 'Calculate' in form)" className="text-gray-500 italic" />}
                        </>
                    )}

                    {activePostTaxDeductions.map((ded, i) => <PreviewRow key={`post-${i}`} label={getDeductionName(ded)} value={-(ded.amount || 0)} /> )}
                    
                    <hr className="my-2" />
                    <div className="bg-blue-50 p-3 rounded-md mt-4">
                        <PreviewRow label="Estimated Net Pay" value={netPayEstimate} isBold className="text-lg text-blue-800" />
                    </div>

                    {employerSutaContribution > 0 && (
                        <div className="mt-4">
                             <p className="text-xs font-semibold text-gray-500 pt-2">EMPLOYER CONTRIBUTIONS</p>
                             <PreviewRow label="State Unemployment (SUTA)" value={employerSutaContribution} />
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-6 text-center italic">
                    This is an estimate. Final calculations occur upon submission.
                </p>
            </div>
        </div>
    );
}