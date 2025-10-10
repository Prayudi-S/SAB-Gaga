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
};
