'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { MeterReading, UserProfile, OCRMeterResult, OCRError } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraCapture } from '@/components/camera-capture';
import { extractMeterData, validateOCRResult } from '@/lib/ocr-utils';
import { id as localeId } from 'date-fns/locale';
import { format } from 'date-fns';

export default function MeterRecordPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const role = profile?.role;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(0, i), 'MMMM', { locale: localeId }),
  })), []);

  // Form state
  const [residentId, setResidentId] = useState('');
  const [reading, setReading] = useState<number>(0);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const canOperate = role === 'admin' || role === 'petugas';
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (userLoading || profileLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    // Only redirect if profile exists and role is NOT allowed
    if (profile && !(role === 'admin' || role === 'petugas')) {
      router.push('/dashboard');
      return;
    }

    async function load() {
      if (!db) return;
      setLoading(true);
      try {
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const allUsers = usersSnap.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
        setUsers(allUsers);

        const readingsSnap = await getDocs(query(collection(db, 'meterReadings'), orderBy('recordedAt', 'desc')));
        const allReadings = readingsSnap.docs.map(d => ({ ...d.data(), id: d.id } as MeterReading));
        setReadings(allReadings);
      } catch (e: any) {
        console.error('Load failed', e);
        toast({ variant: 'destructive', title: 'Gagal memuat data', description: e?.message ?? 'Cek izin Firestore.' });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, userLoading, profileLoading, profile, role, db, router, toast]);

  const onCreate = async () => {
    if (!db || !user) return;
    try {
      const payload = {
        residentId: residentId.trim(),
        reading: Number(reading) || 0,
        month: Number(month),
        year: Number(year),
        recordedBy: user.uid,
        recordedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'meterReadings'), payload);
      toast({ title: 'Tercatat', description: 'Pembacaan meter berhasil disimpan.' });

      // Optimistic UI
      setReadings(prev => [{ ...payload, id: crypto.randomUUID(), recordedAt: new Date() } as any, ...prev]);
      setResidentId('');
      setReading(0);
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Gagal mencatat', description: e?.message ?? 'Periksa izin dan input.' });
    }
  };

  const onDelete = async (readingId: string) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'meterReadings', readingId));
      setReadings(prev => prev.filter(r => r.id !== readingId));
      toast({ title: 'Dihapus', description: 'Pembacaan meter dihapus.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: e?.message ?? 'Periksa izin.' });
    }
  };

  const handleOCRComplete = async (imageFile: File) => {
    setIsProcessingOCR(true);
    try {
      const result: OCRMeterResult = await extractMeterData(imageFile);
      
      // Validate OCR result
      const validation = validateOCRResult(result);
      
      if (!validation.isValid) {
        toast({
          variant: 'destructive',
          title: 'Hasil OCR Tidak Valid',
          description: validation.suggestions.join(' ')
        });
        return;
      }

      // Auto-fill form with OCR results
      setReading(result.reading);
      
      // Try to match meter ID with existing users
      const matchedUser = users.find(user => 
        user.meterId.toLowerCase() === result.meterId.toLowerCase()
      );
      
      if (matchedUser) {
        setResidentId(matchedUser.id);
        toast({
          title: 'OCR Berhasil',
          description: `Data terdeteksi: ID Meter ${result.meterId}, Pembacaan ${result.reading} m³. User otomatis dipilih.`
        });
      } else {
        toast({
          title: 'OCR Berhasil',
          description: `Data terdeteksi: ID Meter ${result.meterId}, Pembacaan ${result.reading} m³. Silakan pilih user secara manual.`
        });
      }
      
    } catch (error: any) {
      console.error('OCR Error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memproses Gambar',
        description: error.message || 'Terjadi kesalahan saat memproses gambar. Coba ambil foto lagi.'
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(u.id, (u.fullName as any) || (u as any).name || u.email || u.id));
    return map;
  }, [users]);

  if (userLoading || profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">Memuat...</div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Catat Pembacaan</CardTitle>
            <CardDescription>Admin & petugas dapat mencatat pembacaan meter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label>Resident</label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pengguna" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{(u.fullName as any) || (u as any).name || u.email || u.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label>Scan Meter Air (Opsional)</label>
              <CameraCapture 
                onCaptureComplete={handleOCRComplete}
                disabled={isProcessingOCR}
              />
              {isProcessingOCR && (
                <p className="text-sm text-blue-600">Memproses gambar dengan OCR...</p>
              )}
            </div>
            <div className="grid gap-2">
              <label>Reading (m³)</label>
              <Input type="number" value={String(reading)} onChange={e => setReading(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label>Bulan</label>
                <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label>Tahun</label>
                <Input type="number" value={String(year)} onChange={e => setYear(Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={onCreate} disabled={!residentId}>Simpan</Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembacaan</CardTitle>
            <CardDescription>Terbaru di atas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Reading</TableHead>
                    <TableHead>Recorded On</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.length === 0 ? (
                    <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center">Belum ada data</TableCell></TableRow>
                  ) : (
                    readings.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{userMap.get(r.residentId) || r.residentId}</TableCell>
                        <TableCell>{months.find(m => m.value === r.month)?.label} {r.year}</TableCell>
                        <TableCell>{r.reading}</TableCell>
                        <TableCell>{(r as any).recordedAt?.seconds ? format(new Date((r as any).recordedAt.seconds * 1000), 'dd MMM yyyy, HH:mm', { locale: localeId }) : 'Baru saja'}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>Hapus</Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


