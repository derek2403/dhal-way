import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// QR Scanner Component - Scans QR codes using device camera
export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const hasInitializedRef = useRef(false); // Track if we've ever initialized
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitializedRef.current) {
      console.log('Scanner already initialized, skipping...');
      return;
    }
    
    hasInitializedRef.current = true;

    console.log('Initializing QR scanner...');
    setIsInitialized(false);
    setError(null);

    // Direct camera mode - uses Html5Qrcode API directly
    const startDirectMode = async () => {
      // Wait for DOM to be ready
      setTimeout(async () => {
        try {
          // Make sure the DOM element exists
          const element = document.getElementById('qr-reader');
          if (!element) {
            console.error('qr-reader element not found!');
            setError('Scanner initialization failed - element not found');
            hasInitializedRef.current = false;
            return;
          }

          console.log('Starting direct camera mode...');
          const html5Qr = new Html5Qrcode('qr-reader');
          
          await html5Qr.start(
            { facingMode: 'environment' }, // Use back camera
            { 
              fps: 10, // Scan 10 times per second
              qrbox: 250 // Scanning box size
            },
            (decodedText) => {
              console.log('✅ QR Code scanned:', decodedText);
              
              // Stop scanner after successful scan
              if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
              }
              
              // Pass result to parent
              if (onScan) {
                onScan(decodedText);
              }
            },
            (errorMessage) => {
              // Ignore "NotFoundException" - just means no QR code in frame
              if (errorMessage && !String(errorMessage).includes('NotFoundException')) {
                console.warn('Scan error:', errorMessage);
              }
            }
          );

          // Store scanner with unified clear API for cleanup
          scannerRef.current = {
            clear: async () => {
              try {
                await html5Qr.stop();
              } catch (_) {}
              try {
                await html5Qr.clear();
              } catch (_) {}
            }
          };
          
          setIsInitialized(true);
          console.log('✅ Camera active and scanning!');
        } catch (err) {
          console.error('Camera initialization failed:', err);
          
          // User-friendly error messages
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera access was denied.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError('Unable to start camera: ' + (err?.message || String(err)));
          }
          
          hasInitializedRef.current = false;
        }
      }, 300); // Delay to ensure DOM is ready
    };

    // Start camera
    startDirectMode();

    // Cleanup function - called when component unmounts
    return () => {
      console.log('Cleaning up scanner...');
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
          scannerRef.current = null;
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }
    };
  }, []); // Empty deps - only run once

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
      
      {/* Error state with helpful instructions */}
      {error && (
        <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
          <div className="text-center mb-4">
            <p className="text-white/90 font-semibold text-lg mb-2">📷 Camera Access Needed</p>
            <p className="text-white/70 text-sm">Camera access is currently blocked</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-left space-y-3">
            <p className="text-white/90 font-medium text-sm">Quick Fix:</p>
            <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
              <li>Click the <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white/90 mx-1">🔒</span> or <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white/90 mx-1">ⓘ</span> icon in your address bar</li>
              <li>Find <strong className="text-white/90">Camera</strong> permissions</li>
              <li>Change it to <strong className="text-white/90">"Allow"</strong> or <strong className="text-white/90">"Ask"</strong></li>
              <li>Refresh this page and try again</li>
            </ol>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium transition-all duration-200 text-sm"
            >
              I've Enabled Camera - Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Scanner container - Always in DOM so html5-qrcode can render into it */}
      <div 
        id="qr-reader" 
        className="w-full"
      ></div>
      
      {/* Instructions - Clean and subtle */}
      {isInitialized && !error && (
        <div className="mt-3 text-center">
          <p className="text-xs text-white/50">
            Position the QR code within the frame
          </p>
        </div>
      )}
    </div>
  );
}

