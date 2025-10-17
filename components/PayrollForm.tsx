import React, { useState, useEffect, useCallback } from 'react';
import type { PayrollFormData, PreTaxDeductionType, PostTaxDeductionType, Taxes } from '../types';
import { calculateTaxesOnly } from '../services/geminiService';
import { INDIANA_COUNTY_TAX_RATES } from '../data/IndianaCountyTaxRates';
import { MARYLAND_COUNTY_TAX_RATES } from '../data/MarylandCountyTaxRates';


interface PayrollFormProps {
  data: PayrollFormData;
  // FIX: Correctly type the onDataChange prop to match React's setState dispatcher.
  onDataChange: React.Dispatch<React.SetStateAction<PayrollFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  suggestedTaxes: Taxes | null;
  onSuggestionsChange: (taxes: Taxes | null) => void;
}

const SUPPORTED_STATES = [
    { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
].sort((a, b) => a.label.localeCompare(b.label));

const PRE_TAX_DEDUCTION_TYPES: PreTaxDeductionType[] = ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) / 403(b)', 'HSA Contribution', 'FSA Contribution', 'Other'];
const POST_TAX_DEDUCTION_TYPES: PostTaxDeductionType[] = ['Garnishment', 'Roth IRA', 'Union Dues', 'Charitable Donation', 'Other'];

const indianaCountyOptions = [{ value: '', label: 'Select a county' }].concat(
    Object.keys(INDIANA_COUNTY_TAX_RATES).sort().map(county => ({
        value: county, label: county.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }))
);

const marylandCountyOptions = [{ value: '', label: 'Select a county' }].concat(
    Object.keys(MARYLAND_COUNTY_TAX_RATES).sort().map(county => ({
        value: county, label: county.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }))
);

export const initialFormData: PayrollFormData = {
    employeeName: '', employeeType: 'employee', state: 'AL', payPeriodStart: '', payPeriodEnd: '',
    payFrequency: 'bi-weekly', payType: 'hourly', rate: 0, hoursWorked: 40, overtimeHoursWorked: 0,
    overtimeRateMultiplier: 1.5, bonus: 0, federalFilingStatus: 'single', federalAllowances: 1,
    stateFilingStatus: 'B', stateAllowances: 1, njExemptSuiSdi: false, njExemptFli: false, njExemptStateTax: false,
    nyStateFilingStatus: 'single', nyStateAllowances: 1, nyAdditionalWithholding: 0, nyWorkCity: 'none',
    nyPflWaiver: false, nyExemptStateTax: false, nyExemptSdi: false, inCountyOfResidence: '', inCountyOfWork: '',
    inStateExemptions: 1, inDependentExemptions: 0, inExemptStateTax: false, inExemptCountyTax: false,
    caFilingStatus: 'single_or_married_one_income', caAllowances: 1, caEstimatedDeductions: 0,
    caEstimatedNonWageIncome: 0, caAdditionalWithholding: 0, caExemptStateTax: false, caExemptSdi: false,
    orFilingStatus: 'single', orAllowances: 1, orAdditionalWithholding: 0, orExempt: false,
    deFilingStatus: 'single', deAllowances: 1, deExemptStateTax: false, dcFilingStatus: 'single_head_of_household',
    dcAllowances: 1, dcExemptStateTax: false, alFilingStatus: 'single', alDependents: 0, alExemptStateTax: false,
    azWithholdingRate: 2.0, azExemptStateTax: false, arAllowances: 1, arExemptStateTax: false,
    gaFilingStatus: 'single', gaDependentAllowances: 0, gaAdditionalAllowances: 0, gaAdditionalWithholding: 0,
    gaExemptStateTax: false, ohAllowances: 1, ohAdditionalWithholding: 0, ohExemptStateTax: false,
    ohMunicipality: '', paExemptStateTax: false, paResidencyPsdCode: '', paWorkplacePsdCode: '',
    paIsExemptLST: false, miAllowances: 1, miAdditionalWithholding: 0, miExemptStateTax: false,
    miCityOfResidence: '', kyAllowances: 1, kyAdditionalWithholding: 0, kyExemptStateTax: false,
    kyWorkLocation: '', coFilingStatus: 'single', coAllowances: 1, coExemptStateTax: false,
    ctWithholdingCode: 'D', ctExemptStateTax: false, hiFilingStatus: 'single', hiAllowances: 1,
    hiExemptStateTax: false, idFilingStatus: 'single', idAllowances: 1, idAdditionalWithholding: 0,
    idExemptStateTax: false, ilBasicAllowances: 1, ilAdditionalAllowances: 0, ilExemptStateTax: false,
    iaAllowances: 1, iaAdditionalWithholding: 0, iaExemptStateTax: false, ksFilingStatus: 'single',
    ksAllowances: 1, ksExemptStateTax: false, laFilingStatus: 'single', laAllowances: 1, laDependents: 0,
    laExemptStateTax: false, meFilingStatus: 'single', meAllowances: 1, meExemptStateTax: false,
    mdFilingStatus: 'single', mdExemptions: 1, mdCounty: '', mdExemptStateTax: false,
    mdExemptCountyTax: false, maFilingStatus: 'single', maExemptions: 1, maAdditionalWithholding: 0,
    maExemptStateTax: false, maExemptPfml: false, mnFilingStatus: 'single', mnAllowances: 1,
    mnExemptStateTax: false, msFilingStatus: 'single', msExemptions: 1, msExemptStateTax: false,
    moFilingStatus: 'single', moAllowances: 1, moAdditionalWithholding: 0, moExemptStateTax: false,
    mtAllowances: 1, mtAdditionalWithholding: 0, mtExemptStateTax: false, neFilingStatus: 'single',
    neAllowances: 1, neExemptStateTax: false, nmExemptions: 1, nmAdditionalWithholding: 0,
    nmExemptStateTax: false, ncFilingStatus: 'single', ncAllowances: 1, ncAdditionalWithholding: 0,
    ncExemptStateTax: false, ndFilingStatus: 'single', ndAllowances: 1, ndExemptStateTax: false,
    okFilingStatus: 'single', okAllowances: 1, okExemptStateTax: false, riAllowances: 1,
    riAdditionalWithholding: 0, riExemptStateTax: false, riExemptTdi: false, scFilingStatus: 'single',
    scExemptions: 1, scAdditionalWithholding: 0, scExemptStateTax: false, utFilingStatus: 'single',
    utAllowances: 1, utExemptStateTax: false, vtFilingStatus: 'single', vtAllowances: 1,
    vtExemptStateTax: false, vaPersonalExemptions: 1, vaDependentExemptions: 0, vaExemptStateTax: false,
    waExemptPfml: false, wvAllowances: 1, wvExemptStateTax: false, wiFilingStatus: 'single',
    wiAllowances: 1, wiExemptStateTax: false,
    preTaxDeductions: [
        { type: 'Health Insurance', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' },
        { type: '401(k) / 403(b)', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }
    ],
    postTaxDeductions: [ { type: 'Garnishment', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }],
    grossPayYTD: 0, totalDeductionsYTD: 0, netPayYTD: 0, employerSutaRate: 0,
};

const Section: React.FC<{ title: string; children: React.ReactNode; info?: string }> = ({ title, children, info }) => (
    <fieldset className="mb-6 border border-gray-200 p-4 rounded-lg">
        <legend className="text-lg font-bold text-gray-700 px-2 flex items-center gap-2">
            <span>{title}</span>
            {info && (
                <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="absolute bottom-full mb-2 w-72 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 left-1/2 -translate-x-1/2">
                        {info}<svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            )}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">{children}</div>
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
        <select {...props} className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}>{children}</select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input {...props} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed" />
        <label htmlFor={props.id} className="ml-3 block text-sm font-medium text-gray-700">{label}</label>
    </div>
);

const StateInfoBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (<div className="md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800"><p>{children}</p></div>);

// Memoized component for state-specific fields to prevent re-rendering on every keystroke
const StateSpecificFields = React.memo(({ data, handleChange, errors, isContractor }: { data: PayrollFormData, handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void, errors: Record<string, string>, isContractor: boolean }) => {
    // A switch statement is more performant for many conditions than chained ternary operators or && expressions
    switch (data.state) {
        case 'AL': return (<><StateInfoBox>Alabama uses Form A-4 for state withholding, based on filing status and number of dependents.</StateInfoBox><Select label="AL State Filing Status" id="alFilingStatus" name="alFilingStatus" value={data.alFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_family">Head of Family</option><option value="married_separately">Married Filing Separately</option></Select><Input label="AL Number of Dependents" id="alDependents" name="alDependents" type="number" min="0" value={data.alDependents} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AL Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="alExemptStateTax" name="alExemptStateTax" checked={data.alExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'AK': case 'FL': case 'NV': case 'NH': case 'SD': case 'TN': case 'TX': case 'WY': return (<StateInfoBox>{SUPPORTED_STATES.find(s => s.value === data.state)?.label} does not have a state income tax on wages, so no state-level withholding information is required.</StateInfoBox>);
        case 'AZ': return (<><StateInfoBox>Arizona uses a specific percentage of gross wages for state withholding, selected by the employee on Form A-4.</StateInfoBox><Select label="AZ Withholding Rate (%)" id="azWithholdingRate" name="azWithholdingRate" value={data.azWithholdingRate} onChange={handleChange} disabled={isContractor}><option value="0.5">0.5%</option><option value="1.0">1.0%</option><option value="1.5">1.5%</option><option value="2.0">2.0%</option><option value="2.5">2.5%</option><option value="3.0">3.0%</option><option value="3.5">3.5%</option></Select><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AZ Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="azExemptStateTax" name="azExemptStateTax" checked={data.azExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'AR': return (<><StateInfoBox>Arkansas uses Form AR4EC to determine withholding based on the number of allowances claimed.</StateInfoBox><Input label="AR Allowances (Form AR4EC)" id="arAllowances" name="arAllowances" type="number" min="0" value={data.arAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">AR Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="arExemptStateTax" name="arExemptStateTax" checked={data.arExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'CA': return (<><StateInfoBox>California uses Form DE 4, which accounts for filing status, allowances, and estimated deductions/income.</StateInfoBox><Select label="CA State Filing Status" id="caFilingStatus" name="caFilingStatus" value={data.caFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single_or_married_one_income">Single, or Married (with one income)</option><option value="married_two_incomes">Married (with two or more incomes)</option><option value="head_of_household">Head of Household</option></Select><Input label="CA State Allowances (Form DE 4)" id="caAllowances" name="caAllowances" type="number" min="0" value={data.caAllowances} onChange={handleChange} disabled={isContractor} /><Input label="CA Estimated Deductions ($)" id="caEstimatedDeductions" name="caEstimatedDeductions" type="number" min="0" step="0.01" value={data.caEstimatedDeductions} onChange={handleChange} disabled={isContractor} error={errors.caEstimatedDeductions} /><Input label="CA Est. Non-Wage Income ($)" id="caEstimatedNonWageIncome" name="caEstimatedNonWageIncome" type="number" min="0" step="0.01" value={data.caEstimatedNonWageIncome} onChange={handleChange} disabled={isContractor} error={errors.caEstimatedNonWageIncome} /><Input label="CA Additional Withholding ($)" id="caAdditionalWithholding" name="caAdditionalWithholding" type="number" min="0" step="0.01" value={data.caAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">CA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="caExemptStateTax" name="caExemptStateTax" checked={data.caExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from State Disability (SDI)" id="caExemptSdi" name="caExemptSdi" checked={data.caExemptSdi} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'CO': return (<><StateInfoBox>Colorado uses Form DR 0004. Withholding is based on filing status and allowances.</StateInfoBox><Select label="CO State Filing Status" id="coFilingStatus" name="coFilingStatus" value={data.coFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="married_single_rate">Married, but withhold at higher Single rate</option></Select><Input label="CO State Allowances" id="coAllowances" name="coAllowances" type="number" min="0" value={data.coAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">CO Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="coExemptStateTax" name="coExemptStateTax" checked={data.coExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'CT': return (<><StateInfoBox>Connecticut uses Form CT-W4, which specifies a withholding code based on filing status.</StateInfoBox><Select label="CT Withholding Code" id="ctWithholdingCode" name="ctWithholdingCode" value={data.ctWithholdingCode} onChange={handleChange} disabled={isContractor}><option value="A">A (Single/Married Separate, higher rate)</option><option value="B">B (Head of Household)</option><option value="C">C (Married/Civil Union Joint)</option><option value="D">D (Single/Married Separate, lower rate)</option><option value="F">F (Married/Civil Union Joint, one spouse works)</option></Select><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">CT Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ctExemptStateTax" name="ctExemptStateTax" checked={data.ctExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'DE': return (<><StateInfoBox>Delaware uses a standard progressive tax system. Withholding is based on filing status and allowances.</StateInfoBox><Select label="DE State Filing Status" id="deFilingStatus" name="deFilingStatus" value={data.deFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="DE State Allowances" id="deAllowances" name="deAllowances" type="number" min="0" value={data.deAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">DE Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="deExemptStateTax" name="deExemptStateTax" checked={data.deExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'DC': return (<><StateInfoBox>DC uses Form D-4. Withholding is based on filing status and the number of allowances claimed.</StateInfoBox><Select label="DC Filing Status" id="dcFilingStatus" name="dcFilingStatus" value={data.dcFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single_head_of_household">Single or Head of Household</option><option value="married_jointly">Married/Registered domestic partner filing jointly</option><option value="married_separately">Married/Registered domestic partner filing separately</option></Select><Input label="DC Allowances (Form D-4)" id="dcAllowances" name="dcAllowances" type="number" min="0" value={data.dcAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">DC Tax Exemptions</h4><Checkbox label="Exempt from DC Income Tax" id="dcExemptStateTax" name="dcExemptStateTax" checked={data.dcExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'GA': return (<><StateInfoBox>Georgia uses Form G-4, which considers filing status, dependent allowances, and additional allowances.</StateInfoBox><Select label="GA State Filing Status" id="gaFilingStatus" name="gaFilingStatus" value={data.gaFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married_joint_or_hoh">Married Filing Jointly or Head of Household</option><option value="married_separate">Married Filing Separate</option></Select><Input label="GA Dependent Allowances (G-4)" id="gaDependentAllowances" name="gaDependentAllowances" type="number" min="0" value={data.gaDependentAllowances} onChange={handleChange} disabled={isContractor} /><Input label="GA Additional Allowances (G-4)" id="gaAdditionalAllowances" name="gaAdditionalAllowances" type="number" min="0" value={data.gaAdditionalAllowances} onChange={handleChange} disabled={isContractor} /><Input label="GA Additional Withholding ($)" id="gaAdditionalWithholding" name="gaAdditionalWithholding" type="number" min="0" step="0.01" value={data.gaAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">GA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="gaExemptStateTax" name="gaExemptStateTax" checked={data.gaExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'HI': return (<><StateInfoBox>Hawaii uses Form HW-4. Withholding is based on filing status and allowances claimed.</StateInfoBox><Select label="HI State Filing Status" id="hiFilingStatus" name="hiFilingStatus" value={data.hiFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="HI State Allowances" id="hiAllowances" name="hiAllowances" type="number" min="0" value={data.hiAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">HI Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="hiExemptStateTax" name="hiExemptStateTax" checked={data.hiExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'ID': return (<><StateInfoBox>Idaho uses Form ID W-4. Withholding is based on filing status, allowances, and any additional withholding.</StateInfoBox><Select label="ID State Filing Status" id="idFilingStatus" name="idFilingStatus" value={data.idFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="ID State Allowances" id="idAllowances" name="idAllowances" type="number" min="0" value={data.idAllowances} onChange={handleChange} disabled={isContractor} /><Input label="ID Additional Withholding ($)" id="idAdditionalWithholding" name="idAdditionalWithholding" type="number" min="0" step="0.01" value={data.idAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">ID Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="idExemptStateTax" name="idExemptStateTax" checked={data.idExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'IL': return (<><StateInfoBox>Illinois uses Form IL-W-4. Withholding is based on basic and additional allowances claimed.</StateInfoBox><Input label="IL Basic Allowances" id="ilBasicAllowances" name="ilBasicAllowances" type="number" min="0" value={data.ilBasicAllowances} onChange={handleChange} disabled={isContractor} /><Input label="IL Additional Allowances" id="ilAdditionalAllowances" name="ilAdditionalAllowances" type="number" min="0" value={data.ilAdditionalAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">IL Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ilExemptStateTax" name="ilExemptStateTax" checked={data.ilExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'IN': return (<><StateInfoBox>Indiana has a flat state income tax rate, plus a variable county tax rate based on residence/work location.</StateInfoBox><Select label="County of Residence" id="inCountyOfResidence" name="inCountyOfResidence" value={data.inCountyOfResidence} onChange={handleChange} disabled={isContractor} error={errors.inCountyOfResidence}>{indianaCountyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><Select label="County of Work" id="inCountyOfWork" name="inCountyOfWork" value={data.inCountyOfWork} onChange={handleChange} disabled={isContractor} error={errors.inCountyOfWork}>{indianaCountyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><Input label="IN Personal Exemptions (Form WH-4)" id="inStateExemptions" name="inStateExemptions" type="number" min="0" value={data.inStateExemptions} onChange={handleChange} disabled={isContractor} error={errors.inStateExemptions} /><Input label="IN Dependent Exemptions (Form WH-4)" id="inDependentExemptions" name="inDependentExemptions" type="number" min="0" value={data.inDependentExemptions} onChange={handleChange} disabled={isContractor} error={errors.inDependentExemptions} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">IN Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="inExemptStateTax" name="inExemptStateTax" checked={data.inExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from County Income Tax" id="inExemptCountyTax" name="inExemptCountyTax" checked={data.inExemptCountyTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'IA': return (<><StateInfoBox>Iowa uses Form IA W-4. Withholding is based on allowances and any additional withholding.</StateInfoBox><Input label="IA Allowances (Total)" id="iaAllowances" name="iaAllowances" type="number" min="0" value={data.iaAllowances} onChange={handleChange} disabled={isContractor} /><Input label="IA Additional Withholding ($)" id="iaAdditionalWithholding" name="iaAdditionalWithholding" type="number" min="0" step="0.01" value={data.iaAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">IA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="iaExemptStateTax" name="iaExemptStateTax" checked={data.iaExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'KS': return (<><StateInfoBox>Kansas uses Form K-4. Withholding is based on filing status and allowances.</StateInfoBox><Select label="KS State Filing Status" id="ksFilingStatus" name="ksFilingStatus" value={data.ksFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="KS State Allowances" id="ksAllowances" name="ksAllowances" type="number" min="0" value={data.ksAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">KS Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ksExemptStateTax" name="ksExemptStateTax" checked={data.ksExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'KY': return (<><StateInfoBox>Kentucky has a flat state income tax. Local occupational taxes are also withheld based on the work location.</StateInfoBox><Input label="KY Allowances (Tax Credits)" id="kyAllowances" name="kyAllowances" type="number" min="0" value={data.kyAllowances} onChange={handleChange} disabled={isContractor} /><Input label="KY Additional Withholding ($)" id="kyAdditionalWithholding" name="kyAdditionalWithholding" type="number" min="0" step="0.01" value={data.kyAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="Work County/City (for local tax)" id="kyWorkLocation" name="kyWorkLocation" type="text" placeholder="e.g., Louisville" value={data.kyWorkLocation} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">KY Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="kyExemptStateTax" name="kyExemptStateTax" checked={data.kyExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'LA': return (<><StateInfoBox>Louisiana uses Form L-4. Withholding is based on filing status, personal allowances, and dependents.</StateInfoBox><Select label="LA State Filing Status" id="laFilingStatus" name="laFilingStatus" value={data.laFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="LA Personal Allowances" id="laAllowances" name="laAllowances" type="number" min="0" value={data.laAllowances} onChange={handleChange} disabled={isContractor} /><Input label="LA Number of Dependents" id="laDependents" name="laDependents" type="number" min="0" value={data.laDependents} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">LA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="laExemptStateTax" name="laExemptStateTax" checked={data.laExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'ME': return (<><StateInfoBox>Maine uses Form W-4ME. Withholding is based on filing status and allowances.</StateInfoBox><Select label="ME State Filing Status" id="meFilingStatus" name="meFilingStatus" value={data.meFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="ME State Allowances" id="meAllowances" name="meAllowances" type="number" min="0" value={data.meAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">ME Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="meExemptStateTax" name="meExemptStateTax" checked={data.meExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MD': return (<><StateInfoBox>Maryland uses Form MW507. Withholding is based on filing status, exemptions, and a county-level tax.</StateInfoBox><Select label="MD State Filing Status" id="mdFilingStatus" name="mdFilingStatus" value={data.mdFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married_jointly">Married (filing jointly)</option><option value="married_separately">Married (filing separately)</option><option value="head_of_household">Head of Household</option><option value="dependent">Dependent</option></Select><Input label="MD Total Exemptions" id="mdExemptions" name="mdExemptions" type="number" min="0" value={data.mdExemptions} onChange={handleChange} disabled={isContractor} /><Select label="MD County" id="mdCounty" name="mdCounty" value={data.mdCounty} onChange={handleChange} disabled={isContractor} error={errors.mdCounty}>{marylandCountyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MD Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="mdExemptStateTax" name="mdExemptStateTax" checked={data.mdExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from County Income Tax" id="mdExemptCountyTax" name="mdExemptCountyTax" checked={data.mdExemptCountyTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MA': return (<><StateInfoBox>Massachusetts uses Form M-4. Withholding is based on filing status, exemptions, and additional withholding. MA also has a Paid Family and Medical Leave (PFML) contribution.</StateInfoBox><Select label="MA State Filing Status" id="maFilingStatus" name="maFilingStatus" value={data.maFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="MA Total Exemptions" id="maExemptions" name="maExemptions" type="number" min="0" value={data.maExemptions} onChange={handleChange} disabled={isContractor} /><Input label="MA Additional Withholding ($)" id="maAdditionalWithholding" name="maAdditionalWithholding" type="number" min="0" step="0.01" value={data.maAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="maExemptStateTax" name="maExemptStateTax" checked={data.maExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Paid Family and Medical Leave (PFML)" id="maExemptPfml" name="maExemptPfml" checked={data.maExemptPfml} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MI': return (<><StateInfoBox>Michigan has a flat state tax. Withholding is adjusted by exemptions. Some cities (e.g., Detroit) also levy a city income tax based on residency.</StateInfoBox><Input label="MI Personal & Dependent Exemptions" id="miAllowances" name="miAllowances" type="number" min="0" value={data.miAllowances} onChange={handleChange} disabled={isContractor} /><Input label="MI Additional Withholding ($)" id="miAdditionalWithholding" name="miAdditionalWithholding" type="number" min="0" step="0.01" value={data.miAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="City of Residence (for local tax)" id="miCityOfResidence" name="miCityOfResidence" type="text" placeholder="e.g., Detroit, Grand Rapids" value={data.miCityOfResidence} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MI Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="miExemptStateTax" name="miExemptStateTax" checked={data.miExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MN': return (<><StateInfoBox>Minnesota uses Form W-4MN. Withholding is based on filing status and allowances.</StateInfoBox><Select label="MN State Filing Status" id="mnFilingStatus" name="mnFilingStatus" value={data.mnFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="MN State Allowances" id="mnAllowances" name="mnAllowances" type="number" min="0" value={data.mnAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MN Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="mnExemptStateTax" name="mnExemptStateTax" checked={data.mnExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MS': return (<><StateInfoBox>Mississippi uses Form 89-350. Withholding is based on filing status and total exemptions claimed.</StateInfoBox><Select label="MS State Filing Status" id="msFilingStatus" name="msFilingStatus" value={data.msFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_family">Head of Family</option></Select><Input label="MS Total Exemptions" id="msExemptions" name="msExemptions" type="number" min="0" value={data.msExemptions} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MS Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="msExemptStateTax" name="msExemptStateTax" checked={data.msExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MO': return (<><StateInfoBox>Missouri uses Form MO W-4. Withholding is based on filing status and allowances.</StateInfoBox><Select label="MO State Filing Status" id="moFilingStatus" name="moFilingStatus" value={data.moFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married_one_income">Married (one income)</option><option value="married_both_working">Married (both working)</option><option value="head_of_household">Head of Household</option></Select><Input label="MO Allowances" id="moAllowances" name="moAllowances" type="number" min="0" value={data.moAllowances} onChange={handleChange} disabled={isContractor} /><Input label="MO Additional Withholding ($)" id="moAdditionalWithholding" name="moAdditionalWithholding" type="number" min="0" step="0.01" value={data.moAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MO Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="moExemptStateTax" name="moExemptStateTax" checked={data.moExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'MT': return (<><StateInfoBox>Montana uses Form MW-4. Withholding is based on total allowances and any additional withholding.</StateInfoBox><Input label="MT Allowances" id="mtAllowances" name="mtAllowances" type="number" min="0" value={data.mtAllowances} onChange={handleChange} disabled={isContractor} /><Input label="MT Additional Withholding ($)" id="mtAdditionalWithholding" name="mtAdditionalWithholding" type="number" min="0" step="0.01" value={data.mtAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">MT Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="mtExemptStateTax" name="mtExemptStateTax" checked={data.mtExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'NE': return (<><StateInfoBox>Nebraska uses Form W-4N. Withholding is based on filing status and allowances.</StateInfoBox><Select label="NE State Filing Status" id="neFilingStatus" name="neFilingStatus" value={data.neFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="NE Allowances" id="neAllowances" name="neAllowances" type="number" min="0" value={data.neAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NE Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="neExemptStateTax" name="neExemptStateTax" checked={data.neExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'NJ': return (<><StateInfoBox>New Jersey uses Form NJ-W4 and a progressive tax system based on specific filing status letters and allowances.</StateInfoBox><Select label="NJ State Filing Status" id="stateFilingStatus" name="stateFilingStatus" value={data.stateFilingStatus} onChange={handleChange} disabled={isContractor}><option value="A">A (Single)</option><option value="B">B (Married/Civil Union, Separate)</option><option value="C">C (Married/Civil Union, Joint)</option><option value="D">D (Head of Household)</option><option value="E">E (Surviving Spouse/Civil Union)</option></Select><Input label="NJ State Allowances" id="stateAllowances" name="stateAllowances" type="number" min="0" value={data.stateAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NJ Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="njExemptStateTax" name="njExemptStateTax" checked={data.njExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from SUI/SDI (e.g., family employment)" id="njExemptSuiSdi" name="njExemptSuiSdi" checked={data.njExemptSuiSdi} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Family Leave Insurance (FLI)" id="njExemptFli" name="njExemptFli" checked={data.njExemptFli} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'NM': return (<><StateInfoBox>New Mexico uses Form FY-W-4. Withholding is based on total exemptions and any additional withholding.</StateInfoBox><Input label="NM Exemptions" id="nmExemptions" name="nmExemptions" type="number" min="0" value={data.nmExemptions} onChange={handleChange} disabled={isContractor} /><Input label="NM Additional Withholding ($)" id="nmAdditionalWithholding" name="nmAdditionalWithholding" type="number" min="0" step="0.01" value={data.nmAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NM Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="nmExemptStateTax" name="nmExemptStateTax" checked={data.nmExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'NY': return (<><StateInfoBox>New York withholding includes state tax (Form IT-2104) and potentially local tax for cities like NYC and Yonkers.</StateInfoBox><Select label="NY State Filing Status" id="nyStateFilingStatus" name="nyStateFilingStatus" value={data.nyStateFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="NY State Allowances" id="nyStateAllowances" name="nyStateAllowances" type="number" min="0" value={data.nyStateAllowances} onChange={handleChange} disabled={isContractor} /><Input label="NY Additional Withholding ($)" id="nyAdditionalWithholding" name="nyAdditionalWithholding" type="number" min="0" step="0.01" value={data.nyAdditionalWithholding} onChange={handleChange} disabled={isContractor} error={errors.nyAdditionalWithholding} /><Select label="NY Work City (for local tax)" id="nyWorkCity" name="nyWorkCity" value={data.nyWorkCity} onChange={handleChange} disabled={isContractor}><option value="none">Outside NYC / Yonkers</option><option value="nyc">New York City</option><option value="yonkers">Yonkers</option></Select><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NY Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="nyExemptStateTax" name="nyExemptStateTax" checked={data.nyExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from State Disability Insurance (NYSDI)" id="nyExemptSdi" name="nyExemptSdi" checked={data.nyExemptSdi} onChange={handleChange} disabled={isContractor} /><Checkbox label="Employee has a waiver for Paid Family Leave (PFL)" id="nyPflWaiver" name="nyPflWaiver" checked={data.nyPflWaiver} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'NC': return (<><StateInfoBox>North Carolina uses Form NC-4. Withholding is based on filing status, allowances, and any additional withholding.</StateInfoBox><Select label="NC State Filing Status" id="ncFilingStatus" name="ncFilingStatus" value={data.ncFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="NC Allowances" id="ncAllowances" name="ncAllowances" type="number" min="0" value={data.ncAllowances} onChange={handleChange} disabled={isContractor} /><Input label="NC Additional Withholding ($)" id="ncAdditionalWithholding" name="ncAdditionalWithholding" type="number" min="0" step="0.01" value={data.ncAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">NC Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ncExemptStateTax" name="ncExemptStateTax" checked={data.ncExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'ND': return (<><StateInfoBox>North Dakota uses Form NDW-R. Withholding is based on filing status and allowances.</StateInfoBox><Select label="ND State Filing Status" id="ndFilingStatus" name="ndFilingStatus" value={data.ndFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="ND Allowances" id="ndAllowances" name="ndAllowances" type="number" min="0" value={data.ndAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">ND Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ndExemptStateTax" name="ndExemptStateTax" checked={data.ndExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'OH': return (<><StateInfoBox>Ohio has a progressive state income tax. Local municipal taxes are also withheld based on the work location.</StateInfoBox><Input label="OH Allowances (Form IT 4)" id="ohAllowances" name="ohAllowances" type="number" min="0" value={data.ohAllowances} onChange={handleChange} disabled={isContractor} /><Input label="OH Additional Withholding ($)" id="ohAdditionalWithholding" name="ohAdditionalWithholding" type="number" min="0" step="0.01" value={data.ohAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><Input label="Work Municipality/City" id="ohMunicipality" name="ohMunicipality" type="text" placeholder="e.g., Columbus" value={data.ohMunicipality} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">OH Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="ohExemptStateTax" name="ohExemptStateTax" checked={data.ohExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'OK': return (<><StateInfoBox>Oklahoma uses Form OK-W-4. Withholding is based on filing status and allowances.</StateInfoBox><Select label="OK State Filing Status" id="okFilingStatus" name="okFilingStatus" value={data.okFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="OK Allowances" id="okAllowances" name="okAllowances" type="number" min="0" value={data.okAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">OK Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="okExemptStateTax" name="okExemptStateTax" checked={data.okExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'OR': return (<><StateInfoBox>Oregon uses Form OR-W-4. Withholding is based on filing status, allowances, and any additional amount requested.</StateInfoBox><Select label="OR State Filing Status" id="orFilingStatus" name="orFilingStatus" value={data.orFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="married_separately">Married Filing Separately</option></Select><Input label="OR State Allowances (Form OR-W-4)" id="orAllowances" name="orAllowances" type="number" min="0" value={data.orAllowances} onChange={handleChange} disabled={isContractor} /><Input label="OR Additional Withholding ($)" id="orAdditionalWithholding" name="orAdditionalWithholding" type="number" min="0" step="0.01" value={data.orAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">OR Tax Exemptions</h4><Checkbox label="Claim exemption from state income tax" id="orExempt" name="orExempt" checked={data.orExempt} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'PA': return (<><StateInfoBox>Pennsylvania has a flat 3.07% state income tax. Local taxes (EIT/LST) are also withheld based on PSD codes.</StateInfoBox><Input label="Residency PSD Code" id="paResidencyPsdCode" name="paResidencyPsdCode" type="text" placeholder="e.g., 880000" value={data.paResidencyPsdCode} onChange={handleChange} disabled={isContractor} /><Input label="Workplace PSD Code" id="paWorkplacePsdCode" name="paWorkplacePsdCode" type="text" placeholder="e.g., 700101" value={data.paWorkplacePsdCode} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">PA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="paExemptStateTax" name="paExemptStateTax" checked={data.paExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Local Services Tax (LST)" id="paIsExemptLST" name="paIsExemptLST" checked={data.paIsExemptLST} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'RI': return (<><StateInfoBox>Rhode Island uses Form RI W-4. Withholding is based on allowances. RI also has a mandatory Temporary Disability Insurance (TDI) contribution.</StateInfoBox><Input label="RI Allowances" id="riAllowances" name="riAllowances" type="number" min="0" value={data.riAllowances} onChange={handleChange} disabled={isContractor} /><Input label="RI Additional Withholding ($)" id="riAdditionalWithholding" name="riAdditionalWithholding" type="number" min="0" step="0.01" value={data.riAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">RI Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="riExemptStateTax" name="riExemptStateTax" checked={data.riExemptStateTax} onChange={handleChange} disabled={isContractor} /><Checkbox label="Exempt from Temporary Disability Insurance (TDI)" id="riExemptTdi" name="riExemptTdi" checked={data.riExemptTdi} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'SC': return (<><StateInfoBox>South Carolina uses Form SC W-4. Withholding is based on filing status, exemptions, and any additional withholding.</StateInfoBox><Select label="SC State Filing Status" id="scFilingStatus" name="scFilingStatus" value={data.scFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="SC Exemptions" id="scExemptions" name="scExemptions" type="number" min="0" value={data.scExemptions} onChange={handleChange} disabled={isContractor} /><Input label="SC Additional Withholding ($)" id="scAdditionalWithholding" name="scAdditionalWithholding" type="number" min="0" step="0.01" value={data.scAdditionalWithholding} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">SC Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="scExemptStateTax" name="scExemptStateTax" checked={data.scExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'UT': return (<><StateInfoBox>Utah has a flat state income tax. Withholding is based on filing status and allowances from Form TC-941.</StateInfoBox><Select label="UT State Filing Status" id="utFilingStatus" name="utFilingStatus" value={data.utFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option></Select><Input label="UT Allowances" id="utAllowances" name="utAllowances" type="number" min="0" value={data.utAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">UT Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="utExemptStateTax" name="utExemptStateTax" checked={data.utExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'VT': return (<><StateInfoBox>Vermont uses Form W-4VT. Withholding is based on filing status and allowances.</StateInfoBox><Select label="VT State Filing Status" id="vtFilingStatus" name="vtFilingStatus" value={data.vtFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married">Married</option><option value="head_of_household">Head of Household</option></Select><Input label="VT Allowances" id="vtAllowances" name="vtAllowances" type="number" min="0" value={data.vtAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">VT Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="vtExemptStateTax" name="vtExemptStateTax" checked={data.vtExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'VA': return (<><StateInfoBox>Virginia uses Form VA-4. Withholding is based on the number of personal and dependent exemptions claimed.</StateInfoBox><Input label="VA Personal Exemptions" id="vaPersonalExemptions" name="vaPersonalExemptions" type="number" min="0" value={data.vaPersonalExemptions} onChange={handleChange} disabled={isContractor} /><Input label="VA Dependent Exemptions" id="vaDependentExemptions" name="vaDependentExemptions" type="number" min="0" value={data.vaDependentExemptions} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">VA Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="vaExemptStateTax" name="vaExemptStateTax" checked={data.vaExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'WA': return (<><StateInfoBox>Washington does not have a state income tax. It does have a mandatory Paid Family and Medical Leave (PFML) premium.</StateInfoBox><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">WA Tax Exemptions</h4><Checkbox label="Exempt from Paid Family and Medical Leave (PFML)" id="waExemptPfml" name="waExemptPfml" checked={data.waExemptPfml} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'WV': return (<><StateInfoBox>West Virginia uses Form WV/IT-104. Withholding is based on the number of allowances claimed.</StateInfoBox><Input label="WV Allowances" id="wvAllowances" name="wvAllowances" type="number" min="0" value={data.wvAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-1"></div><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">WV Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="wvExemptStateTax" name="wvExemptStateTax" checked={data.wvExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        case 'WI': return (<><StateInfoBox>Wisconsin uses Form WT-4. Withholding is based on filing status and allowances.</StateInfoBox><Select label="WI State Filing Status" id="wiFilingStatus" name="wiFilingStatus" value={data.wiFilingStatus} onChange={handleChange} disabled={isContractor}><option value="single">Single</option><option value="married_joint">Married (filing jointly)</option><option value="married_separate">Married (filing separately)</option><option value="head_of_household">Head of Household</option></Select><Input label="WI Allowances" id="wiAllowances" name="wiAllowances" type="number" min="0" value={data.wiAllowances} onChange={handleChange} disabled={isContractor} /><div className="md:col-span-2 space-y-3 pt-2"><h4 className="font-semibold text-gray-600 text-sm">WI Tax Exemptions</h4><Checkbox label="Exempt from State Income Tax" id="wiExemptStateTax" name="wiExemptStateTax" checked={data.wiExemptStateTax} onChange={handleChange} disabled={isContractor} /></div></>);
        default: return null;
    }
});

export function PayrollForm({ data, onDataChange, onSubmit, suggestedTaxes, onSuggestionsChange }: PayrollFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const validate = useCallback((formData: PayrollFormData) => {
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
        if (formData.state === 'MD' && !formData.mdCounty) newErrors.mdCounty = "County is required for Maryland.";
        if (formData.state === 'NY' && formData.nyAdditionalWithholding < 0) newErrors.nyAdditionalWithholding = "Cannot be negative.";
        if (formData.state === 'CA') {
            if (formData.caEstimatedDeductions < 0) newErrors.caEstimatedDeductions = "Cannot be negative.";
            if (formData.caEstimatedNonWageIncome < 0) newErrors.caEstimatedNonWageIncome = "Cannot be negative.";
        }
        if (formData.payType === 'hourly') {
            if (formData.rate <= 0) newErrors.rate = "Hourly rate must be greater than zero.";
            if (formData.hoursWorked <= 0) newErrors.hoursWorked = "Regular hours must be greater than zero.";
            if (formData.overtimeHoursWorked < 0) newErrors.overtimeHoursWorked = "Overtime hours cannot be negative.";
            if (formData.overtimeRateMultiplier < 1) newErrors.overtimeRateMultiplier = "Multiplier must be at least 1.";
        } else if (formData.rate <= 0) newErrors.rate = "Annual salary must be greater than zero.";
        if (formData.bonus < 0) newErrors.bonus = "Bonus cannot be negative.";
        if (formData.grossPayYTD < 0) newErrors.grossPayYTD = "YTD Gross Pay cannot be negative.";
        if (formData.totalDeductionsYTD < 0) newErrors.totalDeductionsYTD = "YTD Deductions cannot be negative.";
        if (formData.netPayYTD < 0) newErrors.netPayYTD = "YTD Net Pay cannot be negative.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);
    
    useEffect(() => { validate(data); }, [data, validate]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        if (suggestedTaxes) { onSuggestionsChange(null); setSuggestionError(null); }

        const finalValue = type === 'checkbox' ? target.checked : type === 'number' ? parseFloat(value) || 0 : value;
        
        onDataChange(prevData => {
            let newData = { ...prevData, [name]: finalValue };
            if (name === 'employeeType' && value === 'contractor') {
                return { ...newData, federalFilingStatus: 'single', federalAllowances: 0, bonus: 0, employerSutaRate: 0, ...resetStateFields(initialFormData) };
            }
            if (name === 'payType') {
                return { ...newData, rate: 0, hoursWorked: value === 'hourly' ? 40 : 0, overtimeHoursWorked: 0 };
            }
            if (name === 'state') {
                return { ...newData, ...resetStateFields(initialFormData) };
            }
            return newData;
        });
    }, [suggestedTaxes, onDataChange, onSuggestionsChange]);

    const resetStateFields = (resetState: PayrollFormData) => ({
        stateFilingStatus: resetState.stateFilingStatus, stateAllowances: resetState.stateAllowances, njExemptSuiSdi: resetState.njExemptSuiSdi,
        njExemptFli: resetState.njExemptFli, njExemptStateTax: resetState.njExemptStateTax, nyStateFilingStatus: resetState.nyStateFilingStatus,
        nyStateAllowances: resetState.nyStateAllowances, nyAdditionalWithholding: resetState.nyAdditionalWithholding, nyWorkCity: resetState.nyWorkCity,
        nyPflWaiver: resetState.nyPflWaiver, nyExemptStateTax: resetState.nyExemptStateTax, nyExemptSdi: resetState.nyExemptSdi,
        inCountyOfResidence: resetState.inCountyOfResidence, inCountyOfWork: resetState.inCountyOfWork, inStateExemptions: resetState.inStateExemptions,
        inDependentExemptions: resetState.inDependentExemptions, inExemptStateTax: resetState.inExemptStateTax, inExemptCountyTax: resetState.inExemptCountyTax,
        caFilingStatus: resetState.caFilingStatus, caAllowances: resetState.caAllowances, caEstimatedDeductions: resetState.caEstimatedDeductions,
        caEstimatedNonWageIncome: resetState.caEstimatedNonWageIncome, caAdditionalWithholding: resetState.caAdditionalWithholding, caExemptStateTax: resetState.caExemptStateTax,
        caExemptSdi: resetState.caExemptSdi, orFilingStatus: resetState.orFilingStatus, orAllowances: resetState.orAllowances,
        orAdditionalWithholding: resetState.orAdditionalWithholding, orExempt: resetState.orExempt, deFilingStatus: resetState.deFilingStatus,
        deAllowances: resetState.deAllowances, deExemptStateTax: resetState.deExemptStateTax, dcFilingStatus: resetState.dcFilingStatus,
        dcAllowances: resetState.dcAllowances, dcExemptStateTax: resetState.dcExemptStateTax, alFilingStatus: resetState.alFilingStatus,
        alDependents: resetState.alDependents, alExemptStateTax: resetState.alExemptStateTax, azWithholdingRate: resetState.azWithholdingRate,
        azExemptStateTax: resetState.azExemptStateTax, arAllowances: resetState.arAllowances, arExemptStateTax: resetState.arExemptStateTax,
        gaFilingStatus: resetState.gaFilingStatus, gaDependentAllowances: resetState.gaDependentAllowances, gaAdditionalAllowances: resetState.gaAdditionalAllowances,
        gaAdditionalWithholding: resetState.gaAdditionalWithholding, gaExemptStateTax: resetState.gaExemptStateTax, ohAllowances: resetState.ohAllowances,
        ohAdditionalWithholding: resetState.ohAdditionalWithholding, ohExemptStateTax: resetState.ohExemptStateTax, ohMunicipality: resetState.ohMunicipality,
        paExemptStateTax: resetState.paExemptStateTax, paResidencyPsdCode: resetState.paResidencyPsdCode, paWorkplacePsdCode: resetState.paWorkplacePsdCode,
        paIsExemptLST: resetState.paIsExemptLST, miAllowances: resetState.miAllowances, miAdditionalWithholding: resetState.miAdditionalWithholding,
        miExemptStateTax: resetState.miExemptStateTax, miCityOfResidence: resetState.miCityOfResidence, kyAllowances: resetState.kyAllowances,
        kyAdditionalWithholding: resetState.kyAdditionalWithholding, kyExemptStateTax: resetState.kyExemptStateTax, kyWorkLocation: resetState.kyWorkLocation,
        coFilingStatus: resetState.coFilingStatus, coAllowances: resetState.coAllowances, coExemptStateTax: resetState.coExemptStateTax,
        ctWithholdingCode: resetState.ctWithholdingCode, ctExemptStateTax: resetState.ctExemptStateTax, hiFilingStatus: resetState.hiFilingStatus,
        hiAllowances: resetState.hiAllowances, hiExemptStateTax: resetState.hiExemptStateTax, idFilingStatus: resetState.idFilingStatus,
        idAllowances: resetState.idAllowances, idAdditionalWithholding: resetState.idAdditionalWithholding, idExemptStateTax: resetState.idExemptStateTax,
        ilBasicAllowances: resetState.ilBasicAllowances, ilAdditionalAllowances: resetState.ilAdditionalAllowances, ilExemptStateTax: resetState.ilExemptStateTax,
        iaAllowances: resetState.iaAllowances, iaAdditionalWithholding: resetState.iaAdditionalWithholding, iaExemptStateTax: resetState.iaExemptStateTax,
        ksFilingStatus: resetState.ksFilingStatus, ksAllowances: resetState.ksAllowances, ksExemptStateTax: resetState.ksExemptStateTax,
        laFilingStatus: resetState.laFilingStatus, laAllowances: resetState.laAllowances, laDependents: resetState.laDependents,
        laExemptStateTax: resetState.laExemptStateTax, meFilingStatus: resetState.meFilingStatus, meAllowances: resetState.meAllowances,
        meExemptStateTax: resetState.meExemptStateTax, mdFilingStatus: resetState.mdFilingStatus, mdExemptions: resetState.mdExemptions,
        mdCounty: resetState.mdCounty, mdExemptStateTax: resetState.mdExemptStateTax, mdExemptCountyTax: resetState.mdExemptCountyTax,
        maFilingStatus: resetState.maFilingStatus, maExemptions: resetState.maExemptions, maAdditionalWithholding: resetState.maAdditionalWithholding,
        maExemptStateTax: resetState.maExemptStateTax, maExemptPfml: resetState.maExemptPfml, mnFilingStatus: resetState.mnFilingStatus,
        mnAllowances: resetState.mnAllowances, mnExemptStateTax: resetState.mnExemptStateTax, msFilingStatus: resetState.msFilingStatus,
        msExemptions: resetState.msExemptions, msExemptStateTax: resetState.msExemptStateTax, moFilingStatus: resetState.moFilingStatus,
        moAllowances: resetState.moAllowances, moAdditionalWithholding: resetState.moAdditionalWithholding, moExemptStateTax: resetState.moExemptStateTax,
        mtAllowances: resetState.mtAllowances, mtAdditionalWithholding: resetState.mtAdditionalWithholding, mtExemptStateTax: resetState.mtExemptStateTax,
        neFilingStatus: resetState.neFilingStatus, neAllowances: resetState.neAllowances, neExemptStateTax: resetState.neExemptStateTax,
        nmExemptions: resetState.nmExemptions, nmAdditionalWithholding: resetState.nmAdditionalWithholding, nmExemptStateTax: resetState.nmExemptStateTax,
        ncFilingStatus: resetState.ncFilingStatus, ncAllowances: resetState.ncAllowances, ncAdditionalWithholding: resetState.ncAdditionalWithholding,
        ncExemptStateTax: resetState.ncExemptStateTax, ndFilingStatus: resetState.ndFilingStatus, ndAllowances: resetState.ndAllowances,
        ndExemptStateTax: resetState.ndExemptStateTax, okFilingStatus: resetState.okFilingStatus, okAllowances: resetState.okAllowances,
        okExemptStateTax: resetState.okExemptStateTax, riAllowances: resetState.riAllowances, riAdditionalWithholding: resetState.riAdditionalWithholding,
        riExemptStateTax: resetState.riExemptStateTax, riExemptTdi: resetState.riExemptTdi, scFilingStatus: resetState.scFilingStatus,
        scExemptions: resetState.scExemptions, scAdditionalWithholding: resetState.scAdditionalWithholding, scExemptStateTax: resetState.scExemptStateTax,
        utFilingStatus: resetState.utFilingStatus, utAllowances: resetState.utAllowances, utExemptStateTax: resetState.utExemptStateTax,
        vtFilingStatus: resetState.vtFilingStatus, vtAllowances: resetState.vtAllowances, vtExemptStateTax: resetState.vtExemptStateTax,
        vaPersonalExemptions: resetState.vaPersonalExemptions, vaDependentExemptions: resetState.vaDependentExemptions, vaExemptStateTax: resetState.vaExemptStateTax,
        waExemptPfml: resetState.waExemptPfml, wvAllowances: resetState.wvAllowances, wvExemptStateTax: resetState.wvExemptStateTax,
        wiFilingStatus: resetState.wiFilingStatus, wiAllowances: resetState.wiAllowances, wiExemptStateTax: resetState.wiExemptStateTax,
    });
    
    const handleDeductionChange = useCallback((index: number, field: string, value: string | number | boolean, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        onDataChange(prevData => {
            const updatedDeductions = [...prevData[type]];
            let updatedDeduction = { ...updatedDeductions[index], [field]: value };
            if (field === 'type' && value !== 'Other') { updatedDeduction.customName = ''; }
            updatedDeductions[index] = updatedDeduction;
            return { ...prevData, [type]: updatedDeductions };
        });
        if (type === 'preTaxDeductions' && field === 'amount' && suggestedTaxes) { onSuggestionsChange(null); }
    }, [onDataChange, suggestedTaxes, onSuggestionsChange]);

    const addDeduction = useCallback((type: 'preTaxDeductions' | 'postTaxDeductions') => {
        const newDeduction = type === 'preTaxDeductions'
            ? { type: 'Health Insurance', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' }
            : { type: 'Garnishment', customName: '', amount: 0, isRecurring: false, startDate: '', endDate: '' };
        onDataChange(prevData => ({ ...prevData, [type]: [...prevData[type], newDeduction] }));
    }, [onDataChange]);
    
    const removeDeduction = useCallback((index: number, type: 'preTaxDeductions' | 'postTaxDeductions') => {
        onDataChange(prevData => ({ ...prevData, [type]: prevData[type].filter((_, i) => i !== index) }));
    }, [onDataChange]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (validate(data)) { onSubmit(e); }
    }, [data, onSubmit, validate]);

    const handleSuggestTaxes = useCallback(async () => {
        if (data.employeeType === 'contractor') { setSuggestionError('Tax suggestions are not applicable for contractors.'); return; }
        if (data.rate <= 0 && data.bonus <= 0) { setSuggestionError('Please enter a valid rate/salary or bonus to calculate taxes.'); return; }
        setIsSuggesting(true); setSuggestionError(null); onSuggestionsChange(null);
        try {
            const taxes = await calculateTaxesOnly(data);
            onSuggestionsChange(taxes);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setSuggestionError(`Failed to suggest taxes. ${errorMessage}`);
        } finally {
            setIsSuggesting(false);
        }
    }, [data, onSuggestionsChange]);
    
    const isContractor = data.employeeType === 'contractor';
    const isFormValid = Object.keys(errors).length === 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <Section title="Worker Information">
                <Input label={isContractor ? 'Contractor Full Name' : 'Employee Full Name'} id="employeeName" name="employeeName" type="text" value={data.employeeName} onChange={handleChange} required error={errors.employeeName} />
                <Select label="Worker Type" id="employeeType" name="employeeType" value={data.employeeType} onChange={handleChange}>
                    <option value="employee">Employee (W-2)</option><option value="contractor">Contractor (1099)</option>
                </Select>
                 <Select label="State" id="state" name="state" value={data.state} onChange={handleChange}>
                    {SUPPORTED_STATES.map(state => (<option key={state.value} value={state.value}>{state.label}</option>))}
                </Select>
            </Section>

            <Section title="Pay Period & Earnings">
                <Input label="Pay Period Start Date" id="payPeriodStart" name="payPeriodStart" type="date" value={data.payPeriodStart} onChange={handleChange} required error={errors.payPeriodStart} />
                <Input label="Pay Period End Date" id="payPeriodEnd" name="payPeriodEnd" type="date" value={data.payPeriodEnd} onChange={handleChange} required error={errors.payPeriodEnd} />
                <Select label="Pay Frequency" id="payFrequency" name="payFrequency" value={data.payFrequency} onChange={handleChange}>
                    <option value="weekly">Weekly</option><option value="bi-weekly">Bi-weekly (every 2 weeks)</option>
                    <option value="semi-monthly">Semi-monthly (twice a month)</option><option value="monthly">Monthly</option>
                </Select>
                <Select label="Pay Type" id="payType" name="payType" value={data.payType} onChange={handleChange}>
                    <option value="hourly">Hourly</option><option value="salary">Salary</option>
                </Select>
                {data.payType === 'hourly' ? (
                     <>
                        <Input label="Hourly Rate ($)" id="rate" name="rate" type="number" min="0" step="0.01" value={data.rate} onChange={handleChange} required error={errors.rate} />
                        <Input label="Regular Hours Worked" id="hoursWorked" name="hoursWorked" type="number" min="0" step="0.1" value={data.hoursWorked} onChange={handleChange} required error={errors.hoursWorked}/>
                        <Input label="Overtime Hours Worked" id="overtimeHoursWorked" name="overtimeHoursWorked" type="number" min="0" step="0.1" value={data.overtimeHoursWorked} onChange={handleChange} error={errors.overtimeHoursWorked}/>
                        <Input label="Overtime Rate Multiplier" id="overtimeRateMultiplier" name="overtimeRateMultiplier" type="number" min="1" step="0.1" value={data.overtimeRateMultiplier} onChange={handleChange} error={errors.overtimeRateMultiplier}/>
                     </>
                ) : ( <Input label="Annual Salary ($)" id="rate" name="rate" type="number" min="0" step="100" value={data.rate} onChange={handleChange} required error={errors.rate}/> )}
                 <Input label="Bonus ($) (Optional)" id="bonus" name="bonus" type="number" min="0" step="0.01" value={data.bonus} onChange={handleChange} error={errors.bonus} />
            </Section>

            <Section title="Tax Withholding" info="Standard deductions are automatically factored into tax calculations based on your filing status. Adjust allowances/exemptions to fine-tune withholding for items like large itemized deductions, per your state's W-4 equivalent form.">
                <Select label="Federal Filing Status" id="federalFilingStatus" name="federalFilingStatus" value={data.federalFilingStatus} onChange={handleChange} disabled={isContractor}>
                    <option value="single">Single</option><option value="married_jointly">Married Filing Jointly</option>
                    <option value="married_separately">Married Filing Separately</option><option value="head_of_household">Head of Household</option>
                </Select>
                <Input label="Federal Allowances" id="federalAllowances" name="federalAllowances" type="number" min="0" value={data.federalAllowances} onChange={handleChange} disabled={isContractor} />
                <StateSpecificFields data={data} handleChange={handleChange} errors={errors} isContractor={isContractor} />
            </Section>
            
            {/* The rest of the form remains largely the same, but with memoized/optimized components and handlers */}

            <div className="border-t border-gray-200 pt-6 text-center">
                 <button type="button" onClick={handleSuggestTaxes} disabled={isSuggesting || isContractor} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
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
                     {Object.entries(suggestedTaxes).filter(([key, value]) => value > 0 && key.toLowerCase().includes(data.state.toLowerCase())).map(([key, value]) => {
                        const name = key.replace(/([A-Z])/g, ' $1').replace('Income Tax', 'IT').replace('State', '').trim();
                        return <Input key={key} label={`${data.state} ${name}`} value={(value || 0).toFixed(2)} readOnly disabled />;
                     })}
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
                                    <div className="flex-grow"><label htmlFor={`pre-type-${i}`} className="text-xs text-gray-600">Type</label><select id={`pre-type-${i}`} value={ded.type} onChange={e => handleDeductionChange(i, 'type', e.target.value, 'preTaxDeductions')} className="w-full form-select rounded-md border-gray-300 shadow-sm text-sm">{PRE_TAX_DEDUCTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                                    <div className="w-32"><label htmlFor={`pre-amount-${i}`} className="text-xs text-gray-600">Amount ($)</label><input id={`pre-amount-${i}`} type="number" placeholder="Amount" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'preTaxDeductions')} className="w-full form-input rounded-md border-gray-300 shadow-sm text-sm" /></div>
                                    <button type="button" onClick={() => removeDeduction(i, 'preTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1 mt-4" aria-label="Remove pre-tax deduction">&times;</button>
                                </div>
                                {ded.type === 'Other' && <div className="pl-2 animate-fade-in"><Input label="Custom Deduction Name" id={`pre-customName-${i}`} type="text" placeholder="e.g., Parking" value={ded.customName} onChange={e => handleDeductionChange(i, 'customName', e.target.value, 'preTaxDeductions')} /></div>}
                                <div className="flex items-center gap-4 pl-2"><Checkbox label="Set as Recurring" id={`pre-recurring-${i}`} checked={ded.isRecurring} onChange={e => handleDeductionChange(i, 'isRecurring', (e.target as HTMLInputElement).checked, 'preTaxDeductions')} /></div>
                                {ded.isRecurring && <div className="grid grid-cols-2 gap-2 pl-8 animate-fade-in"><Input label="Start Date (Optional)" id={`pre-start-${i}`} type="date" value={ded.startDate} onChange={e => handleDeductionChange(i, 'startDate', e.target.value, 'preTaxDeductions')}/><Input label="End Date (Optional)" id={`pre-end-${i}`} type="date" value={ded.endDate} onChange={e => handleDeductionChange(i, 'endDate', e.target.value, 'preTaxDeductions')}/></div>}
                            </div>
                        ))}
                        <button type="button" onClick={() => addDeduction('preTaxDeductions')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Pre-Tax Deduction</button>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h4 className="font-semibold text-gray-600">Post-Tax Deductions</h4>
                        {data.postTaxDeductions.map((ded, i) => (
                             <div key={i} className="space-y-2 border-t pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                <div className="flex items-start gap-2">
                                     <div className="flex-grow"><label htmlFor={`post-type-${i}`} className="text-xs text-gray-600">Type</label><select id={`post-type-${i}`} value={ded.type} onChange={e => handleDeductionChange(i, 'type', e.target.value, 'postTaxDeductions')} className="w-full form-select rounded-md border-gray-300 shadow-sm text-sm">{POST_TAX_DEDUCTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                                    <div className="w-32"><label htmlFor={`post-amount-${i}`} className="text-xs text-gray-600">Amount ($)</label><input id={`post-amount-${i}`} type="number" placeholder="Amount" value={ded.amount} onChange={e => handleDeductionChange(i, 'amount', parseFloat(e.target.value) || 0, 'postTaxDeductions')} className="w-full form-input rounded-md border-gray-300 shadow-sm text-sm" /></div>
                                    <button type="button" onClick={() => removeDeduction(i, 'postTaxDeductions')} className="text-red-500 hover:text-red-700 font-bold text-xl p-1 mt-4" aria-label="Remove post-tax deduction">&times;</button>
                                </div>
                                 {ded.type === 'Other' && <div className="pl-2 animate-fade-in"><Input label="Custom Deduction Name" id={`post-customName-${i}`} type="text" placeholder="e.g., Uniform Fee" value={ded.customName} onChange={e => handleDeductionChange(i, 'customName', e.target.value, 'postTaxDeductions')} /></div>}
                                <div className="flex items-center gap-4 pl-2"><Checkbox label="Set as Recurring" id={`post-recurring-${i}`} checked={ded.isRecurring} onChange={e => handleDeductionChange(i, 'isRecurring', (e.target as HTMLInputElement).checked, 'postTaxDeductions')} /></div>
                                {ded.isRecurring && <div className="grid grid-cols-2 gap-2 pl-8 animate-fade-in"><Input label="Start Date (Optional)" id={`post-start-${i}`} type="date" value={ded.startDate} onChange={e => handleDeductionChange(i, 'startDate', e.target.value, 'postTaxDeductions')} /><Input label="End Date (Optional)" id={`post-end-${i}`} type="date" value={ded.endDate} onChange={e => handleDeductionChange(i, 'endDate', e.target.value, 'postTaxDeductions')} /></div>}
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
                <Section title="Employer Taxes" info="These are state-level taxes paid by the employer, not deducted from the employee's pay. The most common is State Unemployment Tax (SUTA).">
                    <Input label="State Unemployment (SUTA) Rate (%)" id="employerSutaRate" name="employerSutaRate" type="number" min="0" step="0.001" value={data.employerSutaRate} onChange={handleChange} />
                </Section>
            )}

            <div className="pt-5">
                <button type="submit" disabled={!isFormValid} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Generate Final Pay Stub
                </button>
                {!isFormValid && <p className="text-center mt-2 text-sm text-red-600">Please fix the errors before submitting.</p>}
            </div>
             <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); }}`}</style>
        </form>
    );
}
