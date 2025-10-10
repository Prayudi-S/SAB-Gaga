import type { Resident, Payment } from './types';

export const residents: Resident[] = [
  { id: 'res-001', name: 'Budi Santoso', address: 'Gg. Mawar No. 1' },
  { id: 'res-002', name: 'Siti Aminah', address: 'Gg. Melati No. 2' },
  { id: 'res-003', name: 'Ahmad Dahlan', address: 'Gg. Kenanga No. 3' },
  { id: 'res-004', name: 'Dewi Lestari', address: 'Gg. Anggrek No. 4' },
  { id: 'res-005', name: 'Joko Susilo', address: 'Gg. Kamboja No. 5' },
  { id: 'res-006', name: 'Eka Putri', address: 'Gg. Dahlia No. 6' },
  { id: 'res-007', name: 'Rahmat Hidayat', address: 'Gg. Cempaka No. 7' },
  { id: 'res-008', name: 'Indah Permata', address: 'Gg. Flamboyan No. 8' },
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

export const payments: Payment[] = [
  { id: 'pay-001', residentId: 'res-001', amount: 75000, month: currentMonth, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 1, 5).toISOString() },
  { id: 'pay-002', residentId: 'res-002', amount: 75000, month: currentMonth, year: currentYear, status: 'Unpaid' },
  { id: 'pay-003', residentId: 'res-003', amount: 75000, month: currentMonth, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 1, 8).toISOString() },
  { id: 'pay-004', residentId: 'res-004', amount: 75000, month: currentMonth, year: currentYear, status: 'Unpaid' },
  { id: 'pay-005', residentId: 'res-005', amount: 75000, month: currentMonth, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 1, 10).toISOString() },
  { id: 'pay-006', residentId: 'res-001', amount: 75000, month: currentMonth - 1, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 2, 5).toISOString() },
  { id: 'pay-007', residentId: 'res-002', amount: 75000, month: currentMonth - 1, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 2, 6).toISOString() },
  { id: 'pay-008', residentId: 'res-007', amount: 75000, month: currentMonth, year: currentYear, status: 'Unpaid' },
  { id: 'pay-009', residentId: 'res-008', amount: 75000, month: currentMonth, year: currentYear, status: 'Paid', paymentDate: new Date(currentYear, currentMonth - 1, 12).toISOString() },
  { id: 'pay-010', residentId: 'res-006', amount: 75000, month: currentMonth, year: currentYear, status: 'Unpaid' },
];
