

import { GoogleGenAI, Type } from "@google/genai";
import type { PayrollFormData, PayStubData, RequiredForm, CompanyInfo, Taxes } from '../types';
import { INDIANA_COUNTY_TAX_RATES } from '../data/IndianaCountyTaxRates';
import { MARYLAND_COUNTY_TAX_RATES } from '../data/MarylandCountyTaxRates';
import { TAX_BRACKETS_2026 } from '../data/taxBrackets2026';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const taxesSchema = {
    type: Type.OBJECT,
    properties: {
        federalIncomeTax: { type: Type.NUMBER },
        socialSecurity: { type: Type.NUMBER },
        medicare: { type: Type.NUMBER },
        flStateIncomeTax: { type: Type.NUMBER },
        njStateIncomeTax: { type: Type.NUMBER },
        njSUI: { type: Type.NUMBER },
        njSDI: { type: Type.NUMBER },
        njFLI: { type: Type.NUMBER },
        nyStateIncomeTax: { type: Type.NUMBER },
        nyLocalIncomeTax: { type: Type.NUMBER },
        nyDisabilityInsurance: { type: Type.NUMBER },
        nyPaidFamilyLeave: { type: Type.NUMBER },
        inStateIncomeTax: { type: Type.NUMBER },
        inCountyIncomeTax: { type: Type.NUMBER },
        caStateIncomeTax: { type: Type.NUMBER },
        caSDI: { type: Type.NUMBER },
        orStateIncomeTax: { type: Type.NUMBER },
        deStateIncomeTax: { type: Type.NUMBER },
        dcStateIncomeTax: { type: Type.NUMBER },
        alStateIncomeTax: { type: Type.NUMBER },
        akStateIncomeTax: { type: Type.NUMBER },
        azStateIncomeTax: { type: Type.NUMBER },
        arStateIncomeTax: { type: Type.NUMBER },
        gaStateIncomeTax: { type: Type.NUMBER },
        txStateIncomeTax: { type: Type.NUMBER },
        nvStateIncomeTax: { type: Type.NUMBER },
        nhStateIncomeTax: { type: Type.NUMBER },
        sdStateIncomeTax: { type: Type.NUMBER },
        tnStateIncomeTax: { type: Type.NUMBER },
        wyStateIncomeTax: { type: Type.NUMBER },
        ohStateIncomeTax: { type: Type.NUMBER },
        ohLocalIncomeTax: { type: Type.NUMBER },
        paStateIncomeTax: { type: Type.NUMBER },
        paLocalIncomeTax: { type: Type.NUMBER },
        miStateIncomeTax: { type: Type.NUMBER },
        miLocalIncomeTax: { type: Type.NUMBER },
        kyStateIncomeTax: { type: Type.NUMBER },
        kyLocalIncomeTax: { type: Type.NUMBER },
        coStateIncomeTax: { type: Type.NUMBER },
        ctStateIncomeTax: { type: Type.NUMBER },
        hiStateIncomeTax: { type: Type.NUMBER },
        idStateIncomeTax: { type: Type.NUMBER },
        ilStateIncomeTax: { type: Type.NUMBER },
        iaStateIncomeTax: { type: Type.NUMBER },
        ksStateIncomeTax: { type: Type.NUMBER },
        laStateIncomeTax: { type: Type.NUMBER },
        meStateIncomeTax: { type: Type.NUMBER },
        mdStateIncomeTax: { type: Type.NUMBER },
        mdCountyIncomeTax: { type: Type.NUMBER },
        maStateIncomeTax: { type: Type.NUMBER },
        maPFML: { type: Type.NUMBER },
        mnStateIncomeTax: { type: Type.NUMBER },
        msStateIncomeTax: { type: Type.NUMBER },
        moStateIncomeTax: { type: Type.NUMBER },
        mtStateIncomeTax: { type: Type.NUMBER },
        neStateIncomeTax: { type: Type.NUMBER },
        nmStateIncomeTax: { type: Type.NUMBER },
        ncStateIncomeTax: { type: Type.NUMBER },
        ndStateIncomeTax: { type: Type.NUMBER },
        okStateIncomeTax: { type: Type.NUMBER },
        riStateIncomeTax: { type: Type.NUMBER },
        riTDI: { type: Type.NUMBER },
        scStateIncomeTax: { type: Type.NUMBER },
        utStateIncomeTax: { type: Type.NUMBER },
        vtStateIncomeTax: { type: Type.NUMBER },
        vaStateIncomeTax: { type: Type.NUMBER },
        waStateIncomeTax: { type: Type.NUMBER },
        waPFML: { type: Type.NUMBER },
        wvStateIncomeTax: { type: Type.NUMBER },
        wiStateIncomeTax: { type: Type.NUMBER },
    },
};

// Defines the strict JSON schema the Gemini API must follow for its response.
const payStubSchema = {
    type: Type.OBJECT,
    properties: {
        companyInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                taxId: { type: Type.STRING },
            },
        },
        employeeInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                employeeType: { type: Type.STRING },
                flsaStatus: { type: Type.STRING },
                state: { type: Type.STRING },
            },
        },
        payPeriod: {
            type: Type.OBJECT,
            properties: {
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                payDate: { type: Type.STRING },
            },
        },
        earnings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    rate: { type: Type.NUMBER },
                    hours: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                },
            },
        },
        grossPay: { type: Type.NUMBER },
        totalEarningsYTD: { type: Type.NUMBER },
        deductions: {
            type: Type.OBJECT,
            properties: {
                preTax: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } },
                    },
                },
                taxes: taxesSchema,
                postTax: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } },
                    },
                },
            },
        },
        totalDeductions: { type: Type.NUMBER },
        netPay: { type: Type.NUMBER },
        netPayYTD: { type: Type.NUMBER },
        employerContributions: {
            type: Type.OBJECT,
            properties: {
                suta: { type: Type.NUMBER }
            }
        },
    },
};

const requiredFormsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            formName: { type: Type.STRING, description: "The full name of the form, e.g., 'Employee's Withholding Certificate'" },
            formId: { type: Type.STRING, description: "The official ID of the form, e.g., 'W-4' or 'NJ-W4'" },
            purpose: { type: Type.STRING, description: "A brief, one-sentence explanation of what the form is for." },
            link: { type: Type.STRING, description: "A direct, valid URL to the official government information page for the form (e.g., irs.gov, state.nj.us)." },
            pdfLink: { type: Type.STRING, description: "A direct, valid URL to the downloadable PDF file for the form. Must end in .pdf." },
            filledBy: { type: Type.STRING, description: "Who is responsible for filling out the form. Must be 'Employee', 'Employer', or 'Both'." },
            category: { type: Type.STRING, description: "The category of the form. Must be one of: 'Federal Onboarding', 'State Onboarding', 'Federal Tax', 'State Tax'." },
        },
        required: ["formName", "formId", "purpose", "link", "pdfLink", "filledBy", "category"],
    },
};

/**
 * Loads and returns the IRS's official 2026 tax inflation adjustments.
 * Under the hood, this imports the data from a static file representing the
 * parsed data from the IRS, including amendments from the OBBB.
 * @returns The structured tax data for TY 2026.
 */
export function load2026TaxInflationAdjustments() {
  // In a real-world scenario, this could fetch from a URL, parse a file, etc.
  // Here, we return the imported static data structure.
  return TAX_BRACKETS_2026;
}


// Helper function to safely look up Indiana county tax rates.
const getIndianaCountyRate = (countyName: string): number => {
    if (!countyName) return 0;
    const normalizedCountyName = countyName.trim().toLowerCase();
    const rate = INDIANA_COUNTY_TAX_RATES[normalizedCountyName as keyof typeof INDIANA_COUNTY_TAX_RATES];
    return rate || 0; // Return 0 if county is not found
};

// Helper function to safely look up Maryland county tax rates.
const getMarylandCountyRate = (countyName: string): number => {
    if (!countyName) return 0;
    const normalizedCountyName = countyName.trim().toLowerCase();
    const rate = MARYLAND_COUNTY_TAX_RATES[normalizedCountyName as keyof typeof MARYLAND_COUNTY_TAX_RATES];
    return rate || 0;
};

