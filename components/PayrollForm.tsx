

import React, { useState, useEffect } from 'react';
import type { PayrollFormData, PreTaxDeductionType, PostTaxDeductionType, Taxes } from '../types';
import { calculateTaxesOnly } from '../services/geminiService';
import { INDIANA_COUNTY_TAX_RATES } from '../data/IndianaCountyTaxRates';


interface PayrollFormProps {
  data: PayrollFormData;
  onDataChange: (data: PayrollFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  suggestedTaxes: Taxes | null;
  onSuggestionsChange: (taxes: Taxes | null) => void;
}

const SUPPORTED_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'IN', label: 'Indiana' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'MI', label: 'Michigan' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NY', label: 'New York' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'WY', label: 'Wyoming' },
];

const PRE_TAX_DEDUCTION_TYPES: PreTaxDeductionType[] = ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) / 403(b)', 'HSA Contribution', 'FSA Contribution', 'Other'];
const POST_TAX_DEDUCTION_TYPES: PostTaxDeductionType[] = ['Garnishment', 'Roth IRA', 'Union Dues', 'Charitable Donation', 'Other'];

const indianaCountyOptions = [{ value: '', label: 'Select a county' }].concat(
    Object.keys(INDIANA_COUNTY_TAX_RATES)
        .sort()
        .map(county => ({
            value: county,
            label: county.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }))
);

