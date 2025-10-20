import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// QR Scanner Component - Scans QR codes using device camera
export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only initialize scanner once
    if (scannerRef.current) return;

    console.log('Initializing QR scanner...');
    setIsInitialized(false);
    setError(null);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Create scanner instance with optimized config for desktop
        const scanner = new Html5QrcodeScanner(
          'qr-reader', // ID of the div element
          {
            fps: 10, // Frames per second for scanning
            qrbox: { width: 250, height: 250 }, // Size of scanning box
            aspectRatio: 1.0,
            showTorchButtonIfSupported: false, // Hide flashlight for cleaner UI
            showZoomSliderIfSupported: false, // Hide zoom for cleaner UI
            videoConstraints: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "environment"
            }
          },
          false // Verbose logging disabled
        );

        // Success callback - Called when QR code is successfully scanned
        const onScanSuccess = (decodedText) => {
          console.log('QR Code scanned successfully:', decodedText);
          
          // Stop scanning after successful scan
          if (scannerRef.current) {
            scannerRef.current.clear().catch(err => {
              console.error('Error clearing scanner:', err);
            });
            scannerRef.current = null;
          }
          
          // Pass the decoded text to parent component
          if (onScan) {
            onScan(decodedText);
          }
        };

        // Error callback - Called when scanning fails
        const onScanFailure = (error) => {
          // Don't log every failed scan attempt (too noisy)
          // Only log actual errors that aren't just "no QR code found"
          if (error && !error.includes('NotFoundException')) {
            console.warn('QR Scan error:', error);
          }
        };

        // Start the scanner - Note: render() doesn't return a promise
        try {
          scanner.render(onScanSuccess, onScanFailure);
          console.log('Scanner render called successfully');
          // Set initialized to true immediately - scanner will show camera once permission is granted
          setIsInitialized(true);
          scannerRef.current = scanner;
        } catch (err) {
          console.error('Scanner render error:', err);
          setError('Failed to start camera: ' + err.message);
        }
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize scanner: ' + err.message);
      }
    }, 100);

    // Cleanup function - Stop scanner when component unmounts
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Error clearing scanner:', err);
        });
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div className="w-full">
      {/* Loading state */}
      {!isInitialized && !error && (
        <div className="bg-white/5 rounded-lg p-8 text-center border border-white/10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Starting camera...</p>
          <p className="text-xs text-white/50 mt-2">Please allow camera permissions if prompted</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 rounded-lg p-6 text-center border border-red-500/20">
          <p className="text-white/90 font-semibold mb-2">Camera Error</p>
          <p className="text-white/70 text-sm">{error}</p>
          <p className="text-white/50 text-xs mt-3">
            Make sure you've granted camera permissions in your browser settings
          </p>
        </div>
      )}
      
      {/* Scanner container - Hidden until initialized */}
      <div 
        id="qr-reader" 
        className="w-full"
        style={{ display: isInitialized ? 'block' : 'none' }}
      ></div>
      
      {/* Instructions - Clean and subtle */}
      {isInitialized && (
        <div className="mt-3 text-center">
          <p className="text-xs text-white/50">
            Position the QR code within the frame
          </p>
        </div>
      )}
    </div>
  );
}

