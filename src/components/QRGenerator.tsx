import { useState } from "react";

interface QRGeneratorProps {
  data: string;
  size?: number;
}

export function QRGenerator({ data, size = 200 }: QRGeneratorProps) {
  const [showData, setShowData] = useState(false);

  // Simple QR code placeholder - in a real app, you'd use a QR library
  const generateQRDataURL = (text: string) => {
    // This is a placeholder - you would use a library like 'qrcode' here
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    if (ctx) {
      // Draw a simple pattern as placeholder
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      
      // Create a simple pattern
      for (let i = 0; i < size; i += 10) {
        for (let j = 0; j < size; j += 10) {
          if ((i + j) % 20 === 0) {
            ctx.fillRect(i, j, 8, 8);
          }
        }
      }
      
      // Add corner markers
      ctx.fillRect(10, 10, 30, 30);
      ctx.fillRect(size - 40, 10, 30, 30);
      ctx.fillRect(10, size - 40, 30, 30);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(15, 15, 20, 20);
      ctx.fillRect(size - 35, 15, 20, 20);
      ctx.fillRect(15, size - 35, 20, 20);
    }
    
    return canvas.toDataURL();
  };

  return (
    <div className="text-center space-y-4">
      <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
        <img 
          src={generateQRDataURL(data)} 
          alt="QR Code" 
          className="mx-auto"
          style={{ width: size, height: size }}
        />
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => setShowData(!showData)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showData ? "Hide" : "Show"} QR Data
        </button>
        
        {showData && (
          <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
            {data}
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.download = `qr-code-${Date.now()}.png`;
              link.href = generateQRDataURL(data);
              link.click();
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(data);
            }}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Copy Data
          </button>
        </div>
      </div>
    </div>
  );
}
