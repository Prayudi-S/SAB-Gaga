'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { registerUserAsAdmin } from '@/firebase';

type AddUserDialogProps = {
  children: React.ReactNode;
  onUserAdded: (user: UserProfile) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function AddUserDialog({ children, onUserAdded, open, setOpen }: AddUserDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [meterId, setMeterId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setAddress('');
    setMeterId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const newUid = await registerUserAsAdmin({ email, password, name, address, meterId });

      const newUser: UserProfile = {
        id: newUid,
        uid: newUid,
        email,
        fullName: name,
        houseNumber: address,
        meterId,
        role: 'user',
      };

      onUserAdded(newUser);
      toast({ title: 'User created', description: `Akun untuk ${name} berhasil dibuat.` });
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Gagal membuat user', description: error?.message ?? 'Terjadi kesalahan', variant: 'destructive' as any });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
          <DialogDescription>Admin dapat membuat akun baru. Role akan otomatis diset ke 'user'.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meterId">ID Meter</Label>
            <Input id="meterId" value={meterId} onChange={(e) => setMeterId(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


