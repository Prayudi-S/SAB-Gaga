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
  id: string; // Document ID from Firestore, which is the same as UID from Auth
  uid: string; // UID from Firebase Auth
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
  recordedBy: string; // UID of petugas/admin
  recordedAt: unknown; // Firestore serverTimestamp
};
