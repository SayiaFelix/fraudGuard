import { LoanCustomer, LoanCustomerFacts } from './loan-workflow.models';

// Fictional profiles, with names and IDs independent of model calculations.
const facts = (ageYears: number, accountTenureMonths: number, employmentTenureMonths: number, activeLoans: number, activeLenders: number, averageBalance6m: number): LoanCustomerFacts => ({
  nationalIdVerified: true, kycCompleted: true, accountTenureMonths, crbDefaulter: false, crbBlacklisted: false,
  activeLoans, activeLenders, previousInstitutionDefault: false, employmentTenureMonths, ageYears, averageBalance6m
});
const rows = [
  { name: 'Brian Otieno', id: 'KE-41000123', branch: 'Nairobi', amount: 300000, tenor: 12, income: 1200000, obligations: 60000, employment: 'Salaried', bureau: 'Clean', facts: facts(34, 42, 36, 1, 1, 225000) },
  { name: 'Grace Wambui', id: 'KE-41000124', branch: 'Nakuru', amount: 600000, tenor: 12, income: 1500000, obligations: 100000, employment: 'Salaried', bureau: 'Clean', facts: facts(39, 60, 48, 2, 2, 340000) },
  { name: 'David Kiptoo', id: 'KE-41000125', branch: 'Eldoret', amount: 200000, tenor: 6, income: 950000, obligations: 45000, employment: 'Salaried', bureau: 'Clean', facts: facts(32, 30, 24, 1, 1, 168000) },
  { name: 'Amina Hassan', id: 'KE-41000126', branch: 'Mombasa', amount: 750000, tenor: 12, income: 450000, obligations: 50000, employment: 'Salaried', bureau: 'Thin file', facts: facts(30, 18, 14, 2, 2, 98000) },
  { name: 'Peter Mutua', id: 'KE-41000127', branch: 'Thika', amount: 900000, tenor: 12, income: 400000, obligations: 100000, employment: 'Business owner', bureau: 'Clean', facts: facts(43, 48, 60, 3, 2, 121000) },
  { name: 'Faith Achieng', id: 'KE-41000128', branch: 'Kisumu', amount: 400000, tenor: 6, income: 180000, obligations: 35000, employment: 'Salaried', bureau: 'Clean', facts: facts(29, 24, 18, 2, 2, 41000) },
  { name: 'Samuel Mwangi', id: 'KE-41000129', branch: 'Nairobi', amount: 600000, tenor: 6, income: 150000, obligations: 45000, employment: 'Self employed', bureau: 'Clean', facts: facts(36, 36, 30, 4, 3, 28500) },
  { name: 'Mercy Njeri', id: 'KE-41000130', branch: 'Nakuru', amount: 800000, tenor: 6, income: 200000, obligations: 65000, employment: 'Salaried', bureau: 'Clean', facts: facts(35, 28, 24, 3, 3, 32000) }
];
export const KENYA_LOAN_CUSTOMERS: LoanCustomer[] = rows.map((r, i) => ({ id: 'KENYA-CUSTOMER-' + (i + 1), source: 'Kenya demo profile', facts: r.facts,
  profile: { applicant: r.name, nationalId: r.id, phone: '+254700' + String(410001 + i), country: 'Kenya', branch: r.branch,
    product: 'Personal Loan', amount: r.amount, tenorMonths: r.tenor, income: r.income, obligations: r.obligations,
    employment: r.employment, bureau: r.bureau, channel: 'Mobile app' }
}));
