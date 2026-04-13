import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Download, Share2 } from 'lucide-react';

interface QRDisplayProps {
  value: string;
  passId: string;
  studentName: string;
  usn: string;
  validUntil: string;
  size?: number;
  showActions?: boolean;
}

const QRDisplay: React.FC<QRDisplayProps> = ({
  value, passId, studentName, usn, validUntil, size = 200, showActions = true,
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Card */}
      <div className="bg-white rounded-card p-5 shadow-xl border border-border w-fit">
        <div className="qr-shimmer rounded-lg overflow-hidden relative">
          <QRCodeSVG
            value={value}
            size={size}
            level="H"
            includeMargin
            fgColor="#0F1117"
            bgColor="#FFFFFF"
          />
        </div>
        {/* Scan corners overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-accent-primary scanner-corner rounded-tl" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-accent-primary scanner-corner rounded-tr" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-accent-primary scanner-corner rounded-bl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-accent-primary scanner-corner rounded-br" />
        </div>
      </div>

      {/* Pass info */}
      <div className="text-center space-y-1">
        <p className="font-bold text-lg font-sora text-text-primary">{studentName}</p>
        <p className="font-mono text-sm text-text-secondary">{usn}</p>
        <p className="font-mono text-xs text-text-muted bg-bg-muted px-3 py-1 rounded-badge inline-block">
          {passId}
        </p>
      </div>

      {/* Valid until */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-input px-4 py-2.5">
        <Shield size={15} className="text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-emerald-700 font-semibold">Valid Until</p>
          <p className="text-xs text-emerald-600">{validUntil}</p>
        </div>
      </div>

      {/* Warning */}
      <p className="text-xs text-text-muted text-center max-w-[220px] leading-relaxed">
        ⚠️ This QR is valid <strong>only once</strong>. Do not share with others.
      </p>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3 w-full">
          <button className="btn btn-secondary flex-1 text-sm gap-2">
            <Download size={15} /> Download
          </button>
          <button className="btn btn-secondary flex-1 text-sm gap-2">
            <Share2 size={15} /> Share
          </button>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;
