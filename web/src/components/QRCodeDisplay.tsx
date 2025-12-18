import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  data,
  size = 200,
  className = "",
}: QRCodeDisplayProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <QRCodeSVG
        value={data}
        size={size}
        level="M"
        includeMargin={true}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
    </div>
  );
}
