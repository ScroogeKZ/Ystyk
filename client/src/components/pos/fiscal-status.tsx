import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Printer, Shield, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useState, useEffect } from "react";

interface FiscalStatus {
  ofdConnected: boolean;
  fiscalMode: boolean;
  lastSync: Date | null;
  queuedReceipts: number;
  taxNumber: string;
  fiscalSign: string;
}

export default function FiscalStatus() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<FiscalStatus>({
    ofdConnected: true, // Simulated - would be real OFD connection in production
    fiscalMode: true,
    lastSync: new Date(),
    queuedReceipts: 0,
    taxNumber: "123456789012",
    fiscalSign: "FP-2024-001",
  });

  // Simulate periodic OFD status checks
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        // Simulate occasional connection issues
        ofdConnected: Math.random() > 0.1, // 90% uptime simulation
      }));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4" />
          {t.fiscal.fiscalMode}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* OFD Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.ofdConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-foreground">ОФД</span>
          </div>
          <Badge variant={status.ofdConnected ? "default" : "destructive"} className="text-xs">
            {status.ofdConnected ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t.fiscal.ofdConnected}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {t.fiscal.ofdDisconnected}
              </div>
            )}
          </Badge>
        </div>

        {/* Fiscal Printer Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t.fiscal.fiscalPrinter}</span>
          </div>
          <Badge variant="default" className="text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t.fiscal.ready}
            </div>
          </Badge>
        </div>

        {/* Queued Receipts */}
        {status.queuedReceipts > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{t.fiscal.queued}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {status.queuedReceipts} {t.fiscal.receipts}
              </div>
            </Badge>
          </div>
        )}

        {/* Tax Information */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
          <div>{t.fiscal.taxNumber} {status.taxNumber}</div>
          <div>{t.fiscal.fiscalSign} {status.fiscalSign}</div>
          {status.lastSync && (
            <div>
              {t.fiscal.lastSync} {status.lastSync.toLocaleTimeString('ru-KZ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}