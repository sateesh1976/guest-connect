import { QRCodeSVG } from 'qrcode.react';
import { Visitor } from '@/types/visitor';
import { format } from 'date-fns';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface VisitorQRCodeProps {
  visitor: Visitor;
}

export function VisitorQRCode({ visitor }: VisitorQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Create a unique visitor pass data
  const qrData = JSON.stringify({
    id: visitor.id,
    badgeId: visitor.badgeId,
    name: visitor.fullName,
    company: visitor.companyName,
    host: visitor.hostName,
    checkIn: visitor.checkInTime,
    type: 'visitor-pass'
  });

  const handlePrint = () => {
    const printContent = qrRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Pass - ${visitor.fullName}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .pass {
              border: 2px solid #1e3a5f;
              border-radius: 16px;
              padding: 32px;
              text-align: center;
              max-width: 320px;
            }
            .header {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #1e3a5f;
              margin: 0 0 24px 0;
            }
            .qr-container {
              background: white;
              padding: 16px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .info {
              text-align: left;
            }
            .info-row {
              margin-bottom: 12px;
            }
            .info-label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 500;
              color: #1e293b;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="pass">
            <div class="header">Visitor Pass</div>
            <h1 class="title">${visitor.fullName}</h1>
            <div class="qr-container">
              ${printContent.querySelector('svg')?.outerHTML || ''}
            </div>
            <div class="info">
              <div class="info-row">
                <div class="info-label">Company</div>
                <div class="info-value">${visitor.companyName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Visiting</div>
                <div class="info-value">${visitor.hostName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Check-in Time</div>
                <div class="info-value">${format(new Date(visitor.checkInTime), 'MMM d, yyyy • h:mm a')}</div>
              </div>
            </div>
            <div class="footer">
123:               Please wear this badge visibly at all times.<br/>
124:               Badge ID: ${visitor.badgeId}
125:             </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set canvas size with padding for better quality
    const size = 240;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 30, 30, 180, 180);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `visitor-pass-${visitor.badgeId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center">
      {/* QR Code Display */}
      <div 
        ref={qrRef}
        className="bg-white p-6 rounded-2xl shadow-elevated-lg border border-border"
        role="img"
        aria-label={`QR code for visitor ${visitor.fullName}, badge ID ${visitor.badgeId}`}
      >
        <QRCodeSVG
          value={qrData}
          size={180}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="hsl(217, 91%, 30%)"
        />
      </div>

      {/* Visitor Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Badge ID
        </p>
        <p className="text-sm font-mono font-medium text-foreground">
          {visitor.badgeId}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
          aria-label={`Save QR code for ${visitor.fullName}`}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Save QR
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
          aria-label={`Print visitor pass for ${visitor.fullName}`}
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          Print Pass
        </Button>
      </div>
    </div>
  );
}
