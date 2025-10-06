import * as XLSX from 'xlsx';
import { type ShiftSummary } from '@shared/schema';

export function generateShiftReportExcel(summary: ShiftSummary, transactions: any[]) {
  // Создаем новую книгу Excel
  const workbook = XLSX.utils.book_new();

  // Данные для листа "Сводка смены"
  const summaryData = [
    ['Отчет по смене'],
    [],
    ['Параметр', 'Значение'],
    ['Начало смены', new Date(summary.shift.startTime).toLocaleString('ru-RU')],
    ['Окончание смены', summary.shift.endTime ? new Date(summary.shift.endTime).toLocaleString('ru-RU') : 'Не закрыта'],
    ['Статус', summary.shift.status === 'open' ? 'Открыта' : 'Закрыта'],
    [],
    ['Финансы'],
    ['Начальная касса', `${parseFloat(summary.shift.startingCash).toFixed(2)} ₸`],
    ['Конечная касса', summary.shift.endingCash ? `${parseFloat(summary.shift.endingCash).toFixed(2)} ₸` : '-'],
    [],
    ['Продажи'],
    ['Всего продаж', `${parseFloat(summary.totalSales).toFixed(2)} ₸`],
    ['Количество транзакций', summary.totalTransactions],
    ['Наличные', `${parseFloat(summary.cashSales).toFixed(2)} ₸`],
    ['Карта', `${parseFloat(summary.cardSales).toFixed(2)} ₸`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  // Данные для листа "Транзакции"
  const transactionHeaders = [
    'Номер чека',
    'Дата/время',
    'Способ оплаты',
    'Сумма',
    'Налог',
    'Итого',
    'Клиент',
    'Товары'
  ];

  const transactionData = [
    transactionHeaders,
    ...transactions.map(txn => [
      txn.receiptNumber,
      new Date(txn.createdAt).toLocaleString('ru-RU'),
      txn.paymentMethod === 'cash' ? 'Наличные' : 'Карта',
      `${parseFloat(txn.subtotal).toFixed(2)} ₸`,
      `${parseFloat(txn.tax).toFixed(2)} ₸`,
      `${parseFloat(txn.total).toFixed(2)} ₸`,
      txn.customer ? txn.customer.name : 'Без клиента',
      txn.items.map((item: any) => `${item.product.name} x${item.quantity}`).join(', ')
    ])
  ];

  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Транзакции');

  // Генерируем буфер Excel файла
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

export function generateShiftReportCSV(summary: ShiftSummary, transactions: any[]) {
  // Создаем CSV данные для транзакций
  const csvData = [
    ['Номер чека', 'Дата/время', 'Способ оплаты', 'Сумма', 'Налог', 'Итого', 'Клиент', 'Товары'],
    ...transactions.map(txn => [
      txn.receiptNumber,
      new Date(txn.createdAt).toLocaleString('ru-RU'),
      txn.paymentMethod === 'cash' ? 'Наличные' : 'Карта',
      parseFloat(txn.subtotal).toFixed(2),
      parseFloat(txn.tax).toFixed(2),
      parseFloat(txn.total).toFixed(2),
      txn.customer ? txn.customer.name : 'Без клиента',
      txn.items.map((item: any) => `${item.product.name} x${item.quantity}`).join('; ')
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return Buffer.from(csv, 'utf-8');
}
