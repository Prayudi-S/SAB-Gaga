'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(error); // We still log the full error for debugging
      
      // Throw the error in dev to make it visible in the Next.js overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
      
      // Show a generic toast in production
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'You do not have permission to perform this action.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
