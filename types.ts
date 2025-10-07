export interface PayrollFormData {
  employeeName: string;
  employeeType: 'employee' | 'contractor';
  state: 'NJ' | 'FL' | 'NY' | 'CA' | 'TX';
  payPeriodStart: string;
  payPeriodEnd: string;
  payType: 'hourly' | 'salary';
  rate: number;
  hoursWorked: number;
  federalFilingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
  stateFilingStatus: 'A' | 'B' | 'C' | 'D' | 'E'; // NJ specific filing statuses
  nyStateFilingStatus: 'single' | 'married' | 'head_of_household'; // NY specific filing statuses
  caStateFilingStatus: 'single' | 'married' | 'head_of_household'; // CA specific filing statuses
  federalAllowances: number;
  stateAllowances: number; // NJ allowances
  nyStateAllowances: number; // NY allowances
  caStateAllowances: number; // CA allowances
  njExemptSuiSdi: boolean;
  njExemptFli: boolean;
  nyPflWaiver: boolean;
  preTaxDeductions: { name: string; amount: number }[];
  postTaxDeductions: { name: string; amount: number }[];
  grossPayYTD: number;
  totalDeductionsYTD: number;
  netPayYTD: number;
}

export interface Taxes {
  federalIncomeTax: number;
  socialSecurity: number;
  medicare: number;
  njStateIncomeTax: number;
  njSUI: number;
  njSDI: number;
  njFLI: number;
  nyStateIncomeTax: number;
  nyDisabilityInsurance: number; // NYSDI
  nyPaidFamilyLeave: number; // NYPFL
  caStateIncomeTax: number;
  caSDI: number;
}

export interface PayStubData {
  companyInfo: {
    name: string;
    address: string;
  };
  employeeInfo: {
    name: string;
    employeeType: 'employee' | 'contractor';
    state: 'NJ' | 'FL' | 'NY' | 'CA' | 'TX';
  };
  payPeriod: {
    startDate: string;
    endDate: string;
    payDate: string;
  };
  earnings: {
    description: string;
    rate: number;
    hours: number;
    amount: number;
  }[];
  grossPay: number;
  totalEarningsYTD: number;
  deductions: {
    preTax: { name: string; amount: number }[];
    taxes: Taxes;
    postTax: { name: string; amount: number }[];
  };
  totalDeductions: number;
  netPay: number;
  netPayYTD: number;
}

export interface RequiredForm {
  formName: string;
  formId: string;
  purpose: string;
  link: string; // Official info page
  pdfLink: string; // Direct PDF link if available
  filledBy: 'Employee' | 'Employer' | 'Both';
  category: 'Federal Onboarding' | 'State Onboarding' | 'Federal Tax' | 'State Tax';
}
