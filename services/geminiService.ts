


import { GoogleGenAI, Type } from "@google/genai";
import type { PayrollFormData, PayStubData, RequiredForm, CompanyInfo, Taxes } from '../types';
import { INDIANA_COUNTY_TAX_RATES } from '../data/IndianaCountyTaxRates';

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

// Helper function to safely look up Indiana county tax rates.
const getCountyRate = (countyName: string): number => {
    if (!countyName) return 0;
    const normalizedCountyName = countyName.trim().toLowerCase();
    const rate = INDIANA_COUNTY_TAX_RATES[normalizedCountyName as keyof typeof INDIANA_COUNTY_TAX_RATES];
    return rate || 0; // Return 0 if county is not found
};

const buildBasePrompt = (formData: PayrollFormData) => {
    const residenceCountyRate = getCountyRate(formData.inCountyOfResidence);
    const workCountyRate = getCountyRate(formData.inCountyOfWork);
    const otherStates = "NJ, FL, NY, IN, CA, OR, DE, DC, AL, AK, AZ, AR, GA, TX, NV, NH, SD, TN, WY".split(', ').filter(s => s !== formData.state).join(', ');

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
      Act as a payroll calculation expert for the state of ${formData.state} for the current year.
      Given the following worker and payroll information, calculate the required values.
      Adhere strictly to all current federal and state tax laws for the specified state.
      Calculate all monetary values precisely to two decimal places.

      Worker Data:
      - Name: ${formData.employeeName}
      - State: ${formData.state}
      - Type: ${formData.employeeType}
      - Pay Period End Date: ${formData.payPeriodEnd}
      - Pay Frequency: ${formData.payFrequency}
      - Pay Type: ${formData.payType}
      - Rate: $${formData.rate} ${formData.payType === 'hourly' ? '/hour' : '/year'}
      - Regular Hours Worked: ${formData.payType === 'hourly' ? formData.hoursWorked : 'N/A (Salaried)'}
      - Overtime Hours Worked: ${formData.payType === 'hourly' && formData.overtimeHoursWorked > 0 ? formData.overtimeHoursWorked : 'N/A'}
      - Overtime Rate Multiplier: ${formData.payType === 'hourly' && formData.overtimeHoursWorked > 0 ? formData.overtimeRateMultiplier : 'N/A'}
      - Bonus: $${formData.bonus > 0 ? formData.bonus : 'N/A'}
      - Federal Filing Status: ${formData.employeeType === 'employee' ? formData.federalFilingStatus : 'N/A'}
      - Federal Allowances: ${formData.employeeType === 'employee' ? formData.federalAllowances : 'N/A'}
      - NJ State Filing Status: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.stateFilingStatus : 'N/A'}
      - NJ State Allowances: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.stateAllowances : 'N/A'}
      - NJ Exempt State Tax: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptStateTax : 'N/A'}
      - NJ Exempt SUI/SDI: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptSuiSdi : 'N/A'}
      - NJ Exempt FLI: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptFli : 'N/A'}
      - NY State Filing Status: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateFilingStatus : 'N/A'}
      - NY State Allowances: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateAllowances : 'N/A'}
      - NY Additional Withholding: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyAdditionalWithholding : 'N/A'}
      - NY Exempt State Tax: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyExemptStateTax : 'N/A'}
      - NY Exempt SDI: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyExemptSdi : 'N/A'}
      - NY PFL Waiver: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyPflWaiver : 'N/A'}
      - IN County of Residence: ${formData.state === 'IN' && formData.employeeType === 'employee' ? `${formData.inCountyOfResidence} (Rate: ${residenceCountyRate})` : 'N/A'}
      - IN County of Work: ${formData.state === 'IN' && formData.employeeType === 'employee' ? `${formData.inCountyOfWork} (Rate: ${workCountyRate})` : 'N/A'}
      - IN Personal Exemptions: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inStateExemptions : 'N/A'}
      - IN Dependent Exemptions: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inDependentExemptions : 'N/A'}
      - IN Exempt State Tax: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inExemptStateTax : 'N/A'}
      - IN Exempt County Tax: ${formData.state === 'IN' && formData.employeeType === 'employee' ? formData.inExemptCountyTax : 'N/A'}
      - CA State Filing Status: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caFilingStatus : 'N/A'}
      - CA State Allowances: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caAllowances : 'N/A'}
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
      - Pre-tax Deductions: ${JSON.stringify(processedPreTaxDeductions)}
      - Post-tax Deductions: ${JSON.stringify(processedPostTaxDeductions)}
      
      Tax Calculation Guidelines (Current Year):
      - Social Security Tax: Calculate at 6.2% on gross wages up to the annual limit of $168,600.
      - Medicare Tax: Calculate at 1.45% on all gross wages. There is no wage limit.
      - Federal Income Tax: Withhold based on the employee's filing status, allowances, and the current year's federal tax brackets (progressive rates: 10%, 12%, 22%, 24%, 32%, 35%, 37%). Use the percentage method for withholding calculations.
      - State & Local Taxes: Apply the specific tax laws for ${formData.state}. Use the most current, publicly available tax tables and rules for all state-level calculations.
      - Taxable Income: For all taxes, the taxable income is the Gross Pay for the period MINUS the total of all *applicable* pre-tax deductions. This is a critical step.

      Calculation Steps:
      1.  Calculate Gross Pay for the current period. The Gross Pay is the sum of all earnings (Salary/Regular/Overtime + Bonus). If a bonus of more than $0 is provided, it MUST be added to the gross pay.
      2.  Construct the 'earnings' array based on the pay type.
          - For salaried employees, the provided rate is the annual salary; divide this by the correct number of pay periods per year to determine the salary for this period (Weekly: 52, Bi-weekly: 26, Semi-monthly: 24, Monthly: 12). The 'earnings' array should contain one object with the description 'Salary' and its calculated amount.
          - For hourly employees, calculate regular and overtime pay. The 'earnings' array must contain an object for 'Regular Pay'. If overtime hours were worked, it must also contain an object for 'Overtime Pay'. The 'rate' in the overtime earnings object should be the calculated overtime rate (regular rate * multiplier).
          - If a bonus was provided and is greater than 0, the 'earnings' array MUST also include an object for it with the description 'Bonus'. The rate and hours for a Bonus earning should be 0.
      3.  Determine which pre-tax deductions apply to this pay period based on their recurring schedule and the period end date ('${formData.payPeriodEnd}').
      4.  If the worker type is 'contractor', set all fields in the 'taxes' object to 0.
      5.  If the worker type is 'employee', calculate all applicable federal and state taxes based on the taxable income (gross pay minus applicable pre-tax deductions).
      6.  All state tax fields for states other than ${formData.state} (i.e., ${otherStates}) MUST be 0.
      7.  For New Jersey: If \`njExemptStateTax\` is true, \`njStateIncomeTax\` MUST be 0. If \`njExemptSuiSdi\` is true, \`njSUI\` and \`njSDI\` MUST be 0. If \`njExemptFli\` is true, \`njFLI\` MUST be 0.
      8.  For New York: Calculate NY state income tax, NYSDI, and NYPFL. The \`nyAdditionalWithholding\` amount should be added to the calculated state income tax. If \`nyExemptStateTax\` is true, \`nyStateIncomeTax\` MUST be 0. If \`nyPflWaiver\` is true, \`nyPaidFamilyLeave\` MUST be 0. If \`nyExemptSdi\` is true, \`nyDisabilityInsurance\` MUST be 0.
      9.  For Indiana: The rule for county tax is: use the residence county rate (${residenceCountyRate}) if available and > 0; otherwise, use the work county rate (${workCountyRate}). If both are 0, county tax is 0. If \`inExemptStateTax\` is true, \`inStateIncomeTax\` MUST be 0. If \`inExemptCountyTax\` is true, \`inCountyIncomeTax\` MUST be 0.
      10. For California: Calculate CA state income tax and SDI. Use the allowances, estimated deductions, estimated non-wage income, and additional withholding to determine the final state income tax amount. If \`caExemptStateTax\` is true, \`caStateIncomeTax\` MUST be 0. If \`caExemptSdi\` is true, \`caSDI\` MUST be 0.
      11. For Oregon: If \`orExempt\` is true, \`orStateIncomeTax\` MUST be 0.
      12. For Delaware: If \`deExemptStateTax\` is true, \`deStateIncomeTax\` MUST be 0.
      13. For District of Columbia: If \`dcExemptStateTax\` is true, \`dcStateIncomeTax\` MUST be 0.
      14. For Florida: \`flStateIncomeTax\` MUST be 0 as there is no state income tax.
      15. For Alabama: If \`alExemptStateTax\` is true, \`alStateIncomeTax\` MUST be 0.
      16. For Alaska: \`akStateIncomeTax\` MUST be 0 as there is no state income tax.
      17. For Arizona: If \`azExemptStateTax\` is true, \`azStateIncomeTax\` MUST be 0. Otherwise, calculate it based on the specified withholding rate.
      18. For Arkansas: If \`arExemptStateTax\` is true, \`arStateIncomeTax\` MUST be 0.
      19. For Georgia: If \`gaExemptStateTax\` is true, \`gaStateIncomeTax\` MUST be 0.
      20. For Texas: \`txStateIncomeTax\` MUST be 0 as there is no state income tax.
      21. For Nevada: \`nvStateIncomeTax\` MUST be 0 as there is no state income tax.
      22. For New Hampshire: \`nhStateIncomeTax\` MUST be 0 as there is no state income tax on wages.
      23. For South Dakota: \`sdStateIncomeTax\` MUST be 0 as there is no state income tax.
      24. For Tennessee: \`tnStateIncomeTax\` MUST be 0 as there is no state income tax on wages.
      25. For Wyoming: \`wyStateIncomeTax\` MUST be 0 as there is no state income tax.
    `,
        processedPreTaxDeductions,
        processedPostTaxDeductions,
    }
}


