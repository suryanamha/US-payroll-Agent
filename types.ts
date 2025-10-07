

export interface CompanyInfo {
  name: string;
  address: string;
  taxId?: string;
}

export type PreTaxDeductionType = 'Health Insurance' | 'Dental Insurance' | 'Vision Insurance' | '401(k) / 403(b)' | 'HSA Contribution' | 'FSA Contribution' | 'Other';
export type PostTaxDeductionType = 'Garnishment' | 'Roth IRA' | 'Union Dues' | 'Charitable Donation' | 'Other';


export interface PayrollFormData {
  employeeName: string;
  employeeType: 'employee' | 'contractor';
  state: 'NJ' | 'FL' | 'NY' | 'IN' | 'CA' | 'OR' | 'DE' | 'DC' | 'AL' | 'AK' | 'AZ' | 'AR' | 'GA';
  payPeriodStart: string;
  payPeriodEnd: string;
  payFrequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  payType: 'hourly' | 'salary';
  rate: number;
  hoursWorked: number;
  federalFilingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
  federalAllowances: number;
  // NJ
  stateFilingStatus: 'A' | 'B' | 'C' | 'D' | 'E'; // NJ specific filing statuses
  stateAllowances: number; // NJ allowances
  njExemptSuiSdi: boolean;
  njExemptFli: boolean;
  njExemptStateTax: boolean;
  // NY
  nyStateFilingStatus: 'single' | 'married' | 'head_of_household'; // NY specific filing statuses
  nyStateAllowances: number; // NY allowances
  nyPflWaiver: boolean;
  nyExemptStateTax: boolean;
  nyExemptSdi: boolean;
  // IN
  inCountyOfResidence: string;
  inCountyOfWork: string;
  inStateExemptions: number;
  inDependentExemptions: number;
  inExemptStateTax: boolean;
  inExemptCountyTax: boolean;
  // CA
  caFilingStatus: 'single_or_married_one_income' | 'married_two_incomes' | 'head_of_household';
  caAllowances: number;
  caAdditionalWithholding: number;
  caExemptStateTax: boolean;
  caExemptSdi: boolean;
  // OR
  orFilingStatus: 'single' | 'married' | 'married_separately';
  orAllowances: number;
  orAdditionalWithholding: number;
  orExempt: boolean;
  // DE
  deFilingStatus: 'single' | 'married';
  deAllowances: number;
  deExemptStateTax: boolean;
  // DC
  dcFilingStatus: 'single_head_of_household' | 'married_jointly' | 'married_separately';
  dcAllowances: number;
  dcExemptStateTax: boolean;
  // AL
  alFilingStatus: 'single' | 'married' | 'head_of_family' | 'married_separately';
  alDependents: number;
  alExemptStateTax: boolean;
  // AZ
  azWithholdingRate: number; // Percentage
  azExemptStateTax: boolean;
  // AR
  arAllowances: number;
  arExemptStateTax: boolean;
  // GA
  gaFilingStatus: 'single' | 'married_joint_or_hoh' | 'married_separate';
  gaDependentAllowances: number;
  gaAdditionalAllowances: number;
  gaAdditionalWithholding: number;
  gaExemptStateTax: boolean;
  // Common
  preTaxDeductions: {
    type: PreTaxDeductionType;
    customName: string;
    amount: number;
    isRecurring: boolean;
    startDate: string;
    endDate: string;
  }[];
  postTaxDeductions: {
    type: PostTaxDeductionType;
    customName: string;
    amount: number;
    isRecurring: boolean;
    startDate: string;
    endDate: string;
  }[];
  grossPayYTD: number;
  totalDeductionsYTD: number;
  netPayYTD: number;
  employerSutaRate: number;
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
  inStateIncomeTax: number;
  inCountyIncomeTax: number;
  caStateIncomeTax: number;
  caSDI: number; // State Disability Insurance
  orStateIncomeTax: number;
  deStateIncomeTax: number;
  dcStateIncomeTax: number;
  alStateIncomeTax: number;
  akStateIncomeTax: number; // Will be 0
  azStateIncomeTax: number;
  arStateIncomeTax: number;
  gaStateIncomeTax: number;
}

export interface PayStubData {
  companyInfo: CompanyInfo;
  employeeInfo: {
    name: string;
    employeeType: 'employee' | 'contractor';
    state: 'NJ' | 'FL' | 'NY' | 'IN' | 'CA' | 'OR' | 'DE' | 'DC' | 'AL' | 'AK' | 'AZ' | 'AR' | 'GA';
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
  employerContributions: {
    suta: number;
  };
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