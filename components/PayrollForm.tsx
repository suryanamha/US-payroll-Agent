import React, { useState, useEffect } from 'react';
import type { PayrollFormData } from '../types';

interface PayrollFormProps {
  onSubmit: (data: PayrollFormData) => void;
}

const initialFormData: PayrollFormData = {
    employeeName: '',
    employeeType: 'employee',
    state: 'NJ',
    payPeriodStart: '',
    payPeriodEnd: '',
    payType: 'hourly',
    rate: 0,
    hoursWorked: 40,
    federalFilingStatus: 'single',
    stateFilingStatus: 'B',
    nyStateFilingStatus: 'single',
    caStateFilingStatus: 'single',
    federalAllowances: 1,
    stateAllowances: 1,
    nyStateAllowances: 1,
    caStateAllowances: 1,
    njExemptSuiSdi: false,
    njExemptFli: false,
    nyPflWaiver: false,
    preTaxDeductions: [],
    postTaxDeductions: [],
    grossPayYTD: 0,
    totalDeductionsYTD: 0,
    netPayYTD: 0,
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <fieldset className="mb-6 border border-gray-200 p-4 rounded-lg">
        <legend className="text-lg font-bold text-gray-700 px-2">{title}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">
            {children}
        </div>
    </fieldset>
);