const buildBasePrompt = (formData: PayrollFormData) => {
    const taxData2026 = load2026TaxInflationAdjustments();
    const taxDataString = JSON.stringify(taxData2026, null, 2);
    const residenceCountyRateIN = getIndianaCountyRate(formData.inCountyOfResidence);
    const workCountyRateIN = getIndianaCountyRate(formData.inCountyOfWork);
    const countyRateMD = getMarylandCountyRate(formData.mdCounty);
    const allStates = "AL, AK, AZ, AR, CA, CO, CT, DE, DC, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY";
    const otherStates = allStates.split(', ').filter(s => s !== formData.state).join(', ');


    // Pre-process deductions to create a simple name for the AI prompt.
    const processDeductions = (deductions: any[]) => {
        return deductions.map(d => ({
            name: d.type === 'Other' ? d.customName : d.type,
            amount: d.amount,
            isRecurring: d.isRecurring,
            startDate: d.startDate,
            endDate: d.endDate,
        }));
    };

    const processedPreTaxDeductions = processDeductions(formData.preTaxDeductions);
    const processedPostTaxDeductions = processDeductions(formData.postTaxDeductions);
    
    return {
        prompt: `
      Act as a payroll calculation expert for Tax Year 2026, operating under the new 'Omnibus Balanced Budget Bill' (OBBB) regulations for the state of ${formData.state}.
      Given the following worker and payroll information, calculate the required values.
      Adhere strictly to all 2026 federal and state tax laws for the specified state.
      Calculate all monetary values precisely to two decimal places.

      Worker Data:
      - Name: ${formData.employeeName}
      - State: ${formData.state}
      - Type: ${formData.employeeType}
      - FLSA Status: ${formData.employeeType === 'employee' ? formData.flsaStatus : 'N/A'}
      - Pay Period End Date: ${formData.payPeriodEnd}
      - Pay Frequency: ${formData.payFrequency}
      - Pay Type: ${formData.payType}
      - Rate: $${formData.rate} ${formData.payType === 'hourly' ? '/hour' : '/year'}
      - Regular Hours Worked: ${formData.payType === 'hourly' ? formData.hoursWorked : 'N/A (Salaried)'}
      - Overtime Hours Worked: ${formData.payType === 'hourly' && formData.overtimeHoursWorked > 0 ? formData.overtimeHoursWorked : 'N/A'}
      - Overtime Rate Multiplier: ${formData.payType === 'hourly' && formData.overtimeHoursWorked > 0 ? formData.overtimeRateMultiplier : 'N/A'}
      - Bonus: $${formData.bonus > 0 ? formData.bonus : 'N/A'}
      - Federal Filing Status: ${formData.employeeType === 'employee' ? formData.federalFilingStatus : 'N/A'}
      - Federal Tax Credit ($ per period): ${formData.employeeType === 'employee' ? formData.federalTaxCredit : 'N/A'}
      - NJ State Filing Status: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njFilingStatus : 'N/A'}
      - NJ State Tax Credit ($ per period): ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njTaxCredit : 'N/A'}
      - NJ Exempt State Tax: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptStateTax : 'N/A'}
      - NJ Exempt SUI/SDI: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptSuiSdi : 'N/A'}
      - NJ Exempt FLI: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptFli : 'N/A'}
      - NY State Filing Status: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateFilingStatus : 'N/A'}
      - NY State Allowances: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateAllowances : 'N/A'}
      - NY Additional Withholding: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyAdditionalWithholding : 'N/A'}
      - NY Work City: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyWorkCity : 'N/A'}
      - NY Exempt State Tax: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyExemptStateTax : 'N/A'}
      - NY Exempt SDI: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyExemptSdi : 'N/A'}
      - NY PFL Waiver: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyPflWaiver : 'N/A'}
      - IN County of Residence: ${formData.state === 'IN' && formData.employeeType === 'employee' ? `${formData.inCountyOfResidence} (Rate: ${residenceCountyRateIN})` : 'N/A'}
      - IN County of Work: ${formData.state === 'IN' && formData.employeeType === 'employee' ? `${formData.inCountyOfWork} (Rate: ${workCountyRateIN})` : 'N/A'}
      - IN Personal Exemptions: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inStateExemptions : 'N/A'}
      - IN Dependent Exemptions: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inDependentExemptions : 'N/A'}
      - IN Exempt State Tax: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inExemptStateTax : 'N/A'}
      - IN Exempt County Tax: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inExemptCountyTax : 'N/A'}
      - CA State Filing Status: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caFilingStatus : 'N/A'}
      - CA State Tax Credit ($ per period): ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caTaxCredit : 'N/A'}
      - CA Estimated Deductions: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caEstimatedDeductions : 'N/A'}
      - CA Estimated Non-Wage Income: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caEstimatedNonWageIncome : 'N/A'}
      - CA Additional Withholding: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caAdditionalWithholding : 'N/A'}
      - CA Exempt State Tax: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caExemptStateTax : 'N/A'}
      - CA Exempt SDI: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caExemptSdi : 'N/A'}
      - OR State Filing Status: ${formData.state === 'OR' && formData.employeeType === 'employee' ? formData.orFilingStatus : 'N/A'}
      - OR State Allowances: ${formData.state === 'OR' && formData.employeeType === 'employee' ? formData.orAllowances : 'N/A'}
      - OR Additional Withholding: ${formData.state === 'OR' && formData.employeeType === 'employee' ? formData.orAdditionalWithholding : 'N/A'}
      - OR Exempt: ${formData.state === 'OR' && formData.employeeType === 'employee' ? formData.orExempt : 'N/A'}
      - DE State Filing Status: ${formData.state === 'DE' && formData.employeeType === 'employee' ? formData.deFilingStatus : 'N/A'}
      - DE State Allowances: ${formData.state === 'DE' && formData.employeeType === 'employee' ? formData.deAllowances : 'N/A'}
      - DE Exempt State Tax: ${formData.state === 'DE' && formData.employeeType === 'employee' ? formData.deExemptStateTax : 'N/A'}
      - DC Filing Status: ${formData.state === 'DC' && formData.employeeType === 'employee' ? formData.dcFilingStatus : 'N/A'}
      - DC Allowances: ${formData.state === 'DC' && formData.employeeType === 'employee' ? formData.dcAllowances : 'N/A'}
      - DC Exempt State Tax: ${formData.state === 'DC' && formData.employeeType === 'employee' ? formData.dcExemptStateTax : 'N/A'}
      - AL State Filing Status: ${formData.state === 'AL' && formData.employeeType === 'employee' ? formData.alFilingStatus : 'N/A'}
      - AL Dependents: ${formData.state === 'AL' && formData.employeeType === 'employee' ? formData.alDependents : 'N/A'}
      - AL Exempt State Tax: ${formData.state === 'AL' && formData.employeeType === 'employee' ? formData.alExemptStateTax : 'N/A'}
      - AZ Withholding Rate: ${formData.state === 'AZ' && formData.employeeType === 'employee' ? formData.azWithholdingRate : 'N/A'}
      - AZ Exempt State Tax: ${formData.state === 'AZ' && formData.employeeType === 'employee' ? formData.azExemptStateTax : 'N/A'}
      - AR Allowances: ${formData.state === 'AR' && formData.employeeType === 'employee' ? formData.arAllowances : 'N/A'}
      - AR Exempt State Tax: ${formData.state === 'AR' && formData.employeeType === 'employee' ? formData.arExemptStateTax : 'N/A'}
      - GA State Filing Status: ${formData.state === 'GA' && formData.employeeType === 'employee' ? formData.gaFilingStatus : 'N/A'}
      - GA Dependent Allowances: ${formData.state === 'GA' && formData.employeeType === 'employee' ? formData.gaDependentAllowances : 'N/A'}
      - GA Additional Allowances: ${formData.state === 'GA' && formData.employeeType === 'employee' ? formData.gaAdditionalAllowances : 'N/A'}
      - GA Additional Withholding: ${formData.state === 'GA' && formData.employeeType === 'employee' ? formData.gaAdditionalWithholding : 'N/A'}
      - GA Exempt State Tax: ${formData.state === 'GA' && formData.employeeType === 'employee' ? formData.gaExemptStateTax : 'N/A'}
      - OH Allowances: ${formData.state === 'OH' && formData.employeeType === 'employee' ? formData.ohAllowances : 'N/A'}
      - OH Additional Withholding: ${formData.state === 'OH' && formData.employeeType === 'employee' ? formData.ohAdditionalWithholding : 'N/A'}
      - OH Exempt State Tax: ${formData.state === 'OH' && formData.employeeType === 'employee' ? formData.ohExemptStateTax : 'N/A'}
      - OH Municipality: ${formData.state === 'OH' && formData.employeeType === 'employee' ? formData.ohMunicipality : 'N/A'}
      - PA Exempt State Tax: ${formData.state === 'PA' && formData.employeeType === 'employee' ? formData.paExemptStateTax : 'N/A'}
      - PA Residency Municipality: ${formData.state === 'PA' && formData.employeeType === 'employee' ? formData.paResidencyMunicipality : 'N/A'}
      - PA Workplace Municipality: ${formData.state === 'PA' && formData.employeeType === 'employee' ? formData.paWorkplaceMunicipality : 'N/A'}
      - PA LST Exempt: ${formData.state === 'PA' && formData.employeeType === 'employee' ? formData.paIsExemptLST : 'N/A'}
      - MI Allowances: ${formData.state === 'MI' && formData.employeeType === 'employee' ? formData.miAllowances : 'N/A'}
      - MI Additional Withholding: ${formData.state === 'MI' && formData.employeeType === 'employee' ? formData.miAdditionalWithholding : 'N/A'}
      - MI Exempt State Tax: ${formData.state === 'MI' && formData.employeeType === 'employee' ? formData.miExemptStateTax : 'N/A'}
      - MI City of Residence: ${formData.state === 'MI' && formData.employeeType === 'employee' ? formData.miCityOfResidence : 'N/A'}
      - KY Allowances: ${formData.state === 'KY' && formData.employeeType === 'employee' ? formData.kyAllowances : 'N/A'}
      - KY Additional Withholding: ${formData.state === 'KY' && formData.employeeType === 'employee' ? formData.kyAdditionalWithholding : 'N/A'}
      - KY Exempt State Tax: ${formData.state === 'KY' && formData.employeeType === 'employee' ? formData.kyExemptStateTax : 'N/A'}
      - KY Work Location: ${formData.state === 'KY' && formData.employeeType === 'employee' ? formData.kyWorkLocation : 'N/A'}
      - CO Filing Status: ${formData.state === 'CO' && formData.employeeType === 'employee' ? formData.coFilingStatus : 'N/A'}
      - CO Allowances: ${formData.state === 'CO' && formData.employeeType === 'employee' ? formData.coAllowances : 'N/A'}
      - CO Exempt State Tax: ${formData.state === 'CO' && formData.employeeType === 'employee' ? formData.coExemptStateTax : 'N/A'}
      - CT Withholding Code: ${formData.state === 'CT' && formData.employeeType === 'employee' ? formData.ctWithholdingCode : 'N/A'}
      - CT Exempt State Tax: ${formData.state === 'CT' && formData.employeeType === 'employee' ? formData.ctExemptStateTax : 'N/A'}
      - HI Filing Status: ${formData.state === 'HI' && formData.employeeType === 'employee' ? formData.hiFilingStatus : 'N/A'}
      - HI Allowances: ${formData.state === 'HI' && formData.employeeType === 'employee' ? formData.hiAllowances : 'N/A'}
      - HI Exempt State Tax: ${formData.state === 'HI' && formData.employeeType === 'employee' ? formData.hiExemptStateTax : 'N/A'}
      - ID Filing Status: ${formData.state === 'ID' && formData.employeeType === 'employee' ? formData.idFilingStatus : 'N/A'}
      - ID Allowances: ${formData.state === 'ID' && formData.employeeType === 'employee' ? formData.idAllowances : 'N/A'}
      - ID Additional Withholding: ${formData.state === 'ID' && formData.employeeType === 'employee' ? formData.idAdditionalWithholding : 'N/A'}
      - ID Exempt State Tax: ${formData.state === 'ID' && formData.employeeType === 'employee' ? formData.idExemptStateTax : 'N/A'}
      - IL Basic Allowances: ${formData.state === 'IL' && formData.employeeType === 'employee' ? formData.ilBasicAllowances : 'N/A'}
      - IL Additional Allowances: ${formData.state === 'IL' && formData.employeeType === 'employee' ? formData.ilAdditionalAllowances : 'N/A'}
      - IL Exempt State Tax: ${formData.state === 'IL' && formData.employeeType === 'employee' ? formData.ilExemptStateTax : 'N/A'}
      - IA Allowances: ${formData.state === 'IA' && formData.employeeType === 'employee' ? formData.iaAllowances : 'N/A'}
      - IA Additional Withholding: ${formData.state === 'IA' && formData.employeeType === 'employee' ? formData.iaAdditionalWithholding : 'N/A'}
      - IA Exempt State Tax: ${formData.state === 'IA' && formData.employeeType === 'employee' ? formData.iaExemptStateTax : 'N/A'}
      - KS Filing Status: ${formData.state === 'KS' && formData.employeeType === 'employee' ? formData.ksFilingStatus : 'N/A'}
      - KS Allowances: ${formData.state === 'KS' && formData.employeeType === 'employee' ? formData.ksAllowances : 'N/A'}
      - KS Exempt State Tax: ${formData.state === 'KS' && formData.employeeType === 'employee' ? formData.ksExemptStateTax : 'N/A'}
      - LA Filing Status: ${formData.state === 'LA' && formData.employeeType === 'employee' ? formData.laFilingStatus : 'N/A'}
      - LA Allowances: ${formData.state === 'LA' && formData.employeeType === 'employee' ? formData.laAllowances : 'N/A'}
      - LA Dependents: ${formData.state === 'LA' && formData.employeeType === 'employee' ? formData.laDependents : 'N/A'}
      - LA Exempt State Tax: ${formData.state === 'LA' && formData.employeeType === 'employee' ? formData.laExemptStateTax : 'N/A'}
      - ME Filing Status: ${formData.state === 'ME' && formData.employeeType === 'employee' ? formData.meFilingStatus : 'N/A'}
      - ME Allowances: ${formData.state === 'ME' && formData.employeeType === 'employee' ? formData.meAllowances : 'N/A'}
      - ME Exempt State Tax: ${formData.state === 'ME' && formData.employeeType === 'employee' ? formData.meExemptStateTax : 'N/A'}
      - MD Filing Status: ${formData.state === 'MD' && formData.employeeType === 'employee' ? formData.mdFilingStatus : 'N/A'}
      - MD Exemptions: ${formData.state === 'MD' && formData.employeeType === 'employee' ? formData.mdExemptions : 'N/A'}
      - MD County: ${formData.state === 'MD' && formData.employeeType === 'employee' ? `${formData.mdCounty} (Rate: ${countyRateMD})` : 'N/A'}
      - MD Exempt State Tax: ${formData.state === 'MD' && formData.employeeType === 'employee' ? formData.mdExemptStateTax : 'N/A'}
      - MD Exempt County Tax: ${formData.state === 'MD' && formData.employeeType === 'employee' ? formData.mdExemptCountyTax : 'N/A'}
      - MA Filing Status: ${formData.state === 'MA' && formData.employeeType === 'employee' ? formData.maFilingStatus : 'N/A'}
      - MA Exemptions: ${formData.state === 'MA' && formData.employeeType === 'employee' ? formData.maExemptions : 'N/A'}
      - MA Additional Withholding: ${formData.state === 'MA' && formData.employeeType === 'employee' ? formData.maAdditionalWithholding : 'N/A'}
      - MA Exempt State Tax: ${formData.state === 'MA' && formData.employeeType === 'employee' ? formData.maExemptStateTax : 'N/A'}
      - MA Exempt PFML: ${formData.state === 'MA' && formData.employeeType === 'employee' ? formData.maExemptPfml : 'N/A'}
      - MN Filing Status: ${formData.state === 'MN' && formData.employeeType === 'employee' ? formData.mnFilingStatus : 'N/A'}
      - MN Allowances: ${formData.state === 'MN' && formData.employeeType === 'employee' ? formData.mnAllowances : 'N/A'}
      - MN Exempt State Tax: ${formData.state === 'MN' && formData.employeeType === 'employee' ? formData.mnExemptStateTax : 'N/A'}
      - MS Filing Status: ${formData.state === 'MS' && formData.employeeType === 'employee' ? formData.msFilingStatus : 'N/A'}
      - MS Exemptions: ${formData.state === 'MS' && formData.employeeType === 'employee' ? formData.msExemptions : 'N/A'}
      - MS Exempt State Tax: ${formData.state === 'MS' && formData.employeeType === 'employee' ? formData.msExemptStateTax : 'N/A'}
      - MO Filing Status: ${formData.state === 'MO' && formData.employeeType === 'employee' ? formData.moFilingStatus : 'N/A'}
      - MO Allowances: ${formData.state === 'MO' && formData.employeeType === 'employee' ? formData.moAllowances : 'N/A'}
      - MO Additional Withholding: ${formData.state === 'MO' && formData.employeeType === 'employee' ? formData.moAdditionalWithholding : 'N/A'}
      - MO Exempt State Tax: ${formData.state === 'MO' && formData.employeeType === 'employee' ? formData.moExemptStateTax : 'N/A'}
      - MT Allowances: ${formData.state === 'MT' && formData.employeeType === 'employee' ? formData.mtAllowances : 'N/A'}
      - MT Additional Withholding: ${formData.state === 'MT' && formData.employeeType === 'employee' ? formData.mtAdditionalWithholding : 'N/A'}
      - MT Exempt State Tax: ${formData.state === 'MT' && formData.employeeType === 'employee' ? formData.mtExemptStateTax : 'N/A'}
      - NE Filing Status: ${formData.state === 'NE' && formData.employeeType === 'employee' ? formData.neFilingStatus : 'N/A'}
      - NE Allowances: ${formData.state === 'NE' && formData.employeeType === 'employee' ? formData.neAllowances : 'N/A'}
      - NE Exempt State Tax: ${formData.state === 'NE' && formData.employeeType === 'employee' ? formData.neExemptStateTax : 'N/A'}
      - NM Exemptions: ${formData.state === 'NM' && formData.employeeType === 'employee' ? formData.nmExemptions : 'N/A'}
      - NM Additional Withholding: ${formData.state === 'NM' && formData.employeeType === 'employee' ? formData.nmAdditionalWithholding : 'N/A'}
      - NM Exempt State Tax: ${formData.state === 'NM' && formData.employeeType === 'employee' ? formData.nmExemptStateTax : 'N/A'}
      - NC Filing Status: ${formData.state === 'NC' && formData.employeeType === 'employee' ? formData.ncFilingStatus : 'N/A'}
      - NC Allowances: ${formData.state === 'NC' && formData.employeeType === 'employee' ? formData.ncAllowances : 'N/A'}
      - NC Additional Withholding: ${formData.state === 'NC' && formData.employeeType === 'employee' ? formData.ncAdditionalWithholding : 'N/A'}
      - NC Exempt State Tax: ${formData.state === 'NC' && formData.employeeType === 'employee' ? formData.ncExemptStateTax : 'N/A'}
      - ND Filing Status: ${formData.state === 'ND' && formData.employeeType === 'employee' ? formData.ndFilingStatus : 'N/A'}
      - ND Allowances: ${formData.state === 'ND' && formData.employeeType === 'employee' ? formData.ndAllowances : 'N/A'}
      - ND Exempt State Tax: ${formData.state === 'ND' && formData.employeeType === 'employee' ? formData.ndExemptStateTax : 'N/A'}
      - OK Filing Status: ${formData.state === 'OK' && formData.employeeType === 'employee' ? formData.okFilingStatus : 'N/A'}
      - OK Allowances: ${formData.state === 'OK' && formData.employeeType === 'employee' ? formData.okAllowances : 'N/A'}
      - OK Exempt State Tax: ${formData.state === 'OK' && formData.employeeType === 'employee' ? formData.okExemptStateTax : 'N/A'}
      - RI Allowances: ${formData.state === 'RI' && formData.employeeType === 'employee' ? formData.riAllowances : 'N/A'}
      - RI Additional Withholding: ${formData.state === 'RI' && formData.employeeType === 'employee' ? formData.riAdditionalWithholding : 'N/A'}
      - RI Exempt State Tax: ${formData.state === 'RI' && formData.employeeType === 'employee' ? formData.riExemptStateTax : 'N/A'}
      - RI Exempt TDI: ${formData.state === 'RI' && formData.employeeType === 'employee' ? formData.riExemptTdi : 'N/A'}
      - SC Filing Status: ${formData.state === 'SC' && formData.employeeType === 'employee' ? formData.scFilingStatus : 'N/A'}
      - SC Exemptions: ${formData.state === 'SC' && formData.employeeType === 'employee' ? formData.scExemptions : 'N/A'}
      - SC Additional Withholding: ${formData.state === 'SC' && formData.employeeType === 'employee' ? formData.scAdditionalWithholding : 'N/A'}
      - SC Exempt State Tax: ${formData.state === 'SC' && formData.employeeType === 'employee' ? formData.scExemptStateTax : 'N/A'}
      - UT Filing Status: ${formData.state === 'UT' && formData.employeeType === 'employee' ? formData.utFilingStatus : 'N/A'}
      - UT Allowances: ${formData.state === 'UT' && formData.employeeType === 'employee' ? formData.utAllowances : 'N/A'}
      - UT Exempt State Tax: ${formData.state === 'UT' && formData.employeeType === 'employee' ? formData.utExemptStateTax : 'N/A'}
      - VT Filing Status: ${formData.state === 'VT' && formData.employeeType === 'employee' ? formData.vtFilingStatus : 'N/A'}
      - VT Allowances: ${formData.state === 'VT' && formData.employeeType === 'employee' ? formData.vtAllowances : 'N/A'}
      - VT Exempt State Tax: ${formData.state === 'VT' && formData.employeeType === 'employee' ? formData.vtExemptStateTax : 'N/A'}
      - VA Personal Exemptions: ${formData.state === 'VA' && formData.employeeType === 'employee' ? formData.vaPersonalExemptions : 'N/A'}
      - VA Dependent Exemptions: ${formData.state === 'VA' && formData.employeeType === 'employee' ? formData.vaDependentExemptions : 'N/A'}
      - VA Exempt State Tax: ${formData.state === 'VA' && formData.employeeType === 'employee' ? formData.vaExemptStateTax : 'N/A'}
      - WA Exempt PFML: ${formData.state === 'WA' && formData.employeeType === 'employee' ? formData.waExemptPfml : 'N/A'}
      - WV Allowances: ${formData.state === 'WV' && formData.employeeType === 'employee' ? formData.wvAllowances : 'N/A'}
      - WV Exempt State Tax: ${formData.state === 'WV' && formData.employeeType === 'employee' ? formData.wvExemptStateTax : 'N/A'}
      - WI Filing Status: ${formData.state === 'WI' && formData.employeeType === 'employee' ? formData.wiFilingStatus : 'N/A'}
      - WI Allowances: ${formData.state === 'WI' && formData.employeeType === 'employee' ? formData.wiAllowances : 'N/A'}
      - WI Exempt State Tax: ${formData.state === 'WI' && formData.employeeType === 'employee' ? formData.wiExemptStateTax : 'N/A'}
      - Pre-tax Deductions: ${JSON.stringify(processedPreTaxDeductions)}
      - Post-tax Deductions: ${JSON.stringify(processedPostTaxDeductions)}
      
      Tax Calculation Guidelines (TY 2026 OBBB):
      - CRITICAL: You MUST use the following official IRS tax data for all federal calculations. This data overrides any internal knowledge you have about 2026 tax laws.

      Official IRS Tax Data for 2026 (OBBB):
      ${taxDataString}
      
      - IMPORTANT: If the worker type is 'contractor', all fields in the 'taxes' object (federalIncomeTax, socialSecurity, medicare, all state-specific taxes, etc.) MUST be 0. No tax should be withheld from a contractor.
      - IMPORTANT: If any state-specific exemption flag (e.g., 'njExemptStateTax', 'caExemptSdi', 'paIsExemptLST', etc.) provided in the 'Worker Data' is 'true', the corresponding tax amount MUST be calculated as 0. This rule overrides all other calculation logic for that specific tax.
      - Social Security Tax: Use the rate and wage limit from the official data provided.
      - Medicare Tax: Use the rate from the official data provided.
      - Federal Income Tax: Withhold based on the employee's filing status, the standard deduction, and the tax brackets from the official data provided. AFTER calculating the initial tax liability, SUBTRACT the \`federalTaxCredit\` amount. The final tax cannot be negative. The concept of allowances is deprecated.
      - State & Local Taxes: Apply the specific tax laws for ${formData.state} for 2026. Use the most current, publicly available tax tables and rules for all state-level calculations, keeping in mind the OBBB's simplification goals.
      - Taxable Income: For all taxes, the taxable income is the Gross Pay for the period MINUS the total of all *applicable* pre-tax deductions. This is a critical step.

      Calculation Steps:
      1.  Calculate Gross Pay for the current period. The Gross Pay is the sum of all earnings (Salary/Regular/Overtime + Bonus). If a bonus of more than $0 is provided, it MUST be added to the gross pay.
      2.  Construct the 'earnings' array based on the pay type.
          - For salaried employees, the provided rate is the annual salary; divide this by the correct number of pay periods per year to determine the salary for this period (Weekly: 52, Bi-weekly: 26, Semi-monthly: 24, Monthly: 12). The 'earnings' array should contain one object with the description 'Salary' and its calculated amount.
          - For hourly employees, calculate regular and overtime pay. The 'earnings' array must contain an object for 'Regular Pay'. If overtime hours were worked, it must also contain an object for 'Overtime Pay'. The 'rate' in the overtime earnings object should be the calculated overtime rate (regular rate * multiplier).
          - If a bonus was provided and is greater than 0, the 'earnings' array MUST also include an object for it with the description 'Bonus'. The rate and hours for a Bonus earning should be 0.
      3.  Determine which pre-tax deductions apply to this pay period based on their recurring schedule and the period end date ('${formData.payPeriodEnd}').
      4.  If the worker type is 'employee', calculate all applicable federal and state taxes based on the taxable income (gross pay minus applicable pre-tax deductions).
      5.  All state tax fields for states other than ${formData.state} (i.e., ${otherStates}) MUST be 0.
      6.  For New Jersey: Under OBBB, calculate state tax based on the simplified filing status. After calculating the initial tax, subtract the \`njTaxCredit\`. If \`njExemptStateTax\` is true, \`njStateIncomeTax\` MUST be 0. If \`njExemptSuiSdi\` is true, \`njSUI\` and \`njSDI\` MUST be 0. If \`njExemptFli\` is true, \`njFLI\` MUST be 0.
      7.  For New York: Calculate NY state income tax, NYSDI, and NYPFL. The \`nyAdditionalWithholding\` amount should be added to the calculated state income tax. Also, calculate \`nyLocalIncomeTax\` if \`nyWorkCity\` is 'nyc' (New York City) or 'yonkers'. Use the current tax rates for these cities. If \`nyWorkCity\` is 'none', the local tax MUST be 0. If \`nyExemptStateTax\` is true, \`nyStateIncomeTax\` MUST be 0. If \`nyPflWaiver\` is true, \`nyPaidFamilyLeave\` MUST be 0. If \`nyExemptSdi\` is true, \`nyDisabilityInsurance\` MUST be 0.
      8.  For Indiana: The rule for county tax is: use the residence county rate (${residenceCountyRateIN}) if available and > 0; otherwise, use the work county rate (${workCountyRateIN}). If both are 0, county tax is 0. If \`inExemptStateTax\` is true, \`inStateIncomeTax\` MUST be 0. If \`inExemptCountyTax\` is true, \`inCountyIncomeTax\` MUST be 0.
      9.  For California: Under OBBB, calculate CA state income tax based on the simplified filing status. After calculating the initial tax, subtract the \`caTaxCredit\`. Add any \`caAdditionalWithholding\`. The fields \`caEstimatedDeductions\` and \`caEstimatedNonWageIncome\` should still be used to adjust taxable income for the state calculation. If \`caExemptStateTax\` is true, \`caStateIncomeTax\` MUST be 0. If \`caExemptSdi\` is true, \`caSDI\` MUST be 0.
      10. For Pennsylvania: Under OBBB, the complex PSD codes are replaced by municipality names. \`paLocalIncomeTax\` is the sum of Local EIT and LST. You must infer the correct EIT rate based on the higher of the \`paResidencyMunicipality\` and \`paWorkplaceMunicipality\`. LST is a flat fee unless \`paIsExemptLST\` is true. If \`paExemptStateTax\` is true, \`paStateIncomeTax\` MUST be 0. It remains a flat 3.07%.
      11. For all other states, adhere to their specific 2026 rules. If a state used an allowance-based system, assume it has been updated to a tax credit system in the spirit of OBBB unless otherwise specified in their regulations.
      12. For Alabama: If \`alExemptStateTax\` is true, \`alStateIncomeTax\` MUST be 0. Otherwise, calculate state tax based on the provided filing status and number of dependents. Use this information to apply the correct standard deduction and dependent exemption amounts to determine taxable income before applying the tax rates.
      13. For Virginia: If \`vaExemptStateTax\` is true, \`vaStateIncomeTax\` MUST be 0. Otherwise, calculate Virginia state tax using the provided number of personal and dependent exemptions to determine the total exemption amount, which reduces taxable income before applying the tax brackets.
      14. For Georgia: If \`gaExemptStateTax\` is true, \`gaStateIncomeTax\` MUST be 0. Otherwise, calculate state tax using the filing status to determine the standard deduction. Then, subtract the value of dependent allowances and additional allowances to find the taxable income. The additional withholding amount should be added to the final calculated tax.
      15. For FLSA Status: If the worker's 'flsaStatus' is 'exempt', they are not eligible for overtime. 'Overtime Pay' MUST be 0, and the 'earnings' array must not contain an entry for overtime, regardless of any 'overtimeHoursWorked' provided. If 'non-exempt', calculate overtime normally.
    `,
    };
}


