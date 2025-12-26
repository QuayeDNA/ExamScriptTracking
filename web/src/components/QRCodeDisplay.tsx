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
      <div className="bg-background p-4 rounded-lg border-2 border-border shadow-sm">
        <QRCodeSVG
          value={data}
          size={280}
          level="M"
          includeMargin={true}
          fgColor="var(--foreground)"
          bgColor="var(--background)"
        />
      </div>
    </div>
  );
}
