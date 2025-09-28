export interface Translation {
  // Navigation
  sidebar: {
    posSystem: string;
    register: string;
    offline: string;
    shiftOpen: string;
    sales: string;
    inventory: string;
    analytics: string;
    customers: string;
    returns: string;
    shift: string;
  };
  
  // Analytics
  analytics: {
    title: string;
    revenue: string;
    transactions: string;
    averageCheck: string;
    offlineOperations: string;
    hourlyRevenue: string;
    topProducts: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    fromYesterday: string;
    waitingSync: string;
  };
  
  // Inventory
  inventory: {
    management: string;
    addProduct: string;
    product: string;
    sku: string;
    price: string;
    stock: string;
    status: string;
    actions: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
  };
  
  // Customers
  customers: {
    customer: string;
    phone: string;
    email: string;
    bonuses: string;
    registrationDate: string;
    addCustomer: string;
    name: string;
    searchCustomers: string;
  };
  
  // Payment
  payment: {
    cash: string;
    card: string;
    cashPayment: string;
    cardPayment: string;
    toPay: string;
    received: string;
    change: string;
    cancel: string;
    complete: string;
  };
  
  // Receipt
  receipt: {
    storeName: string;
    address: string;
    phone: string;
    date: string;
    cashier: string;
    register: string;
    subtotal: string;
    tax: string;
    total: string;
    received: string;
    change: string;
    thankYou: string;
    returnPolicy: string;
    email: string;
    print: string;
  };
  
  // Common
  common: {
    currency: string;
    search: string;
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    close: string;
    pieces: string;
    noData: string;
    success: string;
    error: string;
    cashier: string;
    chartPlaceholder: string;
  };
  
  // Fiscal (Kazakhstan specific)
  fiscal: {
    fiscalMode: string;
    ofdConnected: string;
    ofdDisconnected: string;
    fiscalReceipt: string;
    taxNumber: string;
    fiscalSign: string;
    fiscalPrinter: string;
    ready: string;
    queued: string;
    receipts: string;
    lastSync: string;
    fiscalInfo: string;
    ofdOperator: string;
    checkReceipt: string;
  };
}

