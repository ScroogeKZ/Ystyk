import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, Camera, Search, Package, CheckCircle, XCircle, Settings } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithCategory } from "@shared/schema";

interface ScanResult {
  barcode: string;
  product?: ProductWithCategory;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface ScannerConfig {
  enabled: boolean;
  autoFocus: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  format: 'ean13' | 'ean8' | 'code128' | 'qr' | 'all';
  minLength: number;
  maxLength: number;
}

export default function BarcodeScanner({ 
  onProductScanned,
  isOpen,
  onClose 
}: {
  onProductScanned?: (product: ProductWithCategory, quantity?: number) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [config, setConfig] = useState<ScannerConfig>({
    enabled: true,
    autoFocus: true,
    soundEnabled: true,
    vibrationEnabled: true,
    format: 'all',
    minLength: 8,
    maxLength: 14
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const { formatCurrency } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  // Initialize camera and scanner
  useEffect(() => {
    if (isOpen && config.enabled) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => stopScanner();
  }, [isOpen, config.enabled]);

  const initializeScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        
        // Start scanning loop
        startScanningLoop();
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
      toast({
        title: "Ошибка камеры",
        description: "Не удалось получить доступ к камере. Используйте ручной ввод штрихкода.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanningLoop = () => {
    const scanFrame = () => {
      if (videoRef.current && canvasRef.current && isScanning) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Simulate barcode detection (in production, use a real barcode library like QuaggaJS)
          const mockDetection = Math.random() > 0.95; // 5% chance per frame
          if (mockDetection) {
            const mockBarcode = '4870203450' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            handleBarcodeDetected(mockBarcode);
          }
        }
        
        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
      }
    };
    
    requestAnimationFrame(scanFrame);
  };

  const handleBarcodeDetected = (barcode: string) => {
    // Validate barcode format
    if (barcode.length < config.minLength || barcode.length > config.maxLength) {
      return;
    }

    // Find product by barcode (SKU in this demo)
    const product = products.find(p => p.sku === barcode || p.sku.includes(barcode.slice(-6)));
    
    const scanResult: ScanResult = {
      barcode,
      product,
      timestamp: new Date(),
      success: !!product,
      error: product ? undefined : 'Товар не найден'
    };

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)]);

    if (product) {
      // Success feedback
      if (config.soundEnabled) {
        playSuccessSound();
      }
      if (config.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      onProductScanned?.(product, 1);
      
      toast({
        title: "Товар найден",
        description: `${product.name} - ${formatCurrency(Number(product.price))}`,
      });
    } else {
      // Error feedback
      if (config.soundEnabled) {
        playErrorSound();
      }
      
      toast({
        title: "Товар не найден",
        description: `Штрихкод ${barcode} не найден в базе`,
        variant: "destructive",
      });
    }
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      handleBarcodeDetected(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const playSuccessSound = () => {
    // Create success beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playErrorSound = () => {
    // Create error beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = 'square';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const getBarcodeFormatBadge = (barcode: string) => {
    if (barcode.length === 13) return <Badge variant="outline">EAN-13</Badge>;
    if (barcode.length === 8) return <Badge variant="outline">EAN-8</Badge>;
    if (barcode.length === 12) return <Badge variant="outline">UPC</Badge>;
    return <Badge variant="outline">Другой</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Сканирование штрихкодов
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner View */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Камера
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config.enabled ? (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                      width={640}
                      height={480}
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-red-500 w-48 h-32 bg-transparent relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                      </div>
                    </div>
                    
                    {isScanning && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                        Сканирование...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p>Сканер отключен</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setConfig(prev => ({ ...prev, enabled: true }))}
                      >
                        Включить сканер
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Ручной ввод
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Введите штрихкод"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  />
                  <Button onClick={handleManualSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results and Settings */}
          <div className="space-y-4">
            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Результаты сканирования</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scanResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Пока нет результатов</p>
                  ) : (
                    scanResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {result.barcode}
                          </code>
                          <div className="flex items-center gap-2">
                            {getBarcodeFormatBadge(result.barcode)}
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        {result.product ? (
                          <div className="text-sm">
                            <p className="font-medium">{result.product.name}</p>
                            <p className="text-gray-600">{formatCurrency(Number(result.product.price))}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {result.timestamp.toLocaleTimeString('ru-RU')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scanner Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Настройки сканера
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Автофокус</label>
                  <input
                    type="checkbox"
                    checked={config.autoFocus}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoFocus: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Звуковые сигналы</label>
                  <input
                    type="checkbox"
                    checked={config.soundEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Вибрация</label>
                  <input
                    type="checkbox"
                    checked={config.vibrationEnabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, vibrationEnabled: e.target.checked }))}
                    className="rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Формат штрихкода</label>
                  <select 
                    value={config.format} 
                    onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="all">Все форматы</option>
                    <option value="ean13">EAN-13</option>
                    <option value="ean8">EAN-8</option>
                    <option value="code128">Code 128</option>
                    <option value="qr">QR коды</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setScanResults([])}
              disabled={scanResults.length === 0}
            >
              Очистить результаты
            </Button>
            {isScanning ? (
              <Button variant="destructive" onClick={stopScanner}>
                Остановить сканирование
              </Button>
            ) : (
              <Button onClick={initializeScanner} disabled={!config.enabled}>
                Начать сканирование
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}