export const initialFormData: PayrollFormData = {
    employeeName: '',
    employeeType: 'employee',
    state: 'AL',
    payPeriodStart: '',
    payPeriodEnd: '',
    payFrequency: 'bi-weekly',
    payType: 'hourly',
    rate: 0,
    hoursWorked: 40,
    overtimeHoursWorked: 0,
    overtimeRateMultiplier: 1.5,
    bonus: 0,
    federalFilingStatus: 'single',
    federalAllowances: 1,
    // NJ
    stateFilingStatus: 'B',
    stateAllowances: 1,
    njExemptSuiSdi: false,
    njExemptFli: false,
    njExemptStateTax: false,
    // NY
    nyStateFilingStatus: 'single',
    nyStateAllowances: 1,
    nyAdditionalWithholding: 0,
    nyWorkCity: 'none',
    nyPflWaiver: false,
    nyExemptStateTax: false,
    nyExemptSdi: false,
    // IN
    inCountyOfResidence: '',
    inCountyOfWork: '',
    inStateExemptions: 1,
    inDependentExemptions: 0,
    inExemptStateTax: false,
    inExemptCountyTax: false,
    // CA
    caFilingStatus: 'single_or_married_one_income',
    caAllowances: 1,
    caEstimatedDeductions: 0,
    caEstimatedNonWageIncome: 0,
    caAdditionalWithholding: 0,
    caExemptStateTax: false,
    caExemptSdi: false,
    // OR
    orFilingStatus: 'single',
    orAllowances: 1,
    orAdditionalWithholding: 0,
    orExempt: false,
    // DE
    deFilingStatus: 'single',
    deAllowances: 1,
    deExemptStateTax: false,
    // DC
    dcFilingStatus: 'single_head_of_household',
    dcAllowances: 1,
    dcExemptStateTax: false,
    // AL
    alFilingStatus: 'single',
    alDependents: 0,
    alExemptStateTax: false,
    // AZ
    azWithholdingRate: 2.0,
    azExemptStateTax: false,
    // AR
    arAllowances: 1,
    arExemptStateTax: false,
    // GA
    gaFilingStatus: 'single',
    gaDependentAllowances: 0,
    gaAdditionalAllowances: 0,
    gaAdditionalWithholding: 0,
    gaExemptStateTax: false,
    // OH
    ohAllowances: 1,
    ohAdditionalWithholding: 0,
    ohExemptStateTax: false,
    ohMunicipality: '',
    // PA
    paExemptStateTax: false,
    paResidencyPsdCode: '',
    paWorkplacePsdCode: '',
    paIsExemptLST: false,
    // MI
    miAllowances: 1,
    miAdditionalWithholding: 0,
    miExemptStateTax: false,
    miCityOfResidence: '',
    // KY
    kyAllowances: 1,
    kyAdditionalWithholding: 0,
    kyExemptStateTax: false,
    kyWorkLocation: '',
    // Common
    preTaxDeductions: [
        { type: 'Health Insurance', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' },
        { type: '401(k) / 403(b)', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }
    ],
    postTaxDeductions: [
        { type: 'Garnishment', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }
    ],
    grossPayYTD: 0,
    totalDeductionsYTD: 0,
    netPayYTD: 0,
    employerSutaRate: 0,
};

const Section: React.FC<{ title: string; children: React.ReactNode; info?: string }> = ({ title, children, info }) => (
    <fieldset className="mb-6 border border-gray-200 p-4 rounded-lg">
        <legend className="text-lg font-bold text-gray-700 px-2 flex items-center gap-2">
            <span>{title}</span>
            {info && (
                <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full mb-2 w-72 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 left-1/2 -translate-x-1/2">
                        {info}
                        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            )}
        </legend>
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

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, error?: string }> = ({ label, error, children, ...props }) => (
     <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select {...props} className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}>
            {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input {...props} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed" />
        <label htmlFor={props.id} className="ml-3 block text-sm font-medium text-gray-700">{label}</label>
    </div>
);


export function PayrollForm({ data, onDataChange, onSubmit, suggestedTaxes, onSuggestionsChange }: PayrollFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const validate = (formData: PayrollFormData) => {
        const newErrors: Record<string, string> = {};
        if (!formData.employeeName) newErrors.employeeName = "Name is required.";
        if (!formData.payPeriodStart) newErrors.payPeriodStart = "Start date is required.";
        if (!formData.payPeriodEnd) newErrors.payPeriodEnd = "End date is required.";
        
        if (formData.state === 'IN') {
            if (!formData.inCountyOfResidence) newErrors.inCountyOfResidence = "County of residence is required for Indiana.";
            if (!formData.inCountyOfWork) newErrors.inCountyOfWork = "County of work is required for Indiana.";
            if (formData.inStateExemptions < 0) newErrors.inStateExemptions = "Personal exemptions cannot be negative.";
            if (formData.inDependentExemptions < 0) newErrors.inDependentExemptions = "Dependent exemptions cannot be negative.";
        }
        
        if (formData.state === 'NY') {
            if (formData.nyAdditionalWithholding < 0) newErrors.nyAdditionalWithholding = "Cannot be negative.";
        }
        if (formData.state === 'CA') {
            if (formData.caEstimatedDeductions < 0) newErrors.caEstimatedDeductions = "Cannot be negative.";
            if (formData.caEstimatedNonWageIncome < 0) newErrors.caEstimatedNonWageIncome = "Cannot be negative.";
        }


        if (formData.payType === 'hourly') {
            if (formData.rate <= 0) newErrors.rate = "Hourly rate must be greater than zero.";
            if (formData.hoursWorked <= 0) newErrors.hoursWorked = "Regular hours must be greater than zero.";
            if (formData.overtimeHoursWorked < 0) newErrors.overtimeHoursWorked = "Overtime hours cannot be negative.";
            if (formData.overtimeRateMultiplier < 1) newErrors.overtimeRateMultiplier = "Multiplier must be at least 1.";
        } else { // salary
            if (formData.rate <= 0) newErrors.rate = "Annual salary must be greater than zero.";
        }
        
        if (formData.bonus < 0) newErrors.bonus = "Bonus cannot be negative.";
        if (formData.grossPayYTD < 0) newErrors.grossPayYTD = "YTD Gross Pay cannot be negative.";
        if (formData.totalDeductionsYTD < 0) newErrors.totalDeductionsYTD = "YTD Deductions cannot be negative.";
        if (formData.netPayYTD < 0) newErrors.netPayYTD = "YTD Net Pay cannot be negative.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Re-validate on change
    useEffect(() => {
        validate(data);
    }, [data]);

    const TAX_AFFECTING_FIELDS = [
      'employeeType', 'state', 'payFrequency', 'payType', 'rate', 'hoursWorked', 'overtimeHoursWorked', 'overtimeRateMultiplier', 'bonus',
      'federalFilingStatus', 'federalAllowances', 'stateFilingStatus', 'stateAllowances',
      'njExemptSuiSdi', 'njExemptFli', 'njExemptStateTax', 'nyStateFilingStatus',
      'nyStateAllowances', 'nyAdditionalWithholding', 'nyWorkCity', 'nyPflWaiver', 'nyExemptStateTax', 'nyExemptSdi',
      'inCountyOfResidence', 'inCountyOfWork', 'inStateExemptions', 'inDependentExemptions',
      'inExemptStateTax', 'inExemptCountyTax', 'caFilingStatus', 'caAllowances',
      'caEstimatedDeductions', 'caEstimatedNonWageIncome', 'caAdditionalWithholding', 'caExemptStateTax', 'caExemptSdi', 'orFilingStatus',
      'orAllowances', 'orAdditionalWithholding', 'orExempt', 'deFilingStatus',
      'deAllowances', 'deExemptStateTax', 'dcFilingStatus', 'dcAllowances',
      'dcExemptStateTax', 'alFilingStatus', 'alDependents', 'alExemptStateTax',
      'azWithholdingRate', 'azExemptStateTax', 'arAllowances', 'arExemptStateTax',
      'gaFilingStatus', 'gaDependentAllowances', 'gaAdditionalAllowances',
      'gaAdditionalWithholding', 'gaExemptStateTax', 'ohAllowances', 'ohAdditionalWithholding',
      'ohExemptStateTax', 'ohMunicipality', 'paExemptStateTax', 'paResidencyPsdCode',
      'paWorkplacePsdCode', 'paIsExemptLST', 'miAllowances', 'miAdditionalWithholding',
      'miExemptStateTax', 'miCityOfResidence', 'kyAllowances', 'kyAdditionalWithholding', 'kyExemptStateTax', 'kyWorkLocation',
    ];


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        if (suggestedTaxes && TAX_AFFECTING_FIELDS.includes(name)) {
            onSuggestionsChange(null);
            setSuggestionError(null);
        }

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
        
        let newFormData = { ...data, [name]: finalValue };

        if (name === 'employeeType' && value === 'contractor') {
            newFormData.federalFilingStatus = 'single';
            newFormData.federalAllowances = 0;
            newFormData.bonus = 0;
            // Reset all state specific fields
            newFormData.stateFilingStatus = 'B';
            newFormData.nyStateFilingStatus = 'single';
            newFormData.stateAllowances = 0;
            newFormData.nyStateAllowances = 0;
            newFormData.nyAdditionalWithholding = 0;
            newFormData.njExemptSuiSdi = false;
            newFormData.njExemptFli = false;
            newFormData.njExemptStateTax = false;
            newFormData.nyPflWaiver = false;
            newFormData.nyExemptStateTax = false;
            newFormData.nyExemptSdi = false;
            newFormData.inStateExemptions = 0;
            newFormData.inDependentExemptions = 0;
            newFormData.inExemptStateTax = false;
            newFormData.inExemptCountyTax = false;
            newFormData.caAllowances = 0;
            newFormData.caAdditionalWithholding = 0;
            newFormData.caEstimatedDeductions = 0;
            newFormData.caEstimatedNonWageIncome = 0;
            newFormData.caExemptStateTax = false;
            newFormData.caExemptSdi = false;
            newFormData.orAllowances = 0;
            newFormData.orAdditionalWithholding = 0;
            newFormData.orExempt = false;
            newFormData.deAllowances = 0;
            newFormData.deExemptStateTax = false;
            newFormData.dcAllowances = 0;
            newFormData.dcExemptStateTax = false;
            newFormData.alDependents = 0;
            newFormData.alExemptStateTax = false;
            newFormData.azExemptStateTax = false;
            newFormData.arAllowances = 0;
            newFormData.arExemptStateTax = false;
            newFormData.gaDependentAllowances = 0;
            newFormData.gaAdditionalAllowances = 0;
            newFormData.gaAdditionalWithholding = 0;
            newFormData.gaExemptStateTax = false;
            newFormData.employerSutaRate = 0;
            newFormData.ohAllowances = 0;
            newFormData.ohAdditionalWithholding = 0;
            newFormData.ohExemptStateTax = false;
            newFormData.paExemptStateTax = false;
            newFormData.paIsExemptLST = false;
            newFormData.miAllowances = 0;
            newFormData.miAdditionalWithholding = 0;
            newFormData.miExemptStateTax = false;
            newFormData.kyAllowances = 0;
            newFormData.kyAdditionalWithholding = 0;
            newFormData.kyExemptStateTax = false;
        }
         if (name === 'payType') {
            newFormData.rate = 0;
            newFormData.hoursWorked = value === 'hourly' ? 40 : 0;
            newFormData.overtimeHoursWorked = 0;
        }
         if (name === 'state') {
            // Reset all state-specific fields when changing state to their defaults
            const resetState = initialFormData;
            newFormData.stateFilingStatus = resetState.stateFilingStatus; 
            newFormData.stateAllowances = resetState.stateAllowances;
            newFormData.njExemptSuiSdi = resetState.njExemptSuiSdi;
            newFormData.njExemptFli = resetState.njExemptFli;
            newFormData.njExemptStateTax = resetState.njExemptStateTax;
            
            newFormData.nyStateFilingStatus = resetState.nyStateFilingStatus;
            newFormData.nyStateAllowances = resetState.nyStateAllowances;
            newFormData.nyAdditionalWithholding = resetState.nyAdditionalWithholding;
            newFormData.nyWorkCity = resetState.nyWorkCity;
            newFormData.nyPflWaiver = resetState.nyPflWaiver;
            newFormData.nyExemptStateTax = resetState.nyExemptStateTax;
            newFormData.nyExemptSdi = resetState.nyExemptSdi;

            newFormData.inCountyOfResidence = resetState.inCountyOfResidence;
            newFormData.inCountyOfWork = resetState.inCountyOfWork;
            newFormData.inStateExemptions = resetState.inStateExemptions;
            newFormData.inDependentExemptions = resetState.inDependentExemptions;
            newFormData.inExemptStateTax = resetState.inExemptStateTax;
            newFormData.inExemptCountyTax = resetState.inExemptCountyTax;

            newFormData.caFilingStatus = resetState.caFilingStatus;
            newFormData.caAllowances = resetState.caAllowances;
            newFormData.caEstimatedDeductions = resetState.caEstimatedDeductions;
            newFormData.caEstimatedNonWageIncome = resetState.caEstimatedNonWageIncome;
            newFormData.caAdditionalWithholding = resetState.caAdditionalWithholding;
            newFormData.caExemptStateTax = resetState.caExemptStateTax;
            newFormData.caExemptSdi = resetState.caExemptSdi;

            newFormData.orFilingStatus = resetState.orFilingStatus;
            newFormData.orAllowances = resetState.orAllowances;
            newFormData.orAdditionalWithholding = resetState.orAdditionalWithholding;
            newFormData.orExempt = resetState.orExempt;

            newFormData.deFilingStatus = resetState.deFilingStatus;
            newFormData.deAllowances = resetState.deAllowances;
            newFormData.deExemptStateTax = resetState.deExemptStateTax;

            newFormData.dcFilingStatus = resetState.dcFilingStatus;
            newFormData.dcAllowances = resetState.dcAllowances;
            newFormData.dcExemptStateTax = resetState.dcExemptStateTax;

            newFormData.alFilingStatus = resetState.alFilingStatus;
            newFormData.alDependents = resetState.alDependents;
            newFormData.alExemptStateTax = resetState.alExemptStateTax;
            
            newFormData.azWithholdingRate = resetState.azWithholdingRate;
            newFormData.azExemptStateTax = resetState.azExemptStateTax;
            
            newFormData.arAllowances = resetState.arAllowances;
            newFormData.arExemptStateTax = resetState.arExemptStateTax;

            newFormData.gaFilingStatus = resetState.gaFilingStatus;
            newFormData.gaDependentAllowances = resetState.gaDependentAllowances;
            newFormData.gaAdditionalAllowances = resetState.gaAdditionalAllowances;
            newFormData.gaAdditionalWithholding = resetState.gaAdditionalWithholding;
            newFormData.gaExemptStateTax = resetState.gaExemptStateTax;

            newFormData.ohAllowances = resetState.ohAllowances;
            newFormData.ohAdditionalWithholding = resetState.ohAdditionalWithholding;
            newFormData.ohExemptStateTax = resetState.ohExemptStateTax;
            newFormData.ohMunicipality = resetState.ohMunicipality;
            
            newFormData.paExemptStateTax = resetState.paExemptStateTax;
            newFormData.paResidencyPsdCode = resetState.paResidencyPsdCode;
            newFormData.paWorkplacePsdCode = resetState.paWorkplacePsdCode;
            newFormData.paIsExemptLST = resetState.paIsExemptLST;

            newFormData.miAllowances = resetState.miAllowances;
            newFormData.miAdditionalWithholding = resetState.miAdditionalWithholding;
            newFormData.miExemptStateTax = resetState.miExemptStateTax;
            newFormData.miCityOfResidence = resetState.miCityOfResidence;

            newFormData.kyAllowances = resetState.kyAllowances;
            newFormData.kyAdditionalWithholding = resetState.kyAdditionalWithholding;
            newFormData.kyExemptStateTax = resetState.kyExemptStateTax;
            newFormData.kyWorkLocation = resetState.kyWorkLocation;
        }
        
        onDataChange(newFormData);
    };
    
    const handleDeductionChange = (index: number, field: string, value: string | number | boolean, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        const updatedDeductions = [...data[type]];
        let updatedDeduction = { ...updatedDeductions[index], [field]: value };

        // If changing type away from 'Other', clear the custom name.
        if (field === 'type' && value !== 'Other') {
            updatedDeduction.customName = '';
        }
        updatedDeductions[index] = updatedDeduction;
        onDataChange({ ...data, [type]: updatedDeductions });
        
        // Clear suggestions if a pre-tax deduction amount changes
        if (type === 'preTaxDeductions' && field === 'amount' && suggestedTaxes) {
            onSuggestionsChange(null);
        }
    };

    const addDeduction = (type: 'preTaxDeductions' | 'postTaxDeductions') => {
        if (type === 'preTaxDeductions') {
             onDataChange({...data, preTaxDeductions: [...data.preTaxDeductions, { type: 'Health Insurance', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }]});
        } else {
             onDataChange({...data, postTaxDeductions: [...data.postTaxDeductions, { type: 'Garnishment', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }]});
        }
    };
    
    const removeDeduction = (index: number, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        const updatedDeductions = data[type].filter((_, i) => i !== index);
        onDataChange({ ...data, [type]: updatedDeductions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate(data)) {
            onSubmit(e);
        }
    };

    const handleSuggestTaxes = async () => {
        if (isContractor) {
            setSuggestionError('Tax suggestions are not applicable for contractors.');
            return;
        }
        if (data.rate <= 0 && data.bonus <= 0) {
            setSuggestionError('Please enter a valid rate/salary or bonus to calculate taxes.');
            return;
        }
        setIsSuggesting(true);
        setSuggestionError(null);
        onSuggestionsChange(null);
        try {
            const taxes = await calculateTaxesOnly(data);
            onSuggestionsChange(taxes);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setSuggestionError(`Failed to suggest taxes. ${errorMessage}`);
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const isContractor = data.employeeType === 'contractor';
    const isFormValid = Object.keys(errors).length === 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            
            <Section title="Worker Information">
                <Input label={isContractor ? 'Contractor Full Name' : 'Employee Full Name'} id="employeeName" name="employeeName" type="text" value={data.employeeName} onChange={handleChange} required error={errors.employeeName} />
                <Select label="Worker Type" id="employeeType" name="employeeType" value={data.employeeType} onChange={handleChange}>
                    <option value="employee">Employee (W-2)</option>
                    <option value="contractor">Contractor (1099)</option>
                </Select>
                 <Select label="State" id="state" name="state" value={data.state} onChange={handleChange}>
                    {SUPPORTED_STATES.sort((a,b) => a.label.localeCompare(b.label)).map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                </Select>
            </Section>

            <Section title="Pay Period & Earnings">
                <Input label="Pay Period Start Date" id="payPeriodStart" name="payPeriodStart" type="date" value={data.payPeriodStart} onChange={handleChange} required error={errors.payPeriodStart} />
                <Input label="Pay Period End Date" id="payPeriodEnd" name="payPeriodEnd" type="date" value={data.payPeriodEnd} onChange={handleChange} required error={errors.payPeriodEnd} />
                <Select label="Pay Frequency" id="payFrequency" name="payFrequency" value={data.payFrequency} onChange={handleChange}>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly (every 2 weeks)</option>
                    <option value="semi-monthly">Semi-monthly (twice a month)</option>
                    <option value="monthly">Monthly</option>
                </Select>
                <Select label="Pay Type" id="payType" name="payType" value={data.payType} onChange={handleChange}>
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                </Select>
                {data.payType === 'hourly' ? (
                     <>
                        <Input label="Hourly Rate ($)" id="rate" name="rate" type="number" min="0" step="0.01" value={data.rate} onChange={handleChange} required error={errors.rate} />
                        <Input label="Regular Hours Worked" id="hoursWorked" name="hoursWorked" type="number" min="0" step="0.1" value={data.hoursWorked} onChange={handleChange} required error={errors.hoursWorked}/>
                        <Input label="Overtime Hours Worked" id="overtimeHoursWorked" name="overtimeHoursWorked" type="number" min="0" step="0.1" value={data.overtimeHoursWorked} onChange={handleChange} error={errors.overtimeHoursWorked}/>
                        <Input label="Overtime Rate Multiplier" id="overtimeRateMultiplier" name="overtimeRateMultiplier" type="number" min="1" step="0.1" value={data.overtimeRateMultiplier} onChange={handleChange} error={errors.overtimeRateMultiplier}/>
                     </>
                ) : (
                    <Input label="Annual Salary ($)" id="rate" name="rate" type="number" min="0" step="100" value={data.rate} onChange={handleChange} required error={errors.rate}/>
                )}
                 <Input label="Bonus ($) (Optional)" id="bonus" name="bonus" type="number" min="0" step="0.01" value={data.bonus} onChange={handleChange} error={errors.bonus} />
            </Section>

            <Section 
                title="Tax Withholding" 
                info="Standard deductions are automatically factored into tax calculations based on your filing status. Adjust allowances/exemptions to fine-tune withholding for items like large itemized deductions, per your state's W-4 equivalent form."
            >
                <Select label="Federal Filing Status" id="federalFilingStatus" name="federalFilingStatus" value={data.federalFilingStatus} onChange={handleChange} disabled={isContractor}>
                    <option value="single">Single</option>
                    <option value="married_jointly">Married Filing Jointly</option>
                    <option value="married_separately">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                </Select>
                <Input label="Federal Allowances" id="federalAllowances" name="federalAllowances" type="number" min="0" value={data.federalAllowances} onChange={handleChange} disabled={isContractor} />
                
                {/* STATE SPECIFIC FIELDS... */}
                {data.state === 'AL' && (<> <div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Alabama uses Form A-4 for state withholding, based on filing status and number of dependents.</p></div> <Select label="AL State Filing Status" id="alFilingStatus" name="alFilingStatus" value={data.alFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_family">Head of Family</option><option value="married_separately">Married Filing Separately</option></Select><Input label="AL Number of Dependents" id="alDependents" name="alDependents" type="number" min="0" value={data.alDependents} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AL Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="alExemptStateTax" name="alExemptStateTax" checked={data.alExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'AK' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Alaska does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'AZ' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Arizona uses a specific percentage of gross wages for state withholding, selected by the employee on Form A-4.</p></div><Select label="AZ Withholding Rate (%)" id="azWithholdingRate" name="azWithholdingRate" value={data.azWithholdingRate} onChange={handleChange} disabled={isContractor}><option value="0.5">0.5%</option><option value="1.0">1.0%</option><option value="1.5">1.5%</option><option value="2.0">2.0%</option><option value="2.5">2.5%</option><option value="3.0">3.0%</option><option value="3.5">3.5%</option></Select><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AZ Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="azExemptStateTax" name="azExemptStateTax" checked={data.azExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'AR' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Arkansas uses Form AR4EC to determine withholding based on the number of allowances claimed.</p></div><Input label="AR Allowances (Form AR4EC)" id="arAllowances" name="arAllowances" type="number" min="0" value={data.arAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AR Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="arExemptStateTax" name="arExemptStateTax" checked={data.arExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'CA' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>California uses Form DE 4, which accounts for filing status, allowances, and estimated deductions/income.</p></div><Select label="CA State Filing Status" id="caFilingStatus" name="caFilingStatus" value={data.caFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single_or_married_one_income">Single, or Married (with one income)</option><option value="married_two_incomes">Married (with two or more incomes)</option><option value="head_of_household">Head of Household</option></Select><Input label="CA State Allowances (Form DE 4)" id="caAllowances" name="caAllowances" type="number" min="0" value={data.caAllowances} onChange={handleChange} disabled={isContractor} /><Input label="CA Estimated Deductions ($)" id="caEstimatedDeductions" name="caEstimatedDeductions" type="number" min="0" step="0.01" value={data.caEstimatedDeductions} onChange={handleChange} disabled={isContractor} error={errors.caEstimatedDeductions} /><Input label="CA Est. Non-Wage Income ($)" id="caEstimatedNonWageIncome" name="caEstimatedNonWageIncome" type="number" min="0" step="0.01" value={data.caEstimatedNonWageIncome} onChange={handleChange} disabled={isContractor} error={errors.caEstimatedNonWageIncome} /><Input label="CA Additional Withholding ($)" id="caAdditionalWithholding" name="caAdditionalWithholding" type="number" min="0" step="0.01" value={data.caAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">CA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="caExemptStateTax" name="caExemptStateTax" checked={data.caExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from State Disability (SDI)" id="caExemptSdi" name="caExemptSdi" checked={data.caExemptSdi} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'DE' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Delaware uses a standard progressive tax system. Withholding is based on filing status and allowances.</p></div><Select label="DE State Filing Status" id="deFilingStatus" name="deFilingStatus" value={data.deFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="DE State Allowances" id="deAllowances" name="deAllowances" type="number" min="0" value={data.deAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">DE Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="deExemptStateTax" name="deExemptStateTax" checked={data.deExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'DC' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>DC uses Form D-4. Withholding is based on filing status and the number of allowances claimed.</p></div><Select label="DC Filing Status" id="dcFilingStatus" name="dcFilingStatus" value={data.dcFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single_head_of_household">Single or Head of Household</option><option value="married_jointly">Married/Registered domestic partner filing jointly</option><option value="married_separately">Married/Registered domestic partner filing separately</option></Select><Input label="DC Allowances (Form D-4)" id="dcAllowances" name="dcAllowances" type="number" min="0" value={data.dcAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">DC Tax Exemptions</h4><Checkbox label="Exempt from DC Income Tax" id="dcExemptStateTax" name="dcExemptStateTax" checked={data.dcExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'FL' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Florida does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'GA' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Georgia uses Form G-4, which considers filing status, dependent allowances, and additional allowances.</p></div><Select label="GA State Filing Status" id="gaFilingStatus" name="gaFilingStatus" value={data.gaFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married_joint_or_hoh">Married Filing Jointly or Head of Household</option><option value="married_separate">Married Filing Separate</option></Select><Input label="GA Dependent Allowances (G-4)" id="gaDependentAllowances" name="gaDependentAllowances" type="number" min="0" value={data.gaDependentAllowances} onChange={handleChange} disabled={isContractor} /><Input label="GA Additional Allowances (G-4)" id="gaAdditionalAllowances" name="gaAdditionalAllowances" type="number" min="0" value={data.gaAdditionalAllowances} onChange={handleChange} disabled={isContractor} /><Input label="GA Additional Withholding ($)" id="gaAdditionalWithholding" name="gaAdditionalWithholding" type="number" min="0" step="0.01" value={data.gaAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">GA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="gaExemptStateTax" name="gaExemptStateTax" checked={data.gaExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'IN' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Indiana has a flat state income tax rate, plus a variable county tax rate based on residence/work location.</p></div><Select label="County of Residence" id="inCountyOfResidence" name="inCountyOfResidence" value={data.inCountyOfResidence} onChange={handleChange} disabled={isContractor} error={errors.inCountyOfResidence}>{indianaCountyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><Select label="County of Work" id="inCountyOfWork" name="inCountyOfWork" value={data.inCountyOfWork} onChange={handleChange} disabled={isContractor} error={errors.inCountyOfWork}>{indianaCountyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><Input label="IN Personal Exemptions (Form WH-4)" id="inStateExemptions" name="inStateExemptions" type="number" min="0" value={data.inStateExemptions} onChange={handleChange} disabled={isContractor} error={errors.inStateExemptions} /><Input label="IN Dependent Exemptions (Form WH-4)" id="inDependentExemptions" name="inDependentExemptions" type="number" min="0" value={data.inDependentExemptions} onChange={handleChange} disabled={isContractor} error={errors.inDependentExemptions} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">IN Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="inExemptStateTax" name="inExemptStateTax" checked={data.inExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from County Income Tax" id="inExemptCountyTax" name="inExemptCountyTax" checked={data.inExemptCountyTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'NJ' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>New Jersey uses Form NJ-W4 and a progressive tax system based on specific filing status letters and allowances.</p></div><Select label="NJ State Filing Status" id="stateFilingStatus" name="stateFilingStatus" value={data.stateFilingStatus} onChange={handleChange} disabled={isContractor}><option value="A">A (Single)</option><option value="B">B (Married/Civil Union, Separate)</option><option value="C">C (Married/Civil Union, Joint)</option><option value="D">D (Head of Household)</option><option value="E">E (Surviving Spouse/Civil Union)</option></Select><Input label="NJ State Allowances" id="stateAllowances" name="stateAllowances" type="number" min="0" value={data.stateAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NJ Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="njExemptStateTax" name="njExemptStateTax" checked={data.njExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from SUI/SDI (e.g., family employment)" id="njExemptSuiSdi" name="njExemptSuiSdi" checked={data.njExemptSuiSdi} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Family Leave Insurance (FLI)" id="njExemptFli" name="njExemptFli" checked={data.njExemptFli} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'NY' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>New York withholding includes state tax (Form IT-2104) and potentially local tax for cities like NYC and Yonkers.</p></div><Select label="NY State Filing Status" id="nyStateFilingStatus" name="nyStateFilingStatus" value={data.nyStateFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="NY State Allowances" id="nyStateAllowances" name="nyStateAllowances" type="number" min="0" value={data.nyStateAllowances} onChange={handleChange} disabled={isContractor} /><Input label="NY Additional Withholding ($)" id="nyAdditionalWithholding" name="nyAdditionalWithholding" type="number" min="0" step="0.01" value={data.nyAdditionalWithholding} onChange={handleChange} disabled={isContractor} error={errors.nyAdditionalWithholding} /><Select label="NY Work City (for local tax)" id="nyWorkCity" name="nyWorkCity" value={data.nyWorkCity} onChange={handleChange} disabled={isContractor}><option value="none">Outside NYC / Yonkers</option><option value="nyc">New York City</option><option value="yonkers">Yonkers</option></Select><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NY Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="nyExemptStateTax" name="nyExemptStateTax" checked={data.nyExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from State Disability Insurance (NYSDI)" id="nyExemptSdi" name="nyExemptSdi" checked={data.nyExemptSdi} onChange={handleChange} disabled={isContractor} /><Checkbox label="Employee has a waiver for Paid Family Leave (PFL)" id="nyPflWaiver" name="nyPflWaiver" checked={data.nyPflWaiver} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'OR' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Oregon uses Form OR-W-4. Withholding is based on filing status, allowances, and any additional amount requested.</p></div><Select label="OR State Filing Status" id="orFilingStatus" name="orFilingStatus" value={data.orFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="married_separately">Married Filing Separately</option></Select><Input label="OR State Allowances (Form OR-W-4)" id="orAllowances" name="orAllowances" type="number" min="0" value={data.orAllowances} onChange={handleChange} disabled={isContractor} /><Input label="OR Additional Withholding ($)" id="orAdditionalWithholding" name="orAdditionalWithholding" type="number" min="0" step="0.01" value={data.orAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">OR Tax Exemptions</h4><Checkbox label="Claim exemption from state income tax" id="orExempt" name="orExempt" checked={data.orExempt} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'TX' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Texas does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'NV' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Nevada does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'NH' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>New Hampshire does not have a state income tax on wages, so no state-level withholding information is required.</p></div>)}
                {data.state === 'SD' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>South Dakota does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'TN' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Tennessee does not have a state income tax on wages, so no state-level withholding information is required.</p></div>)}
                {data.state === 'WY' && (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Wyoming does not have a state income tax, so no state-level withholding information is required.</p></div>)}
                {data.state === 'OH' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Ohio has a progressive state income tax. Local municipal taxes are also withheld based on the work location.</p></div><Input label="OH Allowances (Form IT 4)" id="ohAllowances" name="ohAllowances" type="number" min="0" value={data.ohAllowances} onChange={handleChange} disabled={isContractor} /><Input label="OH Additional Withholding ($)" id="ohAdditionalWithholding" name="ohAdditionalWithholding" type="number" min="0" step="0.01" value={data.ohAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="Work Municipality/City" id="ohMunicipality" name="ohMunicipality" type="text" placeholder="e.g., Columbus" value={data.ohMunicipality} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">OH Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ohExemptStateTax" name="ohExemptStateTax" checked={data.ohExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'PA' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Pennsylvania has a flat 3.07% state income tax. Local taxes (EIT/LST) are also withheld based on PSD codes.</p></div><Input label="Residency PSD Code" id="paResidencyPsdCode" name="paResidencyPsdCode" type="text" placeholder="e.g., 880000" value={data.paResidencyPsdCode} onChange={handleChange} disabled={isContractor} /><Input label="Workplace PSD Code" id="paWorkplacePsdCode" name="paWorkplacePsdCode" type="text" placeholder="e.g., 700101" value={data.paWorkplacePsdCode} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">PA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="paExemptStateTax" name="paExemptStateTax" checked={data.paExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Local Services Tax (LST)" id="paIsExemptLST" name="paIsExemptLST" checked={data.paIsExemptLST} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'MI' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Michigan has a flat state tax. Withholding is adjusted by exemptions. Some cities (e.g., Detroit) also levy a city income tax based on residency.</p></div><Input label="MI Personal & Dependent Exemptions" id="miAllowances" name="miAllowances" type="number" min="0" value={data.miAllowances} onChange={handleChange} disabled={isContractor} /><Input label="MI Additional Withholding ($)" id="miAdditionalWithholding" name="miAdditionalWithholding" type="number" min="0" step="0.01" value={data.miAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="City of Residence (for local tax)" id="miCityOfResidence" name="miCityOfResidence" type="text" placeholder="e.g., Detroit, Grand Rapids" value={data.miCityOfResidence} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MI Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="miExemptStateTax" name="miExemptStateTax" checked={data.miExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
                {data.state === 'KY' && (<><div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>Kentucky has a flat state income tax. Local occupational taxes are also withheld based on the work location.</p></div><Input label="KY Allowances (Tax Credits)" id="kyAllowances" name="kyAllowances" type="number" min="0" value={data.kyAllowances} onChange={handleChange} disabled={isContractor} /><Input label="KY Additional Withholding ($)" id="kyAdditionalWithholding" name="kyAdditionalWithholding" type="number" min="0" step="0.01" value={data.kyAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="Work County/City (for local tax)" id="kyWorkLocation" name="kyWorkLocation" type="text" placeholder="e.g., Louisville" value={data.kyWorkLocation} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">KY Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="kyExemptStateTax" name="kyExemptStateTax" checked={data.kyExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>)}
            </Section>

            <div className="border-t border-gray-200 pt-6 text-center">
                 <button 
                    type="button" 
                    onClick={handleSuggestTaxes} 
                    disabled={isSuggesting || isContractor}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSuggesting ? 'Calculating...' : 'Calculate Estimated Taxes'}
                </button>
                 {suggestionError && <p className="mt-2 text-xs text-red-600">{suggestionError}</p>}
                 {isContractor && <p className="mt-2 text-xs text-gray-500">Tax calculations do not apply to contractors.</p>}
                 {!suggestedTaxes && !isSuggesting && !isContractor && <p className="mt-2 text-xs text-gray-500">Click to preview statutory deductions based on the info above.</p>}
            </div>

            {suggestedTaxes && (
                <Section title="Statutory Deductions (Estimated)">
                    <Input label="Federal Income Tax" id="sugg-fit" value={suggestedTaxes.federalIncomeTax.toFixed(2)} readOnly disabled />
                    <Input label="Social Security" id="sugg-ss" value={suggestedTaxes.socialSecurity.toFixed(2)} readOnly disabled />
                    <Input label="Medicare" id="sugg-med" value={suggestedTaxes.medicare.toFixed(2)} readOnly disabled />
                    
                    {data.state === 'NJ' && (<>
                        <Input label="NJ State Income Tax" id="sugg-nj-sit" value={suggestedTaxes.njStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="NJ SUI" id="sugg-nj-sui" value={suggestedTaxes.njSUI.toFixed(2)} readOnly disabled />
                        <Input label="NJ SDI" id="sugg-nj-sdi" value={suggestedTaxes.njSDI.toFixed(2)} readOnly disabled />
                        <Input label="NJ FLI" id="sugg-nj-fli" value={suggestedTaxes.njFLI.toFixed(2)} readOnly disabled />
                    </>)}
                     {data.state === 'NY' && (<>
                        <Input label="NY State Income Tax" id="sugg-ny-sit" value={suggestedTaxes.nyStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="NY Local Income Tax" id="sugg-ny-lit" value={suggestedTaxes.nyLocalIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="NY Disability (NYSDI)" id="sugg-ny-sdi" value={suggestedTaxes.nyDisabilityInsurance.toFixed(2)} readOnly disabled />
                        <Input label="NY Paid Family Leave (PFL)" id="sugg-ny-pfl" value={suggestedTaxes.nyPaidFamilyLeave.toFixed(2)} readOnly disabled />
                    </>)}
                     {data.state === 'IN' && (<>
                        <Input label="IN State Income Tax" id="sugg-in-sit" value={suggestedTaxes.inStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="IN County Income Tax" id="sugg-in-cit" value={suggestedTaxes.inCountyIncomeTax.toFixed(2)} readOnly disabled />
                    </>)}
                    {data.state === 'CA' && (<>
                        <Input label="CA State Income Tax" id="sugg-ca-sit" value={suggestedTaxes.caStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="CA State Disability (SDI)" id="sugg-ca-sdi" value={suggestedTaxes.caSDI.toFixed(2)} readOnly disabled />
                    </>)}
                    {data.state === 'OR' && <Input label="OR State Income Tax" id="sugg-or-sit" value={suggestedTaxes.orStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'DE' && <Input label="DE State Income Tax" id="sugg-de-sit" value={suggestedTaxes.deStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'DC' && <Input label="DC Income Tax" id="sugg-dc-sit" value={suggestedTaxes.dcStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'AL' && <Input label="AL State Income Tax" id="sugg-al-sit" value={suggestedTaxes.alStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'AZ' && <Input label="AZ State Income Tax" id="sugg-az-sit" value={suggestedTaxes.azStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'AR' && <Input label="AR State Income Tax" id="sugg-ar-sit" value={suggestedTaxes.arStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'GA' && <Input label="GA State Income Tax" id="sugg-ga-sit" value={suggestedTaxes.gaStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'TX' && <Input label="TX State Income Tax" id="sugg-tx-sit" value={suggestedTaxes.txStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'NV' && <Input label="NV State Income Tax" id="sugg-nv-sit" value={suggestedTaxes.nvStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'NH' && <Input label="NH State Income Tax" id="sugg-nh-sit" value={suggestedTaxes.nhStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'SD' && <Input label="SD State Income Tax" id="sugg-sd-sit" value={suggestedTaxes.sdStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'TN' && <Input label="TN State Income Tax" id="sugg-tn-sit" value={suggestedTaxes.tnStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'WY' && <Input label="WY State Income Tax" id="sugg-wy-sit" value={suggestedTaxes.wyStateIncomeTax.toFixed(2)} readOnly disabled />}
                    {data.state === 'OH' && (<>
                        <Input label="OH State Income Tax" id="sugg-oh-sit" value={suggestedTaxes.ohStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="OH Local Income Tax" id="sugg-oh-lit" value={suggestedTaxes.ohLocalIncomeTax.toFixed(2)} readOnly disabled />
                    </>)}
                    {data.state === 'PA' && (<>
                        <Input label="PA State Income Tax" id="sugg-pa-sit" value={suggestedTaxes.paStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="PA Local Taxes (EIT/LST)" id="sugg-pa-lit" value={suggestedTaxes.paLocalIncomeTax.toFixed(2)} readOnly disabled />
                    </>)}
                    {data.state === 'MI' && (<>
                        <Input label="MI State Income Tax" id="sugg-mi-sit" value={suggestedTaxes.miStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="MI Local Income Tax" id="sugg-mi-lit" value={suggestedTaxes.miLocalIncomeTax.toFixed(2)} readOnly disabled />
                    </>)}
                    {data.state === 'KY' && (<>
                        <Input label="KY State Income Tax" id="sugg-ky-sit" value={suggestedTaxes.kyStateIncomeTax.toFixed(2)} readOnly disabled />
                        <Input label="KY Local Occ. Tax" id="sugg-ky-lit" value={suggestedTaxes.kyLocalIncomeTax.toFixed(2)} readOnly disabled />
                    </>)}
                </Section>
            )}

            <fieldset className="mb-6 border border-gray-200 p-4 rounded-lg">
                <legend className="text-lg font-bold text-gray-700 px-2">Voluntary Deductions</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">
                     <div className="md:col-span-2 space-y-4">
                        <h4 className="font-semibold text-gray-600">Pre-Tax Deductions</h4>
                        {data.preTaxDeductions.map((ded, i) => (
                             <div key={i} className="space-y-2 border-t pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                <div className="flex items-start gap-2">
                                    <div className="flex-grow">
                                        <label htmlFor={`pre-type-${i}`} className="text-xs text-gray-600">Type</label>
                                        <select id={`pre-type-${i}`} value={ded.type} onChange={e => handleDeductionChange(i, 'type', e.target.value, 'preTaxDeductions')} className="w-full form-select rounded-md border-gray-300 shadow-sm text-sm">
                                            {PRE_TAX_DEDUCTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label htmlFor={`pre-amount-${i}`} className="text-xs text-gray-600">Amount ($)</label>
                                        <input id={`pre-amount-${i}`} type="number" placeholder="Amount" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'preTaxDeductions')} className="w-full form-input rounded-md border-gray-300 shadow-sm text-sm" />
                                    </div>
                                    <button type="button" onClick={() => removeDeduction(i, 'preTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1 mt-4" aria-label="Remove pre-tax deduction">&times;</button>
                                </div>
                                {ded.type === 'Other' && (
                                     <div className="pl-2 animate-fade-in">
                                        <Input 
                                            label="Custom Deduction Name"
                                            id={`pre-customName-${i}`}
                                            type="text"
                                            placeholder="e.g., Parking"
                                            value={ded.customName}
                                            onChange={e => handleDeductionChange(i, 'customName', e.target.value, 'preTaxDeductions')}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 pl-2">
                                    <Checkbox 
                                        label="Set as Recurring"
                                        id={`pre-recurring-${i}`}
                                        checked={ded.isRecurring}
                                        onChange={e => handleDeductionChange(i, 'isRecurring', (e.target as HTMLInputElement).checked, 'preTaxDeductions')}
                                    />
                                </div>
                                {ded.isRecurring && (
                                    <div className="grid grid-cols-2 gap-2 pl-8 animate-fade-in">
                                        <Input 
                                            label="Start Date (Optional)" 
                                            id={`pre-start-${i}`}
                                            type="date" 
                                            value={ded.startDate}
                                            onChange={e => handleDeductionChange(i, 'startDate', e.target.value, 'preTaxDeductions')}
                                        />
                                        <Input 
                                            label="End Date (Optional)" 
                                            id={`pre-end-${i}`}
                                            type="date"
                                            value={ded.endDate}
                                            onChange={e => handleDeductionChange(i, 'endDate', e.target.value, 'preTaxDeductions')}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addDeduction('preTaxDeductions')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Pre-Tax Deduction</button>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h4 className="font-semibold text-gray-600">Post-Tax Deductions</h4>
                        {data.postTaxDeductions.map((ded, i) => (
                             <div key={i} className="space-y-2 border-t pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                <div className="flex items-start gap-2">
                                     <div className="flex-grow">
                                        <label htmlFor={`post-type-${i}`} className="text-xs text-gray-600">Type</label>
                                        <select id={`post-type-${i}`} value={ded.type} onChange={e => handleDeductionChange(i, 'type', e.target.value, 'postTaxDeductions')} className="w-full form-select rounded-md border-gray-300 shadow-sm text-sm">
                                            {POST_TAX_DEDUCTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label htmlFor={`post-amount-${i}`} className="text-xs text-gray-600">Amount ($)</label>
                                        <input id={`post-amount-${i}`} type="number" placeholder="Amount" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'postTaxDeductions')} className="w-full form-input rounded-md border-gray-300 shadow-sm text-sm" />
                                    </div>
                                    <button type="button" onClick={() => removeDeduction(i, 'postTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1 mt-4" aria-label="Remove post-tax deduction">&times;</button>
                                </div>
                                 {ded.type === 'Other' && (
                                     <div className="pl-2 animate-fade-in">
                                        <Input 
                                            label="Custom Deduction Name"
                                            id={`post-customName-${i}`}
                                            type="text"
                                            placeholder="e.g., Uniform Fee"
                                            value={ded.customName}
                                            onChange={e => handleDeductionChange(i, 'customName', e.target.value, 'postTaxDeductions')}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 pl-2">
                                    <Checkbox 
                                        label="Set as Recurring"
                                        id={`post-recurring-${i}`}
                                        checked={ded.isRecurring}
                                        onChange={e => handleDeductionChange(i, 'isRecurring', (e.target as HTMLInputElement).checked, 'postTaxDeductions')}
                                    />
                                </div>
                                {ded.isRecurring && (
                                    <div className="grid grid-cols-2 gap-2 pl-8 animate-fade-in">
                                        <Input 
                                            label="Start Date (Optional)" 
                                            id={`post-start-${i}`}
                                            type="date" 
                                            value={ded.startDate}
                                            onChange={e => handleDeductionChange(i, 'startDate', e.target.value, 'postTaxDeductions')}
                                        />
                                        <Input 
                                            label="End Date (Optional)" 
                                            id={`post-end-${i}`}
                                            type="date"
                                            value={ded.endDate}
                                            onChange={e => handleDeductionChange(i, 'endDate', e.target.value, 'postTaxDeductions')}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addDeduction('postTaxDeductions')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Post-Tax Deduction</button>
                    </div>
                </div>
            </fieldset>
            
             <Section title="Year-to-Date Summary (Optional)">
                <Input label="Gross Pay YTD ($)" id="grossPayYTD" name="grossPayYTD" type="number" min="0" step="0.01" value={data.grossPayYTD} onChange={handleChange} error={errors.grossPayYTD} />
                <Input label="Total Deductions YTD ($)" id="totalDeductionsYTD" name="totalDeductionsYTD" type="number" min="0" step="0.01" value={data.totalDeductionsYTD} onChange={handleChange} error={errors.totalDeductionsYTD} />
                <Input label="Net Pay YTD ($)" id="netPayYTD" name="netPayYTD" type="number" min="0" step="0.01" value={data.netPayYTD} onChange={handleChange} error={errors.netPayYTD} />
            </Section>

            {data.employeeType === 'employee' && (
                <Section
                    title="Employer Taxes"
                    info="These are state-level taxes paid by the employer, not deducted from the employee's pay. The most common is State Unemployment Tax (SUTA)."
                >
                    <Input 
                        label="State Unemployment (SUTA) Rate (%)" 
                        id="employerSutaRate" 
                        name="employerSutaRate" 
                        type="number" 
                        min="0" 
                        step="0.001" 
                        value={data.employerSutaRate} 
                        onChange={handleChange} 
                    />
                </Section>
            )}

            <div className="pt-5">
                <button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Generate Final Pay Stub
                </button>
                {!isFormValid && <p className="text-center mt-2 text-sm text-red-600">Please fix the errors before submitting.</p>}
            </div>
             <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
              }
            `}</style>
        </form>
    );
}