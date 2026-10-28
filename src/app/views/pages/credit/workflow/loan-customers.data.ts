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
  { name: 'Mercy Njeri', id: 'KE-41000130', branch: 'Nakuru', amount: 800000, tenor: 6, income: 200000, obligations: 65000, employment: 'Salaried', bureau: 'Clean', facts: facts(35, 28, 24, 3, 3, 32000) },
  // Felix's additional financial and verification fields are demonstration assumptions.
  { name: 'Felix Sayia', id: 'KE-41000131', branch: 'Nairobi', amount: 400000, tenor: 12, income: 150000, obligations: 20400, employment: 'Salaried', bureau: 'Clean', facts: facts(35, 24, 18, 1, 1, 65000) },
  { name: 'John Kamau', id: 'KE-41000132', branch: 'Kiambu', amount: 250000, tenor: 12, income: 850000, obligations: 75000, employment: 'Salaried', bureau: 'Clean', facts: facts(38, 48, 36, 2, 2, 185000) },
  { name: 'Purity Naliaka', id: 'KE-41000133', branch: 'Bungoma', amount: 900000, tenor: 12, income: 300000, obligations: 65000, employment: 'Salaried', bureau: 'Clean', facts: facts(31, 30, 24, 2, 2, 72000) },
  { name: 'Hassan Abdi', id: 'KE-41000134', branch: 'Garissa', amount: 700000, tenor: 12, income: 350000, obligations: 80000, employment: 'Business owner', bureau: 'Clean', facts: facts(41, 42, 48, 3, 2, 93000) },
  { name: 'Esther Chebet', id: 'KE-41000135', branch: 'Kericho', amount: 650000, tenor: 6, income: 180000, obligations: 45000, employment: 'Self employed', bureau: 'Clean', facts: facts(33, 28, 24, 4, 3, 35000) },
  { name: 'Kevin Omondi', id: 'KE-41000136', branch: 'Kisumu', amount: 550000, tenor: 6, income: 170000, obligations: 55000, employment: 'Salaried', bureau: 'Clean', facts: facts(30, 24, 18, 3, 3, 29000) },
  { name: 'Rose Wanjiku', id: 'KE-41000137', branch: 'Nyeri', amount: 700000, tenor: 6, income: 200000, obligations: 60000, employment: 'Business owner', bureau: 'Clean', facts: facts(40, 36, 42, 4, 3, 38000) }
];
export const KENYA_LOAN_CUSTOMERS: LoanCustomer[] = rows.map((r, i) => ({ id: 'KENYA-CUSTOMER-' + (i + 1), source: 'Kenya demo profile', facts: r.facts,
  profile: { applicant: r.name, nationalId: r.id, phone: '+254700' + String(410001 + i), country: 'Kenya', branch: r.branch,
    product: 'Personal Loan', amount: r.amount, tenorMonths: r.tenor, income: r.income, obligations: r.obligations,
    employment: r.employment, bureau: r.bureau, channel: 'Mobile app' }
}));
