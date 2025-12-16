import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { XCircle, Camera, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isScanning = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting to scan
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setLoading(false);
             if (isScanning) {
               requestAnimationFrame(tick);
             }
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
        setLoading(false);
      }
    };

    const tick = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use jsQR to detect code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Found a code!
          // Stop scanning immediately
          isScanning = false;
          
          // Draw a box around it for feedback
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#10b981"; // Emerald-500
          ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
          ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
          ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
          ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.stroke();

          // Stop the camera stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          cancelAnimationFrame(animationFrameId);
          
          // Close scanner and call onScan
          setTimeout(() => {
            onClose();
            onScan(code.data);
          }, 100); // Small delay to show the detection box
          return; 
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    startCamera();

    return () => {
      isScanning = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScan, onClose]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create image element
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Create canvas for processing
        if (!uploadCanvasRef.current) {
          setUploading(false);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        const canvas = uploadCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          setUploading(false);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        // Set canvas dimensions to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Use jsQR to detect code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        // Clean up
        URL.revokeObjectURL(objectUrl);

        if (code && code.data) {
          // Found a code!
          setUploading(false);
          // Close scanner first, then scan (with small delay to ensure state updates)
          onClose();
          // Use setTimeout to ensure onClose completes before onScan
          setTimeout(() => {
            onScan(code.data);
          }, 100);
        } else {
          setUploading(false);
          setError('No QR code found in the uploaded image. Please try another image.');
        }
      };

      img.onerror = () => {
        setUploading(false);
        setError('Failed to load image. Please try another file.');
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (err) {
      console.error('Error processing uploaded image:', err);
      setUploading(false);
      setError('Failed to process image. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="text-white p-2 bg-black/50 rounded-full hover:bg-black/70">
          <XCircle className="w-8 h-8" />
        </button>
      </div>

      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-10 h-10 animate-bounce" />
              <p>Starting Camera...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="text-white text-center p-6 bg-rose-600/20 rounded-xl border border-rose-500/50 mx-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-rose-500" />
            <p className="mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        ) : (
          <div className="relative w-full aspect-[3/4] max-h-[80vh] overflow-hidden bg-black">
            {/* The video element is hidden, we draw to canvas for processing, but we can also just show the video and draw overlay on canvas. 
                For simplicity with jsQR, drawing to canvas is required for data, but users want to see the feed. 
                We'll display the canvas which contains the video frame + any overlays.
            */}
            <video ref={videoRef} className="hidden" playsInline muted></video>
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            
            {/* Overlay UI */}
            {!loading && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
                  <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                </div>
                <p className="absolute bottom-20 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  Point camera at a QR code
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload QR Code Section */}
        <div className="w-full max-w-md px-4 pb-6 mt-4">
          <div className="border-t border-white/20 pt-4">
            <p className="text-white/70 text-sm text-center mb-3">Or upload a QR code image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-upload-input"
            />
            <label
              htmlFor="qr-upload-input"
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-lg cursor-pointer transition-all ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white text-sm font-medium">Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-white text-sm font-medium">Upload QR Code</span>
                </>
              )}
            </label>
            {error && !uploading && (
              <p className="text-rose-300 text-xs text-center mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Hidden canvas for processing uploaded images */}
        <canvas ref={uploadCanvasRef} className="hidden" />
      </div>
    </div>
  );
};