export async function calculateTaxesOnly(formData: PayrollFormData): Promise<Taxes> {
    const { prompt } = buildBasePrompt(formData);
    const finalPrompt = `
      ${prompt}
      
      Task:
      Based on the data and guidelines provided for TY 2026, calculate ONLY the statutory tax deductions.
      Return a single JSON object containing all the calculated tax values, adhering strictly to the provided 'taxesSchema'.
      Do not calculate any other part of the pay stub.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: finalPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: taxesSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const taxes = JSON.parse(jsonText);
        return taxes;
    } catch (e) {
        console.error("Failed to parse Gemini response for taxes:", response.text);
        throw new Error("Could not understand the tax data from the AI. Please try again.");
    }
}

// Fix: Implement the missing checkPayStubCompliance function.
export async function checkPayStubCompliance(payStubData: PayStubData, formData: PayrollFormData): Promise<string> {
  const prompt = `
    Act as a meticulous US payroll compliance auditor for Tax Year 2026 under the OBBB regulations. Your task is to perform a detailed audit of the provided pay stub data using the original form data for context. The pay period ends on ${formData.payPeriodEnd}.

    Pay Stub Data (The final calculated result):
    ${JSON.stringify(payStubData, null, 2)}

    Original Form Data (The inputs used for calculation):
    ${JSON.stringify(formData, null, 2)}

    Please perform a detailed audit focusing on the following areas. For each point, state clearly whether it is CORRECT or INCORRECT. If incorrect, you MUST provide the correct value and a brief explanation based on 2026 OBBB rules.

    1.  **Calculation Accuracy:**
        -   **Gross Pay:** Verify that the \`grossPay\` on the stub correctly sums all items in the \`earnings\` array.
        -   **Total Deductions:** Verify that the \`totalDeductions\` on the stub correctly sums all pre-tax deductions, all taxes, and all post-tax deductions.
        -   **Net Pay:** Verify that \`netPay\` is correctly calculated as \`grossPay\` - \`totalDeductions\`.

    2.  **Tax Withholding Accuracy (TY 2026 OBBB):**
        -   **Recalculate and verify EACH tax amount** based on the provided form data and 2026 federal and ${formData.state} state/local tax laws.
        -   **Federal Income Tax:** Is the amount correct for the given filing status and taxable income, after subtracting the federal tax credit?
        -   **Social Security & Medicare (FICA):** Are these calculated correctly based on the OBBB rates (6.5% SS, 1.5% Medicare) and wage limits?
        -   **State & Local Taxes:** Are all applicable taxes for ${formData.state} (including state, county, city, SDI, PFML, etc.) calculated correctly according to their 2026 regulations?

    3.  **FLSA Status Compliance:**
        -   Verify that if the employee was classified as 'exempt' (original FLSA status: ${formData.flsaStatus}), no overtime was paid. If 'non-exempt', verify overtime was calculated correctly if overtime hours were worked.

    4.  **Minimum Wage Compliance:**
        -   Calculate the effective hourly rate (total earnings / total hours worked).
        -   Verify if this rate is above the 2026 federal AND ${formData.state} state minimum wage.

    5.  **Pay Stub Information:**
        -   Does the pay stub contain all legally required information for a pay statement in ${formData.state}? (e.g., employer/employee names, pay period, gross pay, itemized deductions, net pay).

    Provide the final output as a clear, formatted report using markdown for headings and lists. Start with a summary of findings (e.g., "Compliance Check: PASSED" or "Compliance Check: FAILED with X issues found.").
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  return response.text.trim();
}

// Fix: Implement the missing getRequiredForms function.
export async function getRequiredForms(formData: PayrollFormData): Promise<RequiredForm[]> {
  const prompt = `
    Based on the worker being classified as a '${formData.employeeType}' in the state of ${formData.state} for Tax Year 2026, list all required federal and state onboarding and tax compliance forms.
    Provide direct links to the official government information page and the PDF download for each form.
    The response must be a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: requiredFormsSchema,
    },
  });

  try {
    const jsonText = response.text.trim();
    const forms = JSON.parse(jsonText);
    return forms as RequiredForm[];
  } catch (e) {
    console.error("Failed to parse Gemini response for required forms:", response.text);
    throw new Error("Could not retrieve required forms from the AI. Please try again.");
  }
}