export const translations: Record<string, Translation> = {
  ru: {
    sidebar: {
      posSystem: "POS Система",
      register: "Касса #001",
      offline: "Офлайн",
      shiftOpen: "Смена открыта",
      sales: "Продажи",
      inventory: "Товары",
      analytics: "Аналитика",
      customers: "Клиенты",
      returns: "Возвраты",
      shift: "Смена",
    },
    analytics: {
      title: "Аналитика",
      revenue: "Выручка",
      transactions: "Транзакции",
      averageCheck: "Средний чек",
      offlineOperations: "Офлайн операций",
      hourlyRevenue: "Выручка по часам",
      topProducts: "Топ товары",
      today: "Сегодня",
      yesterday: "Вчера",
      thisWeek: "На этой неделе",
      thisMonth: "В этом месяце",
      fromYesterday: "от вчера",
      waitingSync: "Ожидают синхронизации",
    },
    inventory: {
      management: "Управление товарами",
      addProduct: "Добавить новый товар",
      product: "Товар",
      sku: "SKU",
      price: "Цена",
      stock: "Остаток",
      status: "Статус",
      actions: "Действия",
      inStock: "В наличии",
      lowStock: "Мало",
      outOfStock: "Нет в наличии",
    },
    customers: {
      customer: "Клиент",
      phone: "Телефон",
      email: "Email",
      bonuses: "Бонусы",
      registrationDate: "Дата регистрации",
      addCustomer: "Добавить нового клиента",
      name: "Имя",
      searchCustomers: "Поиск клиентов...",
    },
    payment: {
      cash: "наличными",
      card: "картой",
      cashPayment: "Оплата наличными",
      cardPayment: "Оплата картой",
      toPay: "К оплате:",
      received: "Получено:",
      change: "Сдача:",
      cancel: "Отмена",
      complete: "Завершить",
    },
    receipt: {
      storeName: 'Кафе "Уютное место"',
      address: "ул. Пушкина, д. 10",
      phone: "+7 (495) 123-45-67",
      date: "Дата:",
      cashier: "Кассир:",
      register: "Касса:",
      subtotal: "Подытог:",
      tax: "Налог (12%):",
      total: "Итого:",
      received: "Получено:",
      change: "Сдача:",
      thankYou: "Спасибо за покупку!",
      returnPolicy: "Обмен и возврат в течение 14 дней",
      email: "Email",
      print: "Печать",
    },
    common: {
      currency: "₸",
      search: "Поиск",
      add: "Добавить",
      edit: "Редактировать",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      pieces: "шт",
      noData: "Нет данных о продажах",
      success: "Успех",
      error: "Ошибка",
      cashier: "Кассир",
      chartPlaceholder: "График выручки по часам",
    },
    fiscal: {
      fiscalMode: "Фискальный режим",
      ofdConnected: "ОФД подключен",
      ofdDisconnected: "ОФД отключен",
      fiscalReceipt: "Фискальный чек",
      taxNumber: "ИИН/БИН:",
      fiscalSign: "Фискальный признак:",
      fiscalPrinter: "Фискальный принтер",
      ready: "Готов",
      queued: "В очереди",
      receipts: "чеков",
      lastSync: "Последняя синхронизация:",
      fiscalInfo: "Фискальная информация",
      ofdOperator: "ОФД:",
      checkReceipt: "Проверить чек: check.kz",
    },
  },
  
  kk: {
    sidebar: {
      posSystem: "Сату Жүйесі",
      register: "Касса #001",
      offline: "Дербес",
      shiftOpen: "Смена ашық",
      sales: "Сату",
      inventory: "Тауарлар",
      analytics: "Аналитика",
      customers: "Клиенттер",
      returns: "Қайтару",
      shift: "Смена",
    },
    analytics: {
      title: "Аналитика",
      revenue: "Кіріс",
      transactions: "Транзакциялар",
      averageCheck: "Орташа чек",
      offlineOperations: "Дербес операциялар",
      hourlyRevenue: "Сағаттық кіріс",
      topProducts: "Үздік тауарлар",
      today: "Бүгін",
      yesterday: "Кеше",
      thisWeek: "Осы аптада",
      thisMonth: "Осы айда",
      fromYesterday: "кешеден бері",
      waitingSync: "Синхронизацияны күтуде",
    },
    inventory: {
      management: "Тауарларды басқару",
      addProduct: "Жаңа тауар қосу",
      product: "Тауар",
      sku: "SKU",
      price: "Баға",
      stock: "Қалдық",
      status: "Мәртебе",
      actions: "Әрекеттер",
      inStock: "Қоймада бар",
      lowStock: "Аз",
      outOfStock: "Қоймада жоқ",
    },
    customers: {
      customer: "Клиент",
      phone: "Телефон",
      email: "Email",
      bonuses: "Бонустар",
      registrationDate: "Тіркелген күні",
      addCustomer: "Жаңа клиент қосу",
      name: "Аты",
      searchCustomers: "Клиенттерді іздеу...",
    },
    payment: {
      cash: "қолма-қол ақшамен",
      card: "картамен",
      cashPayment: "Қолма-қол төлем",
      cardPayment: "Карта арқылы төлем",
      toPay: "Төлеуге:",
      received: "Алынды:",
      change: "Қайтым:",
      cancel: "Болдырмау",
      complete: "Аяқтау",
    },
    receipt: {
      storeName: '"Жайлы орын" кафесі',
      address: "Пушкин көшесі, 10 үй",
      phone: "+7 (727) 123-45-67",
      date: "Күні:",
      cashier: "Кассир:",
      register: "Касса:",
      subtotal: "Аралық сома:",
      tax: "Салық (12%):",
      total: "Барлығы:",
      received: "Алынды:",
      change: "Қайтым:",
      thankYou: "Сатып алғаныңыз үшін рахмет!",
      returnPolicy: "14 күн ішінде алмасу және қайтару",
      email: "Email",
      print: "Басып шығару",
    },
    common: {
      currency: "₸",
      search: "Іздеу",
      add: "Қосу",
      edit: "Өңдеу",
      delete: "Жою",
      save: "Сақтау",
      cancel: "Болдырмау",
      close: "Жабу",
      pieces: "дана",
      noData: "Сату деректері жоқ",
      success: "Сәтті орындалды",
      error: "Қате",
      cashier: "Кассир",
      chartPlaceholder: "Сағаттық кіріс графигі",
    },
    fiscal: {
      fiscalMode: "Фискалды режим",
      ofdConnected: "ФДО қосылған",
      ofdDisconnected: "ФДО ажыратылған",
      fiscalReceipt: "Фискалды чек",
      taxNumber: "ЖСН/БСН:",
      fiscalSign: "Фискалды белгі:",
      fiscalPrinter: "Фискалды принтер",
      ready: "Дайын",
      queued: "Кезекте",
      receipts: "чектер",
      lastSync: "Соңғы синхронизация:",
      fiscalInfo: "Фискалды ақпарат",
      ofdOperator: "ФДО:",
      checkReceipt: "Чекті тексеру: check.kz",
    },
  },
  
  en: {
    sidebar: {
      posSystem: "POS System",
      register: "Register #001",
      offline: "Offline",
      shiftOpen: "Shift Open",
      sales: "Sales",
      inventory: "Inventory",
      analytics: "Analytics",
      customers: "Customers",
      returns: "Returns",
      shift: "Shift",
    },
    analytics: {
      title: "Analytics",
      revenue: "Revenue",
      transactions: "Transactions",
      averageCheck: "Average Check",
      offlineOperations: "Offline Operations",
      hourlyRevenue: "Hourly Revenue",
      topProducts: "Top Products",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      fromYesterday: "from yesterday",
      waitingSync: "Waiting for sync",
    },
    inventory: {
      management: "Product Management",
      addProduct: "Add New Product",
      product: "Product",
      sku: "SKU",
      price: "Price",
      stock: "Stock",
      status: "Status",
      actions: "Actions",
      inStock: "In Stock",
      lowStock: "Low Stock",
      outOfStock: "Out of Stock",
    },
    customers: {
      customer: "Customer",
      phone: "Phone",
      email: "Email",
      bonuses: "Bonuses",
      registrationDate: "Registration Date",
      addCustomer: "Add New Customer",
      name: "Name",
      searchCustomers: "Search customers...",
    },
    payment: {
      cash: "cash",
      card: "card",
      cashPayment: "Cash Payment",
      cardPayment: "Card Payment",
      toPay: "To Pay:",
      received: "Received:",
      change: "Change:",
      cancel: "Cancel",
      complete: "Complete",
    },
    receipt: {
      storeName: '"Cozy Place" Cafe',
      address: "10 Pushkin Street",
      phone: "+7 (727) 123-45-67",
      date: "Date:",
      cashier: "Cashier:",
      register: "Register:",
      subtotal: "Subtotal:",
      tax: "Tax (12%):",
      total: "Total:",
      received: "Received:",
      change: "Change:",
      thankYou: "Thank you for your purchase!",
      returnPolicy: "Exchange and return within 14 days",
      email: "Email",
      print: "Print",
    },
    common: {
      currency: "₸",
      search: "Search",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      pieces: "pcs",
      noData: "No sales data",
      success: "Success",
      error: "Error",
      cashier: "Cashier",
      chartPlaceholder: "Hourly revenue chart",
    },
    fiscal: {
      fiscalMode: "Fiscal Mode",
      ofdConnected: "OFD Connected",
      ofdDisconnected: "OFD Disconnected",
      fiscalReceipt: "Fiscal Receipt",
      taxNumber: "Tax Number:",
      fiscalSign: "Fiscal Sign:",
      fiscalPrinter: "Fiscal Printer",
      ready: "Ready",
      queued: "Queued",
      receipts: "receipts",
      lastSync: "Last sync:",
      fiscalInfo: "Fiscal Information",
      ofdOperator: "OFD:",
      checkReceipt: "Check receipt: check.kz",
    },
  },
};