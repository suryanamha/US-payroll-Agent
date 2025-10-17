
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
  state: 'NJ' | 'FL' | 'NY' | 'IN' | 'CA' | 'OR' | 'DE' | 'DC' | 'AL' | 'AK' | 'AZ' | 'AR' | 'GA' | 'TX' | 'NV' | 'NH' | 'SD' | 'TN' | 'WY' | 'OH' | 'PA' | 'MI' | 'KY' | 'CO' | 'CT' | 'HI' | 'ID' | 'IL' | 'IA' | 'KS' | 'LA' | 'ME' | 'MD' | 'MA' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NM' | 'NC' | 'ND' | 'OK' | 'RI' | 'SC' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI';
  payPeriodStart: string;
  payPeriodEnd: string;
  payFrequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  payType: 'hourly' | 'salary';
  rate: number;
  hoursWorked: number;
  overtimeHoursWorked: number;
  overtimeRateMultiplier: number;
  bonus: number;
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
  nyAdditionalWithholding: number;
  nyWorkCity: 'nyc' | 'yonkers' | 'none';
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
  caEstimatedDeductions: number;
  caEstimatedNonWageIncome: number;
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
  // OH
  ohAllowances: number;
  ohAdditionalWithholding: number;
  ohExemptStateTax: boolean;
  ohMunicipality: string;
  // PA
  paExemptStateTax: boolean;
  paResidencyPsdCode: string;
  paWorkplacePsdCode: string;
  paIsExemptLST: boolean;
  // MI
  miAllowances: number;
  miAdditionalWithholding: number;
  miExemptStateTax: boolean;
  miCityOfResidence: string;
  // KY
  kyAllowances: number;
  kyAdditionalWithholding: number;
  kyExemptStateTax: boolean;
  kyWorkLocation: string;
  // CO
  coFilingStatus: 'single' | 'married' | 'married_single_rate';
  coAllowances: number;
  coExemptStateTax: boolean;
  // CT
  ctWithholdingCode: 'A' | 'B' | 'C' | 'D' | 'F';
  ctExemptStateTax: boolean;
  // HI
  hiFilingStatus: 'single' | 'married' | 'head_of_household';
  hiAllowances: number;
  hiExemptStateTax: boolean;
  // ID
  idFilingStatus: 'single' | 'married';
  idAllowances: number;
  idAdditionalWithholding: number;
  idExemptStateTax: boolean;
  // IL
  ilBasicAllowances: number;
  ilAdditionalAllowances: number;
  ilExemptStateTax: boolean;
  // IA
  iaAllowances: number;
  iaAdditionalWithholding: number;
  iaExemptStateTax: boolean;
  // KS
  ksFilingStatus: 'single' | 'married' | 'head_of_household';
  ksAllowances: number;
  ksExemptStateTax: boolean;
  // LA
  laFilingStatus: 'single' | 'married';
  laAllowances: number;
  laDependents: number;
  laExemptStateTax: boolean;
  // ME
  meFilingStatus: 'single' | 'married' | 'head_of_household';
  meAllowances: number;
  meExemptStateTax: boolean;
  // MD
  mdFilingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household' | 'dependent';
  mdExemptions: number;
  mdCounty: string;
  mdExemptStateTax: boolean;
  mdExemptCountyTax: boolean;
  // MA
  maFilingStatus: 'single' | 'married' | 'head_of_household';
  maExemptions: number;
  maAdditionalWithholding: number;
  maExemptStateTax: boolean;
  maExemptPfml: boolean;
  // MN
  mnFilingStatus: 'single' | 'married';
  mnAllowances: number;
  mnExemptStateTax: boolean;
  // MS
  msFilingStatus: 'single' | 'married' | 'head_of_family';
  msExemptions: number;
  msExemptStateTax: boolean;
  // MO
  moFilingStatus: 'single' | 'married_one_income' | 'married_both_working' | 'head_of_household';
  moAllowances: number;
  moAdditionalWithholding: number;
  moExemptStateTax: boolean;
  // MT
  mtAllowances: number;
  mtAdditionalWithholding: number;
  mtExemptStateTax: boolean;
  // NE
  neFilingStatus: 'single' | 'married' | 'head_of_household';
  neAllowances: number;
  neExemptStateTax: boolean;
  // NM
  nmExemptions: number;
  nmAdditionalWithholding: number;
  nmExemptStateTax: boolean;
  // NC
  ncFilingStatus: 'single' | 'married' | 'head_of_household';
  ncAllowances: number;
  ncAdditionalWithholding: number;
  ncExemptStateTax: boolean;
  // ND
  ndFilingStatus: 'single' | 'married';
  ndAllowances: number;
  ndExemptStateTax: boolean;
  // OK
  okFilingStatus: 'single' | 'married';
  okAllowances: number;
  okExemptStateTax: boolean;
  // RI
  riAllowances: number;
  riAdditionalWithholding: number;
  riExemptStateTax: boolean;
  riExemptTdi: boolean;
  // SC
  scFilingStatus: 'single' | 'married';
  scExemptions: number;
  scAdditionalWithholding: number;
  scExemptStateTax: boolean;
  // UT
  utFilingStatus: 'single' | 'married';
  utAllowances: number;
  utExemptStateTax: boolean;
  // VT
  vtFilingStatus: 'single' | 'married' | 'head_of_household';
  vtAllowances: number;
  vtExemptStateTax: boolean;
  // VA
  vaPersonalExemptions: number;
  vaDependentExemptions: number;
  vaExemptStateTax: boolean;
  // WA
  waExemptPfml: boolean;
  // WV
  wvAllowances: number;
  wvExemptStateTax: boolean;
  // WI
  wiFilingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  wiAllowances: number;
  wiExemptStateTax: boolean;
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
  flStateIncomeTax: number;
  njStateIncomeTax: number;
  njSUI: number;
  njSDI: number;
  njFLI: number;
  nyStateIncomeTax: number;
  nyLocalIncomeTax: number;
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
  txStateIncomeTax: number; // Will be 0
  nvStateIncomeTax: number; // Will be 0
  nhStateIncomeTax: number; // Will be 0
  sdStateIncomeTax: number; // Will be 0
  tnStateIncomeTax: number; // Will be 0
  wyStateIncomeTax: number; // Will be 0
  ohStateIncomeTax: number;
  ohLocalIncomeTax: number;
  paStateIncomeTax: number;
  paLocalIncomeTax: number;
  miStateIncomeTax: number;
  miLocalIncomeTax: number;
  kyStateIncomeTax: number;
  kyLocalIncomeTax: number;
  coStateIncomeTax: number;
  ctStateIncomeTax: number;
  hiStateIncomeTax: number;
  idStateIncomeTax: number;
  ilStateIncomeTax: number;
  iaStateIncomeTax: number;
  ksStateIncomeTax: number;
  laStateIncomeTax: number;
  meStateIncomeTax: number;
  mdStateIncomeTax: number;
  mdCountyIncomeTax: number;
  maStateIncomeTax: number;
  maPFML: number;
  mnStateIncomeTax: number;
  msStateIncomeTax: number;
  moStateIncomeTax: number;
  mtStateIncomeTax: number;
  neStateIncomeTax: number;
  nmStateIncomeTax: number;
  ncStateIncomeTax: number;
  ndStateIncomeTax: number;
  okStateIncomeTax: number;
  riStateIncomeTax: number;
  riTDI: number;
  scStateIncomeTax: number;
  utStateIncomeTax: number;
  vtStateIncomeTax: number;
  vaStateIncomeTax: number;
  waStateIncomeTax: number;
  waPFML: number;
  wvStateIncomeTax: number;
  wiStateIncomeTax: number;
}

export interface PayStubData {
  companyInfo: CompanyInfo;
  employeeInfo: {
    name: string;
    employeeType: 'employee' | 'contractor';
    state: 'NJ' | 'FL' | 'NY' | 'IN' | 'CA' | 'OR' | 'DE' | 'DC' | 'AL' | 'AK' | 'AZ' | 'AR' | 'GA' | 'TX' | 'NV' | 'NH' | 'SD' | 'TN' | 'WY' | 'OH' | 'PA' | 'MI' | 'KY' | 'CO' | 'CT' | 'HI' | 'ID' | 'IL' | 'IA' | 'KS' | 'LA' | 'ME' | 'MD' | 'MA' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NM' | 'NC' | 'ND' | 'OK' | 'RI' | 'SC' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI';
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