export async function calculateTaxesOnly(formData: PayrollFormData): Promise<Taxes> {
    const { prompt } = buildBasePrompt(formData);
    const finalPrompt = `
      ${prompt}
      
      Task:
      Based on the data and guidelines provided, calculate ONLY the statutory tax deductions.
      Return a single JSON object containing all the calculated tax values, adhering strictly to the provided 'taxesSchema'.
      Do not calculate any other part of the pay stub.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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


export async function calculatePayroll(formData: PayrollFormData, companyInfo: CompanyInfo): Promise<PayStubData> {
    const { prompt, processedPreTaxDeductions, processedPostTaxDeductions } = buildBasePrompt(formData);
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
      1.  Follow all the "Calculation Steps" from above.
      2.  The final \`deductions.preTax\` array in the output JSON should ONLY contain the deductions (name and amount) that were actually applied for this period.
      3.  The final \`deductions.postTax\` array in the output JSON should ONLY contain the deductions (name and amount) that were actually applied for this period.
      4.  Calculate Total Deductions by summing all *applied* pre-tax deductions, all calculated taxes, and all *applied* post-tax deductions.
      5.  Calculate Net Pay (Gross Pay - Total Deductions).
      6.  If the worker is an 'employee', calculate the Employer's SUTA contribution for this period. The formula is Gross Pay * (${formData.employerSutaRate} / 100). Place this value in the \`employerContributions.suta\` field. This amount SHOULD NOT be included in the 'totalDeductions' and SHOULD NOT affect 'netPay'. If the worker is a 'contractor' or the rate is 0, set \`employerContributions.suta\` to 0.
      7.  Calculate the new YTD values. The final 'totalEarningsYTD' should be 'Starting Gross Pay YTD' + current 'grossPay'. The final 'netPayYTD' should be 'Starting Net Pay YTD' + current 'netPay'.
      8.  Return the final, complete pay stub object adhering to the provided JSON schema.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: finalPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: payStubSchema,
        },
    });
    
    try {
        const jsonText = response.text.trim();
        const payStub = JSON.parse(jsonText);
        return payStub;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("Could not understand the payroll data from the AI. Please try again.");
    }
}


export async function checkPayStubCompliance(payStubData: PayStubData, formData: PayrollFormData): Promise<string> {
  const prompt = `
    Act as a payroll compliance expert for ${payStubData.employeeInfo.state} and the United States.
    Analyze the following JSON pay stub data and provide a brief compliance report.
    Cross-reference with the original input data provided to check for exemptions.
    Focus on whether the required information is present and if the values seem plausible for the given state.
    Do not perform calculations. Provide a high-level analysis.

    Pay Stub Data:
    ${JSON.stringify(payStubData, null, 2)}

    Original Input Data for Context:
    - State: ${formData.state}
    - NJ Exempt State Tax: ${formData.njExemptStateTax}
    - NJ SUI/SDI Exempt: ${formData.njExemptSuiSdi}
    - NJ FLI Exempt: ${formData.njExemptFli}
    - NY Exempt State Tax: ${formData.nyExemptStateTax}
    - NY Exempt SDI: ${formData.nyExemptSdi}
    - NY PFL Waiver: ${formData.nyPflWaiver}
    - IN Exempt State Tax: ${formData.inExemptStateTax}
    - IN Exempt County Tax: ${formData.inExemptCountyTax}
    - CA Exempt State Tax: ${formData.caExemptStateTax}
    - CA Exempt SDI: ${formData.caExemptSdi}
    - OR Exempt: ${formData.orExempt}
    - DE Exempt State Tax: ${formData.deExemptStateTax}
    - DC Exempt State Tax: ${formData.dcExemptStateTax}
    - AL Exempt State Tax: ${formData.alExemptStateTax}
    - AZ Exempt State Tax: ${formData.azExemptStateTax}
    - AR Exempt State Tax: ${formData.arExemptStateTax}
    - GA Exempt State Tax: ${formData.gaExemptStateTax}

    Report Guidelines:
    - Check for the presence of essential information (employee/company name, pay period, earnings, deductions, net pay).
    - For employees, confirm that tax withholdings (Federal, Social Security, Medicare, and State-specific if applicable) are listed.
    - For contractors, confirm that no taxes are withheld.
    - For New Jersey: If 'njExemptStateTax' is true, confirm 'njStateIncomeTax' is 0. If 'njExemptSuiSdi' is true, confirm 'njSUI' and 'njSDI' are 0. If 'njExemptFli' is true, confirm 'njFLI' is 0.
    - For New York: If 'nyExemptStateTax' is true, confirm 'nyStateIncomeTax' is 0. If 'nyExemptSdi' is true, confirm 'nyDisabilityInsurance' is 0. If 'nyPflWaiver' is true, confirm 'nyPaidFamilyLeave' is 0.
    - For Indiana: If 'inExemptStateTax' is true, confirm 'inStateIncomeTax' is 0. If 'inExemptCountyTax' is true, confirm 'inCountyIncomeTax' is 0.
    - For California: If 'caExemptStateTax' is true, confirm 'caStateIncomeTax' is 0. If 'caExemptSdi' is true, confirm 'caSDI' is 0.
    - For Oregon: If 'orExempt' is true, confirm 'orStateIncomeTax' is 0.
    - For Delaware: If 'deExemptStateTax' is true, confirm 'deStateIncomeTax' is 0.
    - For District of Columbia: If 'dcExemptStateTax' is true, confirm 'dcStateIncomeTax' is 0.
    - For Florida: Verify that 'flStateIncomeTax' is 0.
    - For Alabama: If 'alExemptStateTax' is true, confirm 'alStateIncomeTax' is 0.
    - For Alaska: Verify that 'akStateIncomeTax' is 0.
    - For Arizona: If 'azExemptStateTax' is true, confirm 'azStateIncomeTax' is 0.
    - For Arkansas: If 'arExemptStateTax' is true, confirm 'arStateIncomeTax' is 0.
    - For Georgia: If 'gaExemptStateTax' is true, confirm 'gaStateIncomeTax' is 0.
    - For Texas: Verify that 'txStateIncomeTax' is 0.
    - For Nevada: Verify that 'nvStateIncomeTax' is 0.
    - For New Hampshire: Verify that 'nhStateIncomeTax' is 0.
    - For South Dakota: Verify that 'sdStateIncomeTax' is 0.
    - For Tennessee: Verify that 'tnStateIncomeTax' is 0.
    - For Wyoming: Verify that 'wyStateIncomeTax' is 0.
    - Mention if the hourly rate (if applicable) is above the state minimum wage.
    - Conclude with a general statement about overall compliance based on the visible data.
    - Format the output as clean, readable text.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}