// Fix: The function was not implemented and did not return a value.
export async function calculatePayroll(formData: PayrollFormData, companyInfo: CompanyInfo): Promise<PayStubData> {
    const { prompt } = buildBasePrompt(formData);
    const finalPrompt = `
      ${prompt}

      Company Info:
      - Name: ${companyInfo.name}
      - Address: ${companyInfo.address}
      - Tax ID (EIN): ${companyInfo.taxId || 'N/A'}

      Pay Period Info:
      - Start Date: ${formData.payPeriodStart}
      - End Date: ${formData.payPeriodEnd}
      - Pay Date should be the same as the pay period end date.

      YTD Info:
      - Starting Gross Pay YTD: ${formData.grossPayYTD}
      - Starting Total Deductions YTD: ${formData.totalDeductionsYTD}
      - Starting Net Pay YTD: ${formData.netPayYTD}

      Employer Info:
      - Employer State Unemployment (SUTA) Rate: ${formData.employeeType === 'employee' ? formData.employerSutaRate + '%' : 'N/A'}
      
      Task-Specific Instructions:
      1.  Follow all the "Calculation Steps" from above for TY 2026.
      2.  The final \`deductions.preTax\` array in the output JSON should ONLY contain the deductions (name and amount) that were actually applied for this period.
      3.  The final \`deductions.postTax\` array in the output JSON should ONLY contain the deductions (name and amount) that were actually applied for this period.
      4.  Calculate Total Deductions by summing all *applied* pre-tax deductions, all calculated taxes, and all *applied* post-tax deductions.
      5.  Calculate Net Pay (Gross Pay - Total Deductions).
      6.  If the worker is an 'employee', calculate the Employer's SUTA contribution for this period. The formula is Gross Pay * (${formData.employerSutaRate} / 100). Place this value in the \`employerContributions.suta\` field. This amount SHOULD NOT be included in the 'totalDeductions' and SHOULD NOT affect 'netPay'. If the worker is a 'contractor' or the rate is 0, set \`employerContributions.suta\` to 0.
      7.  Update the YTD values. The final \`totalEarningsYTD\` should be the starting \`grossPayYTD\` plus the current period's Gross Pay. The final \`netPayYTD\` should be the starting \`netPayYTD\` plus the current period's Net Pay.
      8.  The \`companyInfo\` in the output must match the provided company info exactly.
      9.  The \`employeeInfo\` in the output must contain the worker's name, type, state, and flsaStatus.
      10. Respond with a single, complete JSON object that strictly follows the 'payStubSchema'.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: finalPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: payStubSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const payStub = JSON.parse(jsonText);
        return payStub as PayStubData;
    } catch (e) {
        console.error("Failed to parse Gemini response for payroll:", response.text);
        throw new Error("Could not understand the payroll data from the AI. Please try again.");
    }
}