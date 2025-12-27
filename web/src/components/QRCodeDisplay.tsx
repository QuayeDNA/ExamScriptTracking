import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  data,
  size = 300,
  className = "",
}: QRCodeDisplayProps) {
  // Check if data is a data URL (starts with "data:")
  const isDataURL = data.startsWith("data:");

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="bg-background p-4 rounded-lg border-2 border-border shadow-sm">
        {isDataURL ? (
          <img src={data} alt="QR Code" style={{ width: size, height: size }} />
        ) : (
          <QRCodeSVG
            value={data}
            size={size}
            level="H"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        )}
      </div>
    </div>
  );
}
