'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check, Loader2 } from 'lucide-react';
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
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Try with environment camera first, fallback to any camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        });
      } catch (envError) {
        console.log('Environment camera not available, trying any camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        });
      }
      
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
          description: 'Izinkan akses kamera untuk mengambil foto meter air. Pastikan aplikasi berjalan di HTTPS.'
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          variant: 'destructive',
          title: 'Kamera Tidak Ditemukan',
          description: 'Tidak ada kamera yang tersedia di perangkat ini.'
        });
      } else if (error.message === 'Camera not supported') {
        toast({
          variant: 'destructive',
          title: 'Kamera Tidak Didukung',
          description: 'Browser Anda tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Safari.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Kamera',
          description: 'Gagal mengakses kamera. Pastikan perangkat mendukung kamera dan aplikasi berjalan di HTTPS.'
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

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100); // Small delay to ensure dialog is rendered
      return () => clearTimeout(timer);
    }
  }, [isOpen, capturedImage, startCamera]);

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
      
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <div className="flex flex-col items-center justify-center h-[50vh] sm:h-64 bg-gray-100 rounded-lg">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600 mb-4">Memulai kamera...</p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4 text-center px-4">
                          Kamera akan dimulai otomatis. Jika tidak muncul, klik tombol di bawah.
                        </p>
                        <Button onClick={startCamera} disabled={isProcessing}>
                          {isProcessing ? 'Memproses...' : 'Mulai Kamera'}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-[50vh] sm:h-64 object-cover rounded-lg"
                        playsInline
                        muted
                        autoPlay
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button onClick={capturePhoto} size="lg" className="w-full sm:w-auto">
                        <Camera className="w-4 h-4 mr-2" />
                        Ambil Foto
                      </Button>
                      <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
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
                    className="w-full h-[50vh] sm:h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={confirmPhoto} size="lg" disabled={isProcessing} className="w-full sm:w-auto">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Gunakan Foto Ini
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={retakePhoto} disabled={isProcessing} className="w-full sm:w-auto">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Ambil Ulang
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
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
