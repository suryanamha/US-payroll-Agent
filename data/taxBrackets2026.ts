/**
 * Official Tax Year 2026 Inflation Adjustments as per the 'One, Big, Beautiful Bill' (OBBB).
 * This data is used to provide the AI model with the exact tax tables for calculations,
 * ensuring accuracy and compliance with the latest fictional regulations.
 * Source: IRS Publication 2026-OBBB
 */
export const TAX_BRACKETS_2026 = {
  source: "IRS Publication 2026-OBBB (One, Big, Beautiful Bill)",
  federal: {
    // The OBBB simplifies the tax brackets to three tiers.
    taxBrackets: {
      single: [
        { rate: 0.12, from: 0, to: 49500 },
        { rate: 0.22, from: 49501, to: 210000 },
        { rate: 0.25, from: 210001, to: Infinity },
      ],
      married: [
        { rate: 0.12, from: 0, to: 99000 },
        { rate: 0.22, from: 99001, to: 420000 },
        { rate: 0.25, from: 420001, to: Infinity },
      ],
      head_of_household: [
        { rate: 0.12, from: 0, to: 71000 },
        { rate: 0.22, from: 71001, to: 280000 },
        { rate: 0.25, from: 280001, to: Infinity },
      ],
    },
    // Standard deductions were increased under the OBBB.
    standardDeduction: {
      single: 15700,
      married: 31400,
      head_of_household: 23550,
    },
  },
  // FICA tax rates were amended by the OBBB.
  fica: {
    socialSecurity: {
      rate: 0.065, // 6.5%
      wageLimit: 185000,
    },
    medicare: {
      rate: 0.015, // 1.5%
      wageLimit: null, // No wage limit
    },
  },
};
