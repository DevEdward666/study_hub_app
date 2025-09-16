import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

export function QRScanner() {
  const [qrInput, setQrInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const startSession = useMutation(api.tables.startTableSession);
  const activatePremise = useMutation(api.premise.activatePremiseAccess);
  const getTableByQR = useQuery(api.tables.getTableByQR, qrInput ? { qrCode: qrInput } : "skip");
  const allTables = useQuery(api.tables.getAllTables);
  const premiseAccess = useQuery(api.premise.checkPremiseAccess);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      // const mediaStream = await navigator.mediaDevices.getUserMedia({
      //   video: { facingMode: "environment"},
      // });
      // alert(JSON.stringify(videoRef))
      // if (videoRef.current) {
      //   videoRef.current.srcObject = mediaStream;
      //   setStream(mediaStream);
        setCameraActive(true);
      // }
    } catch (error) {
      toast.error("Camera access denied or not available");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // In a real implementation, you would use a QR code detection library here
    // For now, we'll show a message to manually enter the code
    toast.info("QR detection would happen here. Please enter the code manually for now.");
  };
const handleScan = (result: IDetectedBarcode[]) => {
    if (result) {
      setQrInput(result[0].rawValue);
      toast.success(`Scanned QR Code: ${result[0].rawValue}`);
      stopCamera();
    }
}
  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    try {
      setIsScanning(true);
      
      // Check if it's a premise activation code
      if (qrInput.startsWith("PREMISE_")) {
        const result = await activatePremise({ activationCode: qrInput });
        toast.success(`Premise access activated! Valid for ${result.validityHours} hours at ${result.location}`);
        setQrInput("");
        return;
      }

      // Check if user has premise access for table sessions
      if (!premiseAccess) {
        toast.error("You need to scan a premise QR code first to activate table booking");
        return;
      }

      if (!getTableByQR) {
        toast.error("Invalid QR code - table not found");
        return;
      }

      const sessionId = await startSession({
        tableId: getTableByQR._id,
        qrCode: qrInput,
      });

      toast.success(`Started session at Table ${getTableByQR.tableNumber}!`);
      setQrInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process QR code");
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickSelect = (qrCode: string) => {
    setQrInput(qrCode);
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
       {cameraActive?<Scanner onScan={(result) => handleScan(result)} /> :null}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
        <p className="text-gray-600">
          First scan a premise QR code, then scan table QR codes to start sessions
        </p>
      </div>

      {/* Premise Access Status */}
      {premiseAccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <div>
              <h4 className="font-semibold text-green-800">Premise Access Active</h4>
              <p className="text-green-700 text-sm">
                Location: {premiseAccess.location} • 
                Time remaining: {formatTimeRemaining(premiseAccess.timeRemaining)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-800">Premise Access Required</h4>
              <p className="text-yellow-700 text-sm">
                Scan a premise QR code at the entrance to activate table booking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      <div className="space-y-4">
        <div className="flex gap-2">
          
           
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              cameraActive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {cameraActive ? "Stop Camera" : "Start Camera"}
          </button>
          {cameraActive && (
            <button
              onClick={captureFrame}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Scan QR
            </button>
          )}
        </div>

        {cameraActive && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
              style={{ maxHeight: "300px" }}
            />
            <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Manual QR Input Form */}
      <form onSubmit={handleQRSubmit} className="space-y-4">
        <div>
          <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
            QR Code or Table ID
          </label>
          <input
            id="qr-input"
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Enter QR code or select a table below"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {getTableByQR && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800">Table Found!</h4>
            <div className="text-blue-700 text-sm mt-1">
              <p>Table {getTableByQR.tableNumber} - {getTableByQR.location}</p>
              <p>Rate: {getTableByQR.hourlyRate} credits/hour</p>
              <p>Capacity: {getTableByQR.capacity} people</p>
              <p>Status: {getTableByQR.isOccupied ? "🔴 Occupied" : "🟢 Available"}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!qrInput.trim() || isScanning || (getTableByQR?.isOccupied && !qrInput.startsWith("PREMISE_"))}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isScanning ? "Processing..." : qrInput.startsWith("PREMISE_") ? "Activate Premise Access" : "Start Study Session"}
        </button>
      </form>

      {/* Available Tables - only show if premise access is active */}
      {premiseAccess && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Tables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTables?.map((table) => (
              <div
                key={table._id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  table.isOccupied
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50 hover:bg-green-100"
                }`}
                onClick={() => !table.isOccupied && handleQuickSelect(table.qrCode)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Table {table.tableNumber}</h4>
                    <p className="text-sm text-gray-600">{table.location}</p>
                    <p className="text-sm">
                      {table.hourlyRate} credits/hour • {table.capacity} people
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        table.isOccupied ? "bg-red-500" : "bg-green-500"
                      }`}
                    ></span>
                    <p className="text-xs mt-1">
                      {table.isOccupied ? "Occupied" : "Available"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