const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, error?: string }> = ({ label, error, ...props }) => (
    <div className="w-full">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`} />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
     <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select {...props} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
            {children}
        </select>
    </div>
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input {...props} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed" />
        <label htmlFor={props.id} className="ml-3 block text-sm font-medium text-gray-700">{label}</label>
    </div>
);


export function PayrollForm({ onSubmit }: PayrollFormProps) {
    const [formData, setFormData] = useState<PayrollFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (data: PayrollFormData) => {
        const newErrors: Record<string, string> = {};
        if (!data.employeeName) newErrors.employeeName = "Name is required.";
        if (!data.payPeriodStart) newErrors.payPeriodStart = "Start date is required.";
        if (!data.payPeriodEnd) newErrors.payPeriodEnd = "End date is required.";

        if (data.payType === 'hourly') {
            if (data.rate <= 0) newErrors.rate = "Hourly rate must be greater than zero.";
            if (data.hoursWorked <= 0) newErrors.hoursWorked = "Hours worked must be greater than zero.";
        } else { // salary
            if (data.rate <= 0) newErrors.rate = "Annual salary must be greater than zero.";
        }
        
        if (data.grossPayYTD < 0) newErrors.grossPayYTD = "YTD Gross Pay cannot be negative.";
        if (data.totalDeductionsYTD < 0) newErrors.totalDeductionsYTD = "YTD Deductions cannot be negative.";
        if (data.netPayYTD < 0) newErrors.netPayYTD = "YTD Net Pay cannot be negative.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Re-validate on change
    useEffect(() => {
        validate(formData);
    }, [formData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        setFormData(prev => {
            const isCheckbox = type === 'checkbox';
            const isNumeric = type === 'number';

            let finalValue: string | number | boolean;
            if (isCheckbox) {
                finalValue = target.checked;
            } else if (isNumeric) {
                let numericValue = parseFloat(value);
                if (isNaN(numericValue)) numericValue = 0;
                finalValue = numericValue;
            } else {
                finalValue = value;
            }
            
            const newFormData = { ...prev, [name]: finalValue };

            if (name === 'employeeType' && value === 'contractor') {
                newFormData.federalFilingStatus = 'single';
                newFormData.stateFilingStatus = 'B';
                newFormData.nyStateFilingStatus = 'single';
                newFormData.federalAllowances = 0;
                newFormData.stateAllowances = 0;
                newFormData.nyStateAllowances = 0;
                newFormData.njExemptSuiSdi = false;
                newFormData.njExemptFli = false;
                newFormData.nyPflWaiver = false;
            }
             if (name === 'payType') {
                newFormData.rate = 0;
                newFormData.hoursWorked = value === 'hourly' ? 40 : 0;
            }
             if (name === 'state') {
                // Reset state-specific fields when changing state
                newFormData.stateFilingStatus = 'B'; 
                newFormData.stateAllowances = 0;
                newFormData.nyStateFilingStatus = 'single';
                newFormData.nyStateAllowances = 0;
                newFormData.caStateFilingStatus = 'single';
                newFormData.caStateAllowances = 0;
                newFormData.njExemptSuiSdi = false;
                newFormData.njExemptFli = false;
                newFormData.nyPflWaiver = false;
            }
            return newFormData;
        });
    };
    
    const handleDeductionChange = (index: number, field: string, value: string | number, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        const updatedDeductions = [...formData[type]];
        updatedDeductions[index] = { ...updatedDeductions[index], [field]: value };
        setFormData(prev => ({ ...prev, [type]: updatedDeductions }));
    };

    const addDeduction = (type: 'preTaxDeductions' | 'postTaxDeductions') => {
        setFormData(prev => ({...prev, [type]: [...prev[type], { name: '', amount: 0 }]}));
    };
    
    const removeDeduction = (index: number, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        const updatedDeductions = formData[type].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [type]: updatedDeductions }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate(formData)) {
            onSubmit(formData);
        }
    };
    
    const isContractor = formData.employeeType === 'contractor';
    const isFormValid = Object.keys(errors).length === 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            
            <Section title="Worker Information">
                <Input label={isContractor ? 'Contractor Full Name' : 'Employee Full Name'} id="employeeName" name="employeeName" type="text" value={formData.employeeName} onChange={handleChange} required error={errors.employeeName} />
                <Select label="Worker Type" id="employeeType" name="employeeType" value={formData.employeeType} onChange={handleChange}>
                    <option value="employee">Employee (W-2)</option>
                    <option value="contractor">Contractor (1099)</option>
                </Select>
                 <Select label="State" id="state" name="state" value={formData.state} onChange={handleChange}>
                    <option value="NJ">New Jersey</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                </Select>
            </Section>

            <Section title="Pay Period & Earnings">
                <Input label="Pay Period Start Date" id="payPeriodStart" name="payPeriodStart" type="date" value={formData.payPeriodStart} onChange={handleChange} required error={errors.payPeriodStart} />
                <Input label="Pay Period End Date" id="payPeriodEnd" name="payPeriodEnd" type="date" value={formData.payPeriodEnd} onChange={handleChange} required error={errors.payPeriodEnd} />
                <Select label="Pay Type" id="payType" name="payType" value={formData.payType} onChange={handleChange}>
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                </Select>
                {formData.payType === 'hourly' ? (
                     <>
                        <Input label="Hourly Rate ($)" id="rate" name="rate" type="number" min="0" step="0.01" value={formData.rate} onChange={handleChange} required error={errors.rate} />
                        <Input label="Hours Worked" id="hoursWorked" name="hoursWorked" type="number" min="0" step="0.1" value={formData.hoursWorked} onChange={handleChange} required error={errors.hoursWorked}/>
                     </>
                ) : (
                    <Input label="Annual Salary ($)" id="rate" name="rate" type="number" min="0" step="100" value={formData.rate} onChange={handleChange} required error={errors.rate}/>
                )}
            </Section>

            <Section title="Tax Withholding">
                <Select label="Federal Filing Status" id="federalFilingStatus" name="federalFilingStatus" value={formData.federalFilingStatus} onChange={handleChange} disabled={isContractor}>
                    <option value="single">Single</option>
                    <option value="married_jointly">Married Filing Jointly</option>
                    <option value="married_separately">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                </Select>
                <Input label="Federal Allowances" id="federalAllowances" name="federalAllowances" type="number" min="0" value={formData.federalAllowances} onChange={handleChange} disabled={isContractor} />
                {formData.state === 'NJ' && (
                  <>
                    <Select label="NJ State Filing Status" id="stateFilingStatus" name="stateFilingStatus" value={formData.stateFilingStatus} onChange={handleChange} disabled={isContractor}>
                        <option value="A">A (Single)</option>
                        <option value="B">B (Married/Civil Union, Separate)</option>
                        <option value="C">C (Married/Civil Union, Joint)</option>
                        <option value="D">D (Head of Household)</option>
                        <option value="E">E (Surviving Spouse/Civil Union)</option>
                    </Select>
                    <Input label="NJ State Allowances" id="stateAllowances" name="stateAllowances" type="number" min="0" value={formData.stateAllowances} onChange={handleChange} disabled={isContractor} />
                    <div className="md:col-span-2 space-y-3 pt-2">
                        <h4 className="font-semibold text-gray-600 text-sm">NJ Tax Exemptions</h4>
                        <Checkbox label="Exempt from SUI/SDI (e.g., family employment)" id="njExemptSuiSdi" name="njExemptSuiSdi" checked={formData.njExemptSuiSdi} onChange={handleChange} disabled={isContractor} />
                        <Checkbox label="Exempt from Family Leave Insurance (FLI)" id="njExemptFli" name="njExemptFli" checked={formData.njExemptFli} onChange={handleChange} disabled={isContractor} />
                    </div>
                  </>
                )}
                 {formData.state === 'NY' && (
                  <>
                    <Select label="NY State Filing Status" id="nyStateFilingStatus" name="nyStateFilingStatus" value={formData.nyStateFilingStatus} onChange={handleChange} disabled={isContractor}>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="head_of_household">Head of Household</option>
                    </Select>
                    <Input label="NY State Allowances" id="nyStateAllowances" name="nyStateAllowances" type="number" min="0" value={formData.nyStateAllowances} onChange={handleChange} disabled={isContractor} />
                    <div className="md:col-span-2 space-y-3 pt-2">
                        <h4 className="font-semibold text-gray-600 text-sm">NY Tax Waivers</h4>
                        <Checkbox label="Employee has a waiver for Paid Family Leave (PFL)" id="nyPflWaiver" name="nyPflWaiver" checked={formData.nyPflWaiver} onChange={handleChange} disabled={isContractor} />
                    </div>
                  </>
                )}
                 {formData.state === 'CA' && (
                  <>
                    <Select label="CA State Filing Status" id="caStateFilingStatus" name="caStateFilingStatus" value={formData.caStateFilingStatus} onChange={handleChange} disabled={isContractor}>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="head_of_household">Head of Household</option>
                    </Select>
                    <Input label="CA State Allowances" id="caStateAllowances" name="caStateAllowances" type="number" min="0" value={formData.caStateAllowances} onChange={handleChange} disabled={isContractor} />
                  </>
                )}
            </Section>

            <Section title="Year-to-Date Summary (Optional)">
                <Input label="Gross Pay YTD ($)" id="grossPayYTD" name="grossPayYTD" type="number" min="0" step="0.01" value={formData.grossPayYTD} onChange={handleChange} error={errors.grossPayYTD} />
                <Input label="Total Deductions YTD ($)" id="totalDeductionsYTD" name="totalDeductionsYTD" type="number" min="0" step="0.01" value={formData.totalDeductionsYTD} onChange={handleChange} error={errors.totalDeductionsYTD} />
                <Input label="Net Pay YTD ($)" id="netPayYTD" name="netPayYTD" type="number" min="0" step="0.01" value={formData.netPayYTD} onChange={handleChange} error={errors.netPayYTD} />
            </Section>

            <Section title="Deductions">
                <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold text-gray-600">Pre-Tax Deductions (e.g., 401k, Health Insurance)</h4>
                    {formData.preTaxDeductions.map((ded, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input type="text" placeholder="Deduction Name" value={ded.name} onChange={e => handleDeductionChange(i, 'name', e.target.value, 'preTaxDeductions')} className="flex-grow form-input rounded-md border-gray-300 shadow-sm" />
                            <input type="number" placeholder="Amount ($)" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'preTaxDeductions')} className="w-32 form-input rounded-md border-gray-300 shadow-sm" />
                            <button type="button" onClick={() => removeDeduction(i, 'preTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addDeduction('preTaxDeductions')} className="text-sm text-blue-600 hover:text-blue-800">+ Add Pre-Tax Deduction</button>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold text-gray-600">Post-Tax Deductions (e.g., Garnishments, Roth IRA)</h4>
                    {formData.postTaxDeductions.map((ded, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input type="text" placeholder="Deduction Name" value={ded.name} onChange={e => handleDeductionChange(i, 'name', e.target.value, 'postTaxDeductions')} className="flex-grow form-input rounded-md border-gray-300 shadow-sm" />
                            <input type="number" placeholder="Amount ($)" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'postTaxDeductions')} className="w-32 form-input rounded-md border-gray-300 shadow-sm" />
                            <button type="button" onClick={() => removeDeduction(i, 'postTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addDeduction('postTaxDeductions')} className="text-sm text-blue-600 hover:text-blue-800">+ Add Post-Tax Deduction</button>
                </div>
            </Section>


            <div className="pt-5">
                <button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Generate Pay Stub
                </button>
                {!isFormValid && <p className="text-center mt-2 text-sm text-red-600">Please fix the errors before submitting.</p>}
            </div>
        </form>
    );
}
