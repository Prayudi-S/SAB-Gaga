'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { Droplets } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  houseNumber: z.string().min(1, 'House number is required.'),
  meterId: z.string().min(1, 'Water meter ID is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type RegisterFormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      houseNumber: '',
      meterId: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'Firebase not initialized. Please try again later.',
      });
      return;
    }
    
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Prepare user profile data for Firestore
      const userProfile = {
        uid: user.uid,
        email: data.email,
        fullName: data.fullName,
        houseNumber: data.houseNumber,
        meterId: data.meterId,
        role: 'user', // Default role for new users
      };

      // 3. Save user profile to Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      setDoc(userDocRef, userProfile).catch((serverError) => {
         const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: userProfile,
          });
          errorEmitter.emit('permission-error', permissionError);
      });

      toast({
        title: 'Registration Successful',
        description: "You've been successfully registered. Redirecting to dashboard...",
        className: 'bg-green-100 border-green-300 text-green-900'
      });

      router.push('/dashboard');

    } catch (error: any) {
       // Handle Auth errors (e.g., email-already-in-use)
       if (error.code && error.code.startsWith('auth/')) {
         toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: error.message,
          });
       } else {
         console.error("An unexpected error occurred during registration: ", error)
         toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: "An unexpected error occurred. Please check the console.",
          });
       }
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary rounded-full p-4">
            <Droplets className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
            <CardDescription>
              Enter your details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>House Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. B2/10" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="meterId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Customer ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 123456" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full !mt-6" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
