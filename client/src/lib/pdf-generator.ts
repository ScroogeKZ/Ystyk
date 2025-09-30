import jsPDF from 'jspdf';
import type { TransactionWithItems } from '@shared/schema';

export const generateReceiptPDF = (transaction: TransactionWithItems) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // Thermal printer paper size
  });

  // Set font
  doc.setFont('helvetica');
  
  let yPosition = 10;
  const lineHeight = 4;
  const pageWidth = 80;
  
  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
    return y + lineHeight;
  };
  
  // Helper function to add left-right aligned text
  const addLeftRightText = (left: string, right: string, y: number, fontSize = 8) => {
    doc.setFontSize(fontSize);
    doc.text(left, 2, y);
    
    const rightWidth = doc.getTextWidth(right);
    doc.text(right, pageWidth - rightWidth - 2, y);
    return y + lineHeight;
  };
  
  // Helper function to add line separator
  const addLine = (y: number) => {
    doc.line(2, y, pageWidth - 2, y);
    return y + 2;
  };
  
  // Store header
  yPosition = addCenteredText('Кафе "Уютное место"', yPosition, 14);
  yPosition = addCenteredText('ул. Пушкина, д. 10', yPosition, 10);
  yPosition = addCenteredText('+7 (495) 123-45-67', yPosition, 10);
  yPosition += 3;
  
  yPosition = addLine(yPosition);
  
  // Receipt info
  yPosition = addLeftRightText('Чек:', `#${transaction.receiptNumber}`, yPosition);
  yPosition = addLeftRightText('Дата:', new Date(transaction.createdAt).toLocaleString('ru-RU'), yPosition);
  yPosition = addLeftRightText('Кассир:', 'Анна Петрова', yPosition);
  yPosition = addLeftRightText('Касса:', '#001', yPosition);
  
  yPosition = addLine(yPosition);
  
  // Items
  doc.setFontSize(8);
  transaction.items.forEach((item) => {
    // Item name
    doc.text(item.product.name, 2, yPosition);
    yPosition += lineHeight;
    
    // Item details and total
    const details = `₸${item.unitPrice} × ${item.quantity}`;
    yPosition = addLeftRightText(details, `₸${item.totalPrice}`, yPosition);
  });
  
  yPosition = addLine(yPosition);
  
  // Totals
  yPosition = addLeftRightText('Подытог:', `₸${transaction.subtotal}`, yPosition);
  yPosition = addLeftRightText('Налог (10%):', `₸${transaction.tax}`, yPosition);
  
  yPosition = addLine(yPosition);
  
  // Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  yPosition = addLeftRightText('ИТОГО:', `₸${transaction.total}`, yPosition, 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Payment info
  if (transaction.paymentMethod === 'cash') {
    yPosition = addLeftRightText('Получено:', `₸${transaction.receivedAmount}`, yPosition);
    yPosition = addLeftRightText('Сдача:', `₸${transaction.changeAmount}`, yPosition);
  } else {
    yPosition = addLeftRightText('Оплата:', 'Карта', yPosition);
  }
  
  yPosition += 3;
  yPosition = addLine(yPosition);
  
  // Footer
  yPosition = addCenteredText('Спасибо за покупку!', yPosition, 10);
  yPosition = addCenteredText('Обмен и возврат в течение 14 дней', yPosition, 8);
  
  // QR code placeholder (if needed)
  yPosition += 5;
  doc.rect(25, yPosition, 30, 30); // Placeholder for QR code
  yPosition = addCenteredText('QR-код для проверки', yPosition + 35, 6);
  
  // Save/Print PDF
  const fileName = `receipt_${transaction.receiptNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Check if we're in a browser environment that supports printing
  if (typeof window !== 'undefined') {
    try {
      // Try to print directly
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Print failed, downloading instead:', error);
      doc.save(fileName);
    }
  } else {
    // Fallback to download
    doc.save(fileName);
  }
  
  return doc;
};

export const generateShiftReportPDF = (shiftData: any) => {
  const doc = new jsPDF();
  
  let yPosition = 20;
  const lineHeight = 7;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Отчет по смене', 20, yPosition);
  yPosition += lineHeight * 2;
  
  // Shift info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Смена: ${shiftData.shift.id}`, 20, yPosition);
  yPosition += lineHeight;
  doc.text(`Открыта: ${new Date(shiftData.shift.startTime).toLocaleString('ru-RU')}`, 20, yPosition);
  yPosition += lineHeight;
  
  if (shiftData.shift.endTime) {
    doc.text(`Закрыта: ${new Date(shiftData.shift.endTime).toLocaleString('ru-RU')}`, 20, yPosition);
    yPosition += lineHeight;
  }
  
  yPosition += lineHeight;
  
  // Financial summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Финансовая сводка', 20, yPosition);
  yPosition += lineHeight;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Касса на начало: ₸${shiftData.shift.startingCash}`, 20, yPosition);
  yPosition += lineHeight;
  doc.text(`Общие продажи: ₸${shiftData.totalSales}`, 20, yPosition);
  yPosition += lineHeight;
  doc.text(`Продажи наличными: ₸${shiftData.cashSales}`, 20, yPosition);
  yPosition += lineHeight;
  doc.text(`Продажи по картам: ₸${shiftData.cardSales}`, 20, yPosition);
  yPosition += lineHeight;
  doc.text(`Количество транзакций: ${shiftData.totalTransactions}`, 20, yPosition);
  yPosition += lineHeight;
  
  if (shiftData.shift.endingCash) {
    doc.text(`Касса на конец: ₸${shiftData.shift.endingCash}`, 20, yPosition);
    yPosition += lineHeight;
  }
  
  // Save PDF
  const fileName = `shift_report_${shiftData.shift.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return doc;
};

export const generateInventoryReportPDF = (products: any[]) => {
  const doc = new jsPDF();
  
  let yPosition = 20;
  const lineHeight = 7;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Отчет по товарам', 20, yPosition);
  yPosition += lineHeight * 2;
  
  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  yPosition += lineHeight * 2;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SKU', 20, yPosition);
  doc.text('Название', 50, yPosition);
  doc.text('Цена', 120, yPosition);
  doc.text('Остаток', 150, yPosition);
  yPosition += lineHeight;
  
  // Table line
  doc.line(20, yPosition - 2, 180, yPosition - 2);
  
  // Products
  doc.setFont('helvetica', 'normal');
  products.forEach((product) => {
    if (yPosition > 270) { // New page if needed
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(product.sku, 20, yPosition);
    doc.text(product.name.substring(0, 25), 50, yPosition); // Truncate long names
    doc.text(`₸${product.price}`, 120, yPosition);
    doc.text(product.stock.toString(), 150, yPosition);
    yPosition += lineHeight;
  });
  
  // Save PDF
  const fileName = `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return doc;
};
