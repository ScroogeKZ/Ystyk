import * as XLSX from 'xlsx';
import { type ShiftSummary, type Product, type Customer, type ProductWithCategory } from '@shared/schema';

export function generateProductsExcel(products: ProductWithCategory[]) {
  const workbook = XLSX.utils.book_new();

  const headers = ['SKU', 'Название', 'Категория', 'Цена', 'Остаток', 'Статус', 'Срок годности'];
  const data = [
    headers,
    ...products.map(p => [
      p.sku,
      p.name,
      p.category?.name || 'Без категории',
      `${parseFloat(p.price).toFixed(2)} ₸`,
      p.stock,
      p.isActive ? 'Активен' : 'Неактивен',
      p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('ru-RU') : '-'
    ])
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Товары');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCustomersExcel(customers: any[]) {
  const workbook = XLSX.utils.book_new();

  const headers = ['Имя', 'Телефон', 'Email', 'Баллы лояльности', 'Уровень', 'Дата регистрации'];
  const data = [
    headers,
    ...customers.map(c => [
      c.name,
      c.phone || '-',
      c.email || '-',
      c.loyaltyPoints,
      c.tier?.name || 'Без уровня',
      new Date(c.createdAt).toLocaleDateString('ru-RU')
    ])
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Клиенты');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateSalesReportExcel(transactions: any[], startDate: string, endDate: string) {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['Отчет о продажах'],
    [],
    ['Период', `${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}`],
    [],
    ['Показатель', 'Значение'],
    ['Всего транзакций', transactions.length],
    ['Общая сумма', `${transactions.reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)} ₸`],
    ['Наличные', `${transactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)} ₸`],
    ['Карта', `${transactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)} ₸`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  const transactionHeaders = ['Чек', 'Дата', 'Оплата', 'Сумма', 'Налог', 'Итого', 'Клиент'];
  const transactionData = [
    transactionHeaders,
    ...transactions.map(t => [
      t.receiptNumber,
      new Date(t.createdAt).toLocaleString('ru-RU'),
      t.paymentMethod === 'cash' ? 'Наличные' : 'Карта',
      `${parseFloat(t.subtotal).toFixed(2)} ₸`,
      `${parseFloat(t.tax).toFixed(2)} ₸`,
      `${parseFloat(t.total).toFixed(2)} ₸`,
      t.customer?.name || 'Без клиента'
    ])
  ];

  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Транзакции');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateInventoryReportExcel(products: ProductWithCategory[]) {
  const workbook = XLSX.utils.book_new();

  const lowStock = products.filter(p => p.stock < 10);
  const expiring = products.filter(p => p.expirationDate && new Date(p.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const summaryData = [
    ['Отчет по инвентарю'],
    [],
    ['Показатель', 'Значение'],
    ['Всего товаров', products.length],
    ['Активных', products.filter(p => p.isActive).length],
    ['Низкие остатки', lowStock.length],
    ['Истекают (7 дней)', expiring.length],
    ['Общая стоимость', `${products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0).toFixed(2)} ₸`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  if (lowStock.length > 0) {
    const lowStockData = [
      ['SKU', 'Название', 'Остаток', 'Категория'],
      ...lowStock.map(p => [p.sku, p.name, p.stock, p.category?.name || '-'])
    ];
    const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockData);
    XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Низкие остатки');
  }

  if (expiring.length > 0) {
    const expiringData = [
      ['SKU', 'Название', 'Срок годности', 'Остаток'],
      ...expiring.map(p => [p.sku, p.name, new Date(p.expirationDate!).toLocaleDateString('ru-RU'), p.stock])
    ];
    const expiringSheet = XLSX.utils.aoa_to_sheet(expiringData);
    XLSX.utils.book_append_sheet(workbook, expiringSheet, 'Истекающие');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

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
