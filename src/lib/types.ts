export type Resident = {
  id: string;
  name: string;
  address: string;
};

export type Payment = {
  id: string;
  residentId: string;
  amount: number;
  month: number;
  year: number;
  status: 'Paid' | 'Unpaid';
  paymentDate?: string;
  meterReadingId?: string;
};

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  houseNumber: string;
  meterId: string;
  role: 'admin' | 'petugas' | 'user';
};

export type MeterReading = {
  id: string;
  residentId: string;
  reading: number;
  month: number;
  year: number;
  recordedBy: string;
  recordedAt: unknown; // Firestore serverTimestamp
};