export async function getRequiredForms(formData: PayrollFormData): Promise<RequiredForm[]> {
  const prompt = `
    Act as an HR compliance expert for the United States.
    Based on the following worker information, identify the essential government forms an employer needs to have on file for payroll and tax purposes.
    Provide a list of federal and state-specific forms.

    Worker Information:
    - State: ${formData.state}
    - Worker Type: ${formData.employeeType}

    Instructions:
    1.  Identify the most common and critical forms. For an 'employee', this MUST include Form I-9, Form W-4, and the primary state tax withholding form (like NJ-W4 for New Jersey, IT-2104 for New York, WH-4 for Indiana, DE 4 for California, OR-W-4 for Oregon, W-4 DE for Delaware, D-4 for the District of Columbia, A-4 for Alabama, A-4 for Arizona, AR4EC for Arkansas, or G-4 for Georgia). For a 'contractor', the list MUST include Form W-9.
    2.  If the state is Alaska, Florida, Texas, Nevada, New Hampshire, South Dakota, Tennessee, or Wyoming which have no state income tax, do not include a state tax withholding form.
    3.  For each form, provide all the requested details: formName, formId, purpose, link, pdfLink, filledBy, and category.
    4.  'link' must be the URL to the official government *information page*.
    5.  'pdfLink' must be a direct link to the fillable PDF file itself. It should end with '.pdf'.
    6.  'filledBy' must be 'Employee', 'Employer', or 'Both'.
    7.  'category' must be one of: 'Federal Onboarding', 'State Onboarding', 'Federal Tax', 'State Tax'.
    8.  Ensure all links are to official government domains (e.g., irs.gov, uscis.gov, revenue.alabama.gov, azdor.gov, dfas.arkansas.gov, dor.georgia.gov, twc.texas.gov, etc.).
    9.  Return the information in a JSON array that strictly adheres to the provided schema. Do not return any extra text or explanations.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: requiredFormsSchema,
    },
  });

  try {
    const jsonText = response.text.trim();
    const forms = JSON.parse(jsonText);
    if (!Array.isArray(forms)) {
        console.error("API response for forms is not an array:", forms);
        throw new Error("Invalid data format for forms received from AI.");
    }
    return forms as RequiredForm[];
  } catch (e) {
    console.error("Failed to parse Gemini response for required forms:", response.text);
    throw new Error("Could not retrieve the list of required forms from the AI. Please try again.");
  }
}
