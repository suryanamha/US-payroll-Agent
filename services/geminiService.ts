import { GoogleGenAI, Type } from "@google/genai";
import type { PayrollFormData, PayStubData, RequiredForm } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Defines the strict JSON schema the Gemini API must follow for its response.
const payStubSchema = {
    type: Type.OBJECT,
    properties: {
        companyInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
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
                taxes: {
                    type: Type.OBJECT,
                    properties: {
                        federalIncomeTax: { type: Type.NUMBER },
                        socialSecurity: { type: Type.NUMBER },
                        medicare: { type: Type.NUMBER },
                        njStateIncomeTax: { type: Type.NUMBER },
                        njSUI: { type: Type.NUMBER },
                        njSDI: { type: Type.NUMBER },
                        njFLI: { type: Type.NUMBER },
                        nyStateIncomeTax: { type: Type.NUMBER },
                        nyDisabilityInsurance: { type: Type.NUMBER },
                        nyPaidFamilyLeave: { type: Type.NUMBER },
                        caStateIncomeTax: { type: Type.NUMBER },
                        caSDI: { type: Type.NUMBER },
                    },
                },
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


export async function calculatePayroll(formData: PayrollFormData): Promise<PayStubData> {
    const prompt = `
      Act as a payroll calculation expert for the state of ${formData.state} for the current year.
      Given the following worker and payroll information, calculate a complete pay stub or payment voucher.
      Adhere strictly to all current federal and state tax laws for the specified state.
      The pay date should be the same as the pay period end date.
      The company is "Payroll Agent" located at "123 Main St, Trenton, NJ 08608".
      Calculate all monetary values precisely to two decimal places.

      Worker Data:
      - Name: ${formData.employeeName}
      - State: ${formData.state}
      - Type: ${formData.employeeType}
      - Pay Period: ${formData.payPeriodStart} to ${formData.payPeriodEnd}
      - Pay Type: ${formData.payType}
      - Rate: $${formData.rate} ${formData.payType === 'hourly' ? '/hour' : '/year'}
      - Hours Worked: ${formData.payType === 'hourly' ? formData.hoursWorked : 'N/A (Salaried)'}
      - Federal Filing Status: ${formData.employeeType === 'employee' ? formData.federalFilingStatus : 'N/A'}
      - Federal Allowances: ${formData.employeeType === 'employee' ? formData.federalAllowances : 'N/A'}
      - NJ State Filing Status: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.stateFilingStatus : 'N/A'}
      - NJ State Allowances: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.stateAllowances : 'N/A'}
      - NJ SUI/SDI Exempt: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptSuiSdi : 'N/A'}
      - NJ FLI Exempt: ${formData.state === 'NJ' && formData.employeeType === 'employee' ? formData.njExemptFli : 'N/A'}
      - NY State Filing Status: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateFilingStatus : 'N/A'}
      - NY State Allowances: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyStateAllowances : 'N/A'}
      - NY PFL Waiver: ${formData.state === 'NY' && formData.employeeType === 'employee' ? formData.nyPflWaiver : 'N/A'}
      - CA State Filing Status: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caStateFilingStatus : 'N/A'}
      - CA State Allowances: ${formData.state === 'CA' && formData.employeeType === 'employee' ? formData.caStateAllowances : 'N/A'}
      - Pre-tax Deductions: ${JSON.stringify(formData.preTaxDeductions)}
      - Post-tax Deductions: ${JSON.stringify(formData.postTaxDeductions)}
      - Starting Gross Pay YTD: ${formData.grossPayYTD}
      - Starting Total Deductions YTD: ${formData.totalDeductionsYTD}
      - Starting Net Pay YTD: ${formData.netPayYTD}

      Instructions:
      1. Calculate Gross Pay for the current period. For salaried employees, determine the gross pay for the specified pay period.
      2. If the worker type is 'contractor', set all fields in the deductions.taxes object to 0.
      3. If the worker type is 'employee', calculate all applicable federal and state taxes based on the gross pay minus pre-tax deductions.
      4. If the state is Florida or Texas, all NJ, NY, and CA tax fields must be 0.
      5. If the state is New Jersey, all NY and CA tax fields must be 0. Calculate all applicable NJ taxes (njStateIncomeTax, njSUI, njSDI, njFLI). If 'NJ SUI/SDI Exempt' is true, set both njSUI and njSDI to 0. If 'NJ FLI Exempt' is true, set njFLI to 0.
      6. If the state is New York, all NJ and CA tax fields must be 0. Calculate all applicable NY taxes (nyStateIncomeTax, nyDisabilityInsurance, nyPaidFamilyLeave). If 'NY PFL Waiver' is true, set nyPaidFamilyLeave to 0.
      7. If the state is California, all NJ and NY tax fields must be 0. Calculate all applicable CA taxes (caStateIncomeTax, caSDI).
      8. Calculate Total Deductions by summing all pre-tax deductions, all calculated taxes, and all post-tax deductions.
      8. Calculate Net Pay (Gross Pay - Total Deductions).
      9. Calculate the new YTD values. The final 'totalEarningsYTD' should be 'Starting Gross Pay YTD' + current 'grossPay'. The final 'netPayYTD' should be 'Starting Net Pay YTD' + current 'netPay'.
      10. Return the final, complete pay stub object adhering to the provided JSON schema.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
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
    - NJ SUI/SDI Exempt: ${formData.njExemptSuiSdi}
    - NJ FLI Exempt: ${formData.njExemptFli}
    - NY PFL Waiver: ${formData.nyPflWaiver}

    Report Guidelines:
    - Check for the presence of essential information (employee/company name, pay period, earnings, deductions, net pay).
    - For employees, confirm that tax withholdings (Federal, Social Security, Medicare, and State-specific if applicable) are listed.
    - For contractors, confirm that no taxes are withheld.
    - For Florida, verify no state income tax is listed.
    - For New Jersey, verify NJ taxes are listed. If the original input data indicates the worker is exempt from SUI/SDI or FLI, confirm those specific taxes are 0 on the pay stub.
    - For New York, verify NY taxes are listed. If the original input data indicates the worker has a PFL waiver, confirm that NY Paid Family Leave is 0 on the pay stub.
    - For California, verify CA taxes (State Income Tax, SDI) are listed.
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
    1.  Identify the most common and critical forms. For an 'employee', this MUST include Form I-9, Form W-4, and the primary state tax withholding form (like NJ-W4 for New Jersey or IT-2104 for New York). For a 'contractor', the list MUST include Form W-9. Ensure the details for Form W-9 are accurate, referencing official IRS sources, with 'formId' as 'W-9', 'category' as 'Federal Tax', and 'filledBy' as 'Employee' (representing the contractor).
    2.  For each form, provide all the requested details: formName, formId, purpose, link, pdfLink, filledBy, and category.
    3.  'link' must be the URL to the official government *information page*.
    4.  'pdfLink' must be a direct link to the fillable PDF file itself. It should end with '.pdf'. If a direct PDF link cannot be found, use the information page link as a fallback.
    5.  'filledBy' indicates who is responsible for completing the form. Must be one of: 'Employee', 'Employer', or 'Both'.
    6.  'category' helps group the forms logically. Use 'Federal Onboarding' for I-9, 'Federal Tax' for W-4/W-9, and 'State Tax' or 'State Onboarding' for state-specific forms.
    7.  Ensure all links are to official government domains (e.g., irs.gov, uscis.gov, state.nj.us, tax.ny.gov, floridarevenue.com).
    8.  Return the information in a JSON array that strictly adheres to the provided schema. Do not return any extra text or explanations.
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
    return forms;
  } catch (e) {
    console.error("Failed to parse Gemini response for required forms:", response.text);
    throw new Error("Could not retrieve the list of required forms from the AI. Please try again.");
  }
}