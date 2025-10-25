'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCaptureComplete: (imageFile: File) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCaptureComplete, disabled = false }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          variant: 'destructive',
          title: 'Akses Kamera Ditolak',
          description: 'Izinkan akses kamera untuk mengambil foto meter air.'
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          variant: 'destructive',
          title: 'Kamera Tidak Ditemukan',
          description: 'Tidak ada kamera yang tersedia di perangkat ini.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Kamera',
          description: 'Gagal mengakses kamera. Pastikan perangkat mendukung kamera.'
        });
      }
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'meter-photo.jpg', { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      // Convert image URL back to file
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'meter-photo.jpg', { type: 'image/jpeg' });
          setIsProcessing(true);
          onCaptureComplete(file);
          setIsOpen(false);
          setCapturedImage(null);
          setIsProcessing(false);
        });
    }
  }, [capturedImage, onCaptureComplete]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopCamera();
      setCapturedImage(null);
    }
  }, [stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled}
          className="w-full"
        >
          <Camera className="w-4 h-4 mr-2" />
          Ambil Foto dari Kamera
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ambil Foto Meter Air</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke meter air dan pastikan angka pembacaan dan ID meter terlihat jelas.
          </DialogDescription>
        </DialogHeader>
        
        <Card className="mt-4">
          <CardContent className="p-4">
            {!capturedImage ? (
              <div className="space-y-4">
                {!isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Klik tombol di bawah untuk memulai kamera</p>
                    <Button onClick={startCamera} disabled={isProcessing}>
                      {isProcessing ? 'Memproses...' : 'Mulai Kamera'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover rounded-lg"
                        playsInline
                        muted
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto} size="lg">
                        <Camera className="w-4 h-4 mr-2" />
                        Ambil Foto
                      </Button>
                      <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured meter"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={confirmPhoto} size="lg" disabled={isProcessing}>
                    <Check className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Memproses...' : 'Gunakan Foto Ini'}
                  </Button>
                  <Button variant="outline" onClick={retakePhoto} disabled={isProcessing}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Ambil Ulang
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
