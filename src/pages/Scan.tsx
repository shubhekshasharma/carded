import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { X, Upload, Flashlight, FlashlightOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseQRContent } from "@/lib/qr-utils";

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (error: any) {
      console.error("Failed to start scanner:", error);
      setCameraError(
        error?.name === "NotAllowedError"
          ? "Camera blocked. Allow camera or upload a QR photo."
          : "Couldn't access camera. Upload a QR photo instead."
      );
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error("Failed to stop scanner:", error);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    const payload = parseQRContent(decodedText);

    if (!payload) {
      toast({
        title: "That isn't a Carded. code.",
        description: "Try scanning a valid Carded. QR",
        variant: "destructive",
      });
      return;
    }

    // Stop scanning and navigate to scanned card
    stopScanning();
    navigate("/scanned", { state: { payload } });
  };

  const onScanFailure = (error: string) => {
    // Ignore scan failures - they happen constantly during scanning
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Unwrapping this card…",
        description: "Reading QR code from image...",
      });

      const scanner = new Html5Qrcode("qr-reader");
      const result = await scanner.scanFile(file, true);
      
      const payload = parseQRContent(result);
      if (!payload) {
        toast({
          title: "That isn't a Carded. code.",
          description: "Try uploading a valid Carded. QR",
          variant: "destructive",
        });
        return;
      }

      stopScanning();
      navigate("/scanned", { state: { payload } });
    } catch (error) {
      toast({
        title: "Couldn't read that — try again?",
        description: "Make sure the QR code is clear and visible",
        variant: "destructive",
      });
    }
  };

  const toggleTorch = async () => {
    // Note: Torch API is limited in web browsers
    // This is a placeholder - actual implementation depends on browser support
    setTorchEnabled(!torchEnabled);
    toast({
      title: torchEnabled ? "Flashlight off" : "Flashlight on",
      description: "Note: Not all devices support flashlight control",
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-scanlines pointer-events-none opacity-20" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="font-pixel text-sm text-retro-green hover:text-retro-green hover:bg-retro-green/10"
        >
          <X className="w-5 h-5" />
        </Button>

        {isScanning && (
          <Button
            variant="ghost"
            onClick={toggleTorch}
            className="font-pixel text-sm text-retro-green hover:text-retro-green hover:bg-retro-green/10"
          >
            {torchEnabled ? <FlashlightOff className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-pixel text-3xl md:text-4xl text-retro-green mb-3">
            Scan a card
          </h1>
          <p className="font-mono text-base text-muted-foreground">
            Point your camera at a Carded. QR
          </p>
        </motion.div>

        {/* QR Scanner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full max-w-sm"
        >
          {/* Scanner frame */}
          <div className="relative aspect-square w-full bg-black/50 rounded-lg overflow-hidden border-4 border-retro-green shadow-glow">
            <div id="qr-reader" ref={videoRef} className="w-full h-full" />

            {/* Scan frame overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner markers */}
                <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-retro-green" />
                <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-retro-green" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-retro-green" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-retro-green" />

                {/* Scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-retro-green shadow-glow"
                  animate={{ top: ["20%", "80%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}

            {/* Error state */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                <div className="text-center p-6">
                  <p className="font-mono text-sm text-destructive mb-4">{cameraError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload fallback */}
          <div className="mt-6">
            <label htmlFor="qr-upload">
              <Button
                variant="outline"
                className="w-full font-mono border-2 border-retro-blue text-retro-blue hover:bg-retro-blue/10"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload QR Image
                </span>
              </Button>
            </label>
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Scan;
