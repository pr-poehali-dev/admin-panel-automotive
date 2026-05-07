// ==================== ТИПЫ ====================

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  registeredAt: string;
  loyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalSpent: number;
  notes: string;
}

export interface Car {
  id: string;
  clientId: string;
  clientName: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  mileage: number;
  lastService: string;
  status: 'active' | 'inactive';
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  carId: string;
  carInfo: string;
  masterId: string;
  masterName: string;
  status: 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  estimatedDate: string;
  completedAt: string | null;
  totalAmount: number;
  services: string[];
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  popularity: number;
}

export interface Master {
  id: string;
  name: string;
  position: string;
  specialization: string[];
  phone: string;
  email: string;
  hireDate: string;
  rating: number;
  completedOrders: number;
  status: 'active' | 'vacation' | 'sick' | 'fired';
  salary: number;
}

export interface SparePart {
  id: string;
  article: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  salePrice: number;
  supplier: string;
  location: string;
  lastUpdated: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  responsible: string;
  totalItems: number;
  totalValue: number;
  status: 'active' | 'inactive';
  lastInventory: string;
}

export interface Finance {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  orderId: string | null;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'paid' | 'pending' | 'cancelled';
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  carInfo: string;
  serviceType: string;
  masterId: string;
  masterName: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  orderId: string;
  rating: number;
  text: string;
  date: string;
  status: 'published' | 'hidden' | 'pending';
  reply: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'gift' | 'cashback' | 'bonus';
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
  services: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'master' | 'cashier';
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string[];
  rating: number;
  status: 'active' | 'inactive';
  totalOrders: number;
  lastOrder: string;
}

// ==================== МОКОВЫЕ ДАННЫЕ ====================

export const mockClients: Client[] = [
  { id: '1', name: 'Иванов Алексей Петрович', phone: '+7 (900) 123-45-67', email: 'ivanov@mail.ru', address: 'г. Москва, ул. Ленина, 15, кв. 42', birthDate: '1985-03-15', registeredAt: '2022-01-10', loyaltyLevel: 'gold', totalOrders: 24, totalSpent: 185000, notes: 'Постоянный клиент, предпочитает звонок за день до записи' },
  { id: '2', name: 'Петрова Мария Сергеевна', phone: '+7 (910) 234-56-78', email: 'petrova@gmail.com', address: 'г. Москва, пр. Мира, 88, кв. 15', birthDate: '1990-07-22', registeredAt: '2022-06-15', loyaltyLevel: 'silver', totalOrders: 12, totalSpent: 94000, notes: '' },
  { id: '3', name: 'Сидоров Дмитрий Николаевич', phone: '+7 (920) 345-67-89', email: 'sidorov@yandex.ru', address: 'г. Москва, ул. Садовая, 3', birthDate: '1978-11-05', registeredAt: '2021-09-20', loyaltyLevel: 'platinum', totalOrders: 48, totalSpent: 420000, notes: 'VIP-клиент, корпоративный договор с ООО "СтройИнвест"' },
  { id: '4', name: 'Козлова Анна Игоревна', phone: '+7 (930) 456-78-90', email: 'kozlova@mail.ru', address: 'г. Москва, ул. Тверская, 22', birthDate: '1995-02-28', registeredAt: '2023-03-08', loyaltyLevel: 'bronze', totalOrders: 3, totalSpent: 18500, notes: '' },
  { id: '5', name: 'Новиков Олег Александрович', phone: '+7 (940) 567-89-01', email: 'novikov@gmail.com', address: 'г. Москва, Арбат, 10', birthDate: '1982-06-14', registeredAt: '2022-11-30', loyaltyLevel: 'silver', totalOrders: 9, totalSpent: 67000, notes: 'Приезжает только на выходных' },
  { id: '6', name: 'Морозова Елена Викторовна', phone: '+7 (950) 678-90-12', email: 'morozova@yandex.ru', address: 'г. Москва, ул. Профсоюзная, 55', birthDate: '1988-09-03', registeredAt: '2023-01-17', loyaltyLevel: 'bronze', totalOrders: 5, totalSpent: 32000, notes: '' },
  { id: '7', name: 'Волков Игорь Михайлович', phone: '+7 (960) 789-01-23', email: 'volkov@mail.ru', address: 'г. Москва, Рублёвское шоссе, 12', birthDate: '1975-12-18', registeredAt: '2021-04-25', loyaltyLevel: 'platinum', totalOrders: 60, totalSpent: 720000, notes: 'Три автомобиля, всегда заказывает детейлинг' },
  { id: '8', name: 'Кузнецова Светлана Борисовна', phone: '+7 (970) 890-12-34', email: 'kuznetsova@gmail.com', address: 'г. Москва, ул. Маросейка, 8', birthDate: '1993-04-11', registeredAt: '2023-07-02', loyaltyLevel: 'bronze', totalOrders: 2, totalSpent: 11000, notes: '' },
];

export const mockCars: Car[] = [
  { id: '1', clientId: '1', clientName: 'Иванов Алексей Петрович', brand: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'А123БВ 77', vin: 'JT2BK1BA70C123456', color: 'Белый перламутр', mileage: 85000, lastService: '2024-08-15', status: 'active' },
  { id: '2', clientId: '2', clientName: 'Петрова Мария Сергеевна', brand: 'Hyundai', model: 'Solaris', year: 2021, licensePlate: 'Б456ГД 77', vin: 'KMHCM41BBBU123789', color: 'Серебристый', mileage: 42000, lastService: '2024-09-20', status: 'active' },
  { id: '3', clientId: '3', clientName: 'Сидоров Дмитрий Николаевич', brand: 'BMW', model: 'X5', year: 2022, licensePlate: 'В789ЕЖ 77', vin: '5UXCR4C51KLL12345', color: 'Чёрный сапфир', mileage: 35000, lastService: '2024-10-01', status: 'active' },
  { id: '4', clientId: '3', clientName: 'Сидоров Дмитрий Николаевич', brand: 'Mercedes-Benz', model: 'E-Class', year: 2021, licensePlate: 'Г012ЗИ 77', vin: 'WDDHF8JB0CA456789', color: 'Тёмно-синий', mileage: 58000, lastService: '2024-07-10', status: 'active' },
  { id: '5', clientId: '4', clientName: 'Козлова Анна Игоревна', brand: 'Kia', model: 'Rio', year: 2019, licensePlate: 'Д345КЛ 77', vin: 'KNAFE221395123456', color: 'Красный', mileage: 92000, lastService: '2024-06-05', status: 'active' },
  { id: '6', clientId: '5', clientName: 'Новиков Олег Александрович', brand: 'Volkswagen', model: 'Polo', year: 2018, licensePlate: 'Е678МН 77', vin: 'WVWZZZ6RZKY123456', color: 'Синий', mileage: 105000, lastService: '2024-05-20', status: 'active' },
  { id: '7', clientId: '7', clientName: 'Волков Игорь Михайлович', brand: 'Porsche', model: 'Cayenne', year: 2023, licensePlate: 'Ж901ОП 77', vin: 'WP1ZZZ9YZLA123456', color: 'Графитовый', mileage: 12000, lastService: '2024-10-15', status: 'active' },
  { id: '8', clientId: '6', clientName: 'Морозова Елена Викторовна', brand: 'Lada', model: 'Vesta', year: 2020, licensePlate: 'З234РС 77', vin: 'XTA219700M1234567', color: 'Белый', mileage: 67000, lastService: '2024-04-12', status: 'active' },
];

export const mockMasters: Master[] = [
  { id: '1', name: 'Захаров Виктор Анатольевич', position: 'Старший механик', specialization: ['Двигатель', 'Трансмиссия', 'Диагностика'], phone: '+7 (901) 111-22-33', email: 'zaharov@sto.ru', hireDate: '2018-03-15', rating: 4.9, completedOrders: 1245, status: 'active', salary: 95000 },
  { id: '2', name: 'Лебедев Павел Игоревич', position: 'Механик', specialization: ['Тормозная система', 'Ходовая часть', 'Подвеска'], phone: '+7 (902) 222-33-44', email: 'lebedev@sto.ru', hireDate: '2020-07-01', rating: 4.7, completedOrders: 687, status: 'active', salary: 75000 },
  { id: '3', name: 'Попов Антон Владимирович', position: 'Электрик', specialization: ['Электрика', 'Мультимедиа', 'Сигнализация'], phone: '+7 (903) 333-44-55', email: 'popov@sto.ru', hireDate: '2019-11-20', rating: 4.8, completedOrders: 934, status: 'active', salary: 85000 },
  { id: '4', name: 'Никитин Сергей Романович', position: 'Шиномонтажник', specialization: ['Шиномонтаж', 'Балансировка', 'Развал-схождение'], phone: '+7 (904) 444-55-66', email: 'nikitin@sto.ru', hireDate: '2021-02-10', rating: 4.6, completedOrders: 423, status: 'active', salary: 65000 },
  { id: '5', name: 'Алексеев Дмитрий Сергеевич', position: 'Кузовщик', specialization: ['Кузовной ремонт', 'Покраска', 'Антикор'], phone: '+7 (905) 555-66-77', email: 'alekseev@sto.ru', hireDate: '2017-08-05', rating: 4.9, completedOrders: 1567, status: 'active', salary: 110000 },
  { id: '6', name: 'Фёдоров Иван Борисович', position: 'Механик', specialization: ['ТО', 'Замена масла', 'Фильтры'], phone: '+7 (906) 666-77-88', email: 'fedorov@sto.ru', hireDate: '2022-05-15', rating: 4.5, completedOrders: 289, status: 'vacation', salary: 70000 },
];

export const mockServices: Service[] = [
  { id: '1', name: 'Замена масла и фильтра', category: 'Техническое обслуживание', description: 'Замена моторного масла и масляного фильтра с проверкой основных систем', price: 2500, duration: 60, isActive: true, popularity: 95 },
  { id: '2', name: 'Диагностика двигателя', category: 'Диагностика', description: 'Компьютерная диагностика двигателя, считывание ошибок', price: 1500, duration: 45, isActive: true, popularity: 87 },
  { id: '3', name: 'Замена тормозных колодок', category: 'Тормозная система', description: 'Замена передних или задних тормозных колодок', price: 3500, duration: 90, isActive: true, popularity: 78 },
  { id: '4', name: 'Шиномонтаж (4 колеса)', category: 'Шиномонтаж', description: 'Монтаж/демонтаж покрышек, балансировка 4 колёс', price: 2800, duration: 60, isActive: true, popularity: 92 },
  { id: '5', name: 'Развал-схождение', category: 'Ходовая часть', description: 'Регулировка углов установки колёс на стенде 3D', price: 3200, duration: 75, isActive: true, popularity: 71 },
  { id: '6', name: 'Замена ремня ГРМ', category: 'Двигатель', description: 'Замена ремня или цепи ГРМ с роликами и помпой', price: 12000, duration: 240, isActive: true, popularity: 55 },
  { id: '7', name: 'Кузовной ремонт (вмятина)', category: 'Кузов', description: 'Устранение вмятин без покраски (PDR)', price: 5000, duration: 120, isActive: true, popularity: 63 },
  { id: '8', name: 'Полная мойка и детейлинг', category: 'Детейлинг', description: 'Мойка, химчистка салона, полировка кузова', price: 8000, duration: 180, isActive: true, popularity: 45 },
  { id: '9', name: 'Замена аккумулятора', category: 'Электрика', description: 'Диагностика и замена аккумулятора с проверкой генератора', price: 1200, duration: 30, isActive: true, popularity: 68 },
  { id: '10', name: 'Техническое обслуживание (ТО-1)', category: 'Техническое обслуживание', description: 'Полное ТО по регламенту производителя', price: 8500, duration: 180, isActive: true, popularity: 82 },
  { id: '11', name: 'Замена свечей зажигания', category: 'Двигатель', description: 'Замена свечей зажигания (4 цилиндра)', price: 2000, duration: 45, isActive: true, popularity: 74 },
  { id: '12', name: 'Антикоррозийная обработка', category: 'Кузов', description: 'Обработка кузова и днища антикором', price: 6500, duration: 150, isActive: false, popularity: 38 },
];

export const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ЗН-2024-001', clientId: '1', clientName: 'Иванов Алексей Петрович', carId: '1', carInfo: 'Toyota Camry 2020 (А123БВ 77)', masterId: '1', masterName: 'Захаров В.А.', status: 'completed', priority: 'medium', createdAt: '2024-10-01', estimatedDate: '2024-10-01', completedAt: '2024-10-01', totalAmount: 4000, services: ['Замена масла и фильтра', 'Диагностика двигателя'], notes: 'Клиент просил проверить тормоза' },
  { id: '2', orderNumber: 'ЗН-2024-002', clientId: '3', clientName: 'Сидоров Дмитрий Николаевич', carId: '3', carInfo: 'BMW X5 2022 (В789ЕЖ 77)', masterId: '5', masterName: 'Алексеев Д.С.', status: 'in_progress', priority: 'high', createdAt: '2024-10-15', estimatedDate: '2024-10-17', completedAt: null, totalAmount: 25000, services: ['Кузовной ремонт (вмятина)', 'Полная мойка и детейлинг'], notes: 'Повреждение заднего бампера' },
  { id: '3', orderNumber: 'ЗН-2024-003', clientId: '2', clientName: 'Петрова Мария Сергеевна', carId: '2', carInfo: 'Hyundai Solaris 2021 (Б456ГД 77)', masterId: '4', masterName: 'Никитин С.Р.', status: 'ready', priority: 'low', createdAt: '2024-10-14', estimatedDate: '2024-10-15', completedAt: null, totalAmount: 2800, services: ['Шиномонтаж (4 колеса)'], notes: 'Сезонная смена резины' },
  { id: '4', orderNumber: 'ЗН-2024-004', clientId: '7', clientName: 'Волков Игорь Михайлович', carId: '7', carInfo: 'Porsche Cayenne 2023 (Ж901ОП 77)', masterId: '3', masterName: 'Попов А.В.', status: 'new', priority: 'urgent', createdAt: '2024-10-16', estimatedDate: '2024-10-16', completedAt: null, totalAmount: 15000, services: ['Диагностика двигателя', 'Замена аккумулятора'], notes: 'Не запускается двигатель' },
  { id: '5', orderNumber: 'ЗН-2024-005', clientId: '4', clientName: 'Козлова Анна Игоревна', carId: '5', carInfo: 'Kia Rio 2019 (Д345КЛ 77)', masterId: '2', masterName: 'Лебедев П.И.', status: 'in_progress', priority: 'medium', createdAt: '2024-10-15', estimatedDate: '2024-10-16', completedAt: null, totalAmount: 6700, services: ['Замена тормозных колодок', 'Развал-схождение'], notes: '' },
  { id: '6', orderNumber: 'ЗН-2024-006', clientId: '5', clientName: 'Новиков Олег Александрович', carId: '6', carInfo: 'VW Polo 2018 (Е678МН 77)', masterId: '1', masterName: 'Захаров В.А.', status: 'completed', priority: 'medium', createdAt: '2024-10-10', estimatedDate: '2024-10-11', completedAt: '2024-10-11', totalAmount: 8500, services: ['Техническое обслуживание (ТО-1)'], notes: '' },
];

export const mockSpareParts: SparePart[] = [
  { id: '1', article: 'OIL-5W30-4L', name: 'Масло моторное Shell 5W-30 4л', brand: 'Shell', category: 'Масла и жидкости', quantity: 45, minQuantity: 10, price: 2100, salePrice: 2800, supplier: 'АвтоХим', location: 'Стеллаж А1', lastUpdated: '2024-10-10' },
  { id: '2', article: 'FLT-OIL-TOY', name: 'Фильтр масляный Toyota', brand: 'Toyota', category: 'Фильтры', quantity: 12, minQuantity: 5, price: 450, salePrice: 650, supplier: 'Японские запчасти', location: 'Стеллаж Б2', lastUpdated: '2024-10-08' },
  { id: '3', article: 'BRK-PAD-F-BMW', name: 'Колодки тормозные передние BMW X5', brand: 'Brembo', category: 'Тормозная система', quantity: 8, minQuantity: 3, price: 3200, salePrice: 4500, supplier: 'ЕвроАвто', location: 'Стеллаж В3', lastUpdated: '2024-10-12' },
  { id: '4', article: 'SPARK-NGK-4', name: 'Свечи NGK Iridium (4 шт)', brand: 'NGK', category: 'Электрика', quantity: 20, minQuantity: 8, price: 1800, salePrice: 2500, supplier: 'ЕвроАвто', location: 'Стеллаж Г1', lastUpdated: '2024-10-05' },
  { id: '5', article: 'BELT-GRM-VAZ', name: 'Ремень ГРМ Lada Vesta', brand: 'Gates', category: 'Двигатель', quantity: 6, minQuantity: 2, price: 1200, salePrice: 1800, supplier: 'АвтоДеталь', location: 'Стеллаж А3', lastUpdated: '2024-09-28' },
  { id: '6', article: 'TRE-235-55R18', name: 'Шина Michelin 235/55 R18', brand: 'Michelin', category: 'Шины', quantity: 0, minQuantity: 4, price: 8500, salePrice: 11000, supplier: 'ШинПром', location: 'Склад Б', lastUpdated: '2024-10-01' },
  { id: '7', article: 'BAT-60AH-VARTA', name: 'Аккумулятор Varta Silver 60Ah', brand: 'Varta', category: 'Электрика', quantity: 5, minQuantity: 2, price: 5800, salePrice: 7500, supplier: 'ЕвроАвто', location: 'Стеллаж Д2', lastUpdated: '2024-10-14' },
  { id: '8', article: 'ANT-BITUM-2L', name: 'Антикор битумный Мовил 2л', brand: 'Мовил', category: 'Химия', quantity: 18, minQuantity: 5, price: 450, salePrice: 700, supplier: 'АвтоХим', location: 'Стеллаж Е1', lastUpdated: '2024-09-20' },
];

export const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Основной склад', location: 'Бокс №1, стеллажи А-Д', responsible: 'Кладовщик Фёдоров', totalItems: 342, totalValue: 1250000, status: 'active', lastInventory: '2024-10-01' },
  { id: '2', name: 'Склад шин', location: 'Отдельное помещение, ул. Гаражная, 5', responsible: 'Никитин С.Р.', totalItems: 88, totalValue: 680000, status: 'active', lastInventory: '2024-09-15' },
  { id: '3', name: 'Склад масел и химии', location: 'Бокс №3, стеллажи Е-Ж', responsible: 'Лебедев П.И.', totalItems: 156, totalValue: 320000, status: 'active', lastInventory: '2024-10-10' },
  { id: '4', name: 'Архивный склад', location: 'Подвальное помещение', responsible: 'Управляющий', totalItems: 45, totalValue: 85000, status: 'inactive', lastInventory: '2024-07-01' },
];

export const mockFinances: Finance[] = [
  { id: '1', type: 'income', category: 'Оплата услуг', description: 'Оплата заказ-наряда ЗН-2024-001', amount: 4000, date: '2024-10-01', orderId: '1', paymentMethod: 'card', status: 'paid' },
  { id: '2', type: 'income', category: 'Оплата услуг', description: 'Оплата заказ-наряда ЗН-2024-006', amount: 8500, date: '2024-10-11', orderId: '6', paymentMethod: 'cash', status: 'paid' },
  { id: '3', type: 'expense', category: 'Закупка запчастей', description: 'Закупка масел Shell и фильтров', amount: 52000, date: '2024-10-08', orderId: null, paymentMethod: 'transfer', status: 'paid' },
  { id: '4', type: 'expense', category: 'Заработная плата', description: 'Зарплата мастеров за октябрь (аванс)', amount: 215000, date: '2024-10-15', orderId: null, paymentMethod: 'transfer', status: 'paid' },
  { id: '5', type: 'expense', category: 'Аренда', description: 'Аренда помещения за октябрь 2024', amount: 85000, date: '2024-10-01', orderId: null, paymentMethod: 'transfer', status: 'paid' },
  { id: '6', type: 'income', category: 'Продажа запчастей', description: 'Продажа шин Michelin клиенту', amount: 44000, date: '2024-10-12', orderId: null, paymentMethod: 'card', status: 'paid' },
  { id: '7', type: 'expense', category: 'Коммунальные услуги', description: 'Электроэнергия и вода за октябрь', amount: 18500, date: '2024-10-10', orderId: null, paymentMethod: 'transfer', status: 'pending' },
  { id: '8', type: 'income', category: 'Оплата услуг', description: 'Предоплата заказ-наряда ЗН-2024-004', amount: 7500, date: '2024-10-16', orderId: '4', paymentMethod: 'card', status: 'paid' },
];

export const mockAppointments: Appointment[] = [
  { id: '1', clientId: '1', clientName: 'Иванов Алексей Петрович', phone: '+7 (900) 123-45-67', carInfo: 'Toyota Camry 2020', serviceType: 'Техническое обслуживание', masterId: '1', masterName: 'Захаров В.А.', date: '2024-10-18', time: '09:00', duration: 60, status: 'confirmed', notes: '' },
  { id: '2', clientId: '2', clientName: 'Петрова Мария Сергеевна', phone: '+7 (910) 234-56-78', carInfo: 'Hyundai Solaris 2021', serviceType: 'Диагностика', masterId: '3', masterName: 'Попов А.В.', date: '2024-10-18', time: '10:30', duration: 45, status: 'scheduled', notes: 'Горит Check Engine' },
  { id: '3', clientId: '5', clientName: 'Новиков Олег Александрович', phone: '+7 (940) 567-89-01', carInfo: 'VW Polo 2018', serviceType: 'Шиномонтаж', masterId: '4', masterName: 'Никитин С.Р.', date: '2024-10-19', time: '11:00', duration: 60, status: 'scheduled', notes: 'Нужна замена на зимнюю резину' },
  { id: '4', clientId: '7', clientName: 'Волков Игорь Михайлович', phone: '+7 (960) 789-01-23', carInfo: 'Porsche Cayenne 2023', serviceType: 'Детейлинг', masterId: '5', masterName: 'Алексеев Д.С.', date: '2024-10-20', time: '09:00', duration: 180, status: 'confirmed', notes: 'Полная полировка' },
  { id: '5', clientId: '6', clientName: 'Морозова Елена Викторовна', phone: '+7 (950) 678-90-12', carInfo: 'Lada Vesta 2020', serviceType: 'Замена масла', masterId: '6', masterName: 'Фёдоров И.Б.', date: '2024-10-17', time: '14:00', duration: 60, status: 'completed', notes: '' },
  { id: '6', clientId: '8', clientName: 'Кузнецова Светлана Борисовна', phone: '+7 (970) 890-12-34', carInfo: 'Не указан', serviceType: 'Консультация', masterId: '1', masterName: 'Захаров В.А.', date: '2024-10-21', time: '15:00', duration: 30, status: 'scheduled', notes: 'Первый визит, хочет оценку ремонта' },
];

export const mockReviews: Review[] = [
  { id: '1', clientId: '1', clientName: 'Иванов Алексей Петрович', orderId: '6', rating: 5, text: 'Отличный сервис! Всё сделали быстро и качественно. Захаров Виктор — профессионал своего дела. Буду рекомендовать всем знакомым!', date: '2024-10-12', status: 'published', reply: 'Алексей Петрович, спасибо за доверие! Ждём вас снова!' },
  { id: '2', clientId: '2', clientName: 'Петрова Мария Сергеевна', orderId: '3', rating: 4, text: 'Шиномонтаж сделали хорошо, но пришлось немного подождать. В целом всё отлично, персонал вежливый.', date: '2024-10-15', status: 'published', reply: null },
  { id: '3', clientId: '7', clientName: 'Волков Игорь Михайлович', orderId: '1', rating: 5, text: 'Пользуюсь услугами этого СТО уже 3 года. Всегда всем доволен. Особенно ценю честность мастеров — никогда не навязывают лишнего.', date: '2024-09-28', status: 'published', reply: 'Игорь Михайлович, вы наш любимый клиент! Всегда рады вас видеть.' },
  { id: '4', clientId: '4', clientName: 'Козлова Анна Игоревна', orderId: '5', rating: 3, text: 'Сделали, но дольше чем обещали. Хотелось бы более точного расчёта времени.', date: '2024-10-16', status: 'pending', reply: null },
  { id: '5', clientId: '6', clientName: 'Морозова Елена Викторовна', orderId: '2', rating: 2, text: 'Плохо. Машину задержали на 2 дня, объяснений не давали. Больше не приеду.', date: '2024-10-14', status: 'hidden', reply: 'Елена Викторовна, приносим извинения за неудобства. Проблема решена. Готовы предложить скидку на следующее обслуживание.' },
];

export const mockPromotions: Promotion[] = [
  { id: '1', title: 'Сезонный шиномонтаж', description: 'Скидка 20% на шиномонтаж и балансировку в октябре-ноябре', type: 'discount', value: 20, startDate: '2024-10-01', endDate: '2024-11-30', isActive: true, usageCount: 47, maxUsage: 200, services: ['Шиномонтаж (4 колеса)', 'Развал-схождение'] },
  { id: '2', title: 'Приведи друга', description: 'Получите 1000 руб. на счёт за каждого приведённого клиента', type: 'cashback', value: 1000, startDate: '2024-09-01', endDate: '2024-12-31', isActive: true, usageCount: 23, maxUsage: 1000, services: [] },
  { id: '3', title: 'ТО в подарок (2 визита)', description: 'При заказе ТО-1 второй визит (ТО-2) со скидкой 50%', type: 'discount', value: 50, startDate: '2024-10-15', endDate: '2024-12-15', isActive: true, usageCount: 8, maxUsage: 50, services: ['Техническое обслуживание (ТО-1)'] },
  { id: '4', title: 'День рождения клиента', description: 'Скидка 15% на все услуги в день рождения и ±3 дня', type: 'discount', value: 15, startDate: '2024-01-01', endDate: '2024-12-31', isActive: true, usageCount: 34, maxUsage: 999, services: [] },
  { id: '5', title: 'Летняя акция (завершена)', description: 'Бесплатная мойка при заказе любой услуги от 3000 руб.', type: 'gift', value: 1, startDate: '2024-06-01', endDate: '2024-08-31', isActive: false, usageCount: 156, maxUsage: 300, services: [] },
];

export const mockEmployees: Employee[] = [
  { id: '1', name: 'Смирнов Александр Юрьевич', role: 'admin', email: 'admin@sto.ru', phone: '+7 (901) 000-11-22', department: 'Администрация', status: 'active', lastLogin: '2024-10-16 09:15', permissions: ['all'] },
  { id: '2', name: 'Громова Наталья Ивановна', role: 'manager', email: 'manager@sto.ru', phone: '+7 (901) 000-33-44', department: 'Управление', status: 'active', lastLogin: '2024-10-16 08:45', permissions: ['clients', 'orders', 'appointments', 'reports'] },
  { id: '3', name: 'Тихонов Роман Васильевич', role: 'cashier', email: 'cashier@sto.ru', phone: '+7 (901) 000-55-66', department: 'Касса', status: 'active', lastLogin: '2024-10-15 18:30', permissions: ['finance', 'orders_read'] },
  { id: '4', name: 'Захаров Виктор Анатольевич', role: 'master', email: 'zaharov@sto.ru', phone: '+7 (901) 111-22-33', department: 'Автосервис', status: 'active', lastLogin: '2024-10-16 07:00', permissions: ['orders', 'parts_read'] },
];

export const mockSuppliers: Supplier[] = [
  { id: '1', name: 'ЕвроАвто Запчасти', contactPerson: 'Белов Константин', phone: '+7 (495) 100-20-30', email: 'sales@euroauto.ru', address: 'г. Москва, ул. Промышленная, 15', category: ['Тормозная система', 'Электрика', 'Двигатель'], rating: 4.8, status: 'active', totalOrders: 145, lastOrder: '2024-10-12' },
  { id: '2', name: 'АвтоХим', contactPerson: 'Жуков Павел', phone: '+7 (495) 200-30-40', email: 'zakaz@avtohim.ru', address: 'г. Москва, Варшавское шоссе, 88', category: ['Масла и жидкости', 'Химия', 'Антикор'], rating: 4.6, status: 'active', totalOrders: 89, lastOrder: '2024-10-08' },
  { id: '3', name: 'ШинПром', contactPerson: 'Орлова Валерия', phone: '+7 (495) 300-40-50', email: 'info@shinprom.ru', address: 'г. Москва, ул. Дорожная, 5', category: ['Шины', 'Диски'], rating: 4.5, status: 'active', totalOrders: 67, lastOrder: '2024-10-01' },
  { id: '4', name: 'Японские запчасти', contactPerson: 'Фомин Артём', phone: '+7 (495) 400-50-60', email: 'japan@jp-parts.ru', address: 'г. Москва, Рязанский проспект, 22', category: ['Фильтры', 'Двигатель', 'Трансмиссия'], rating: 4.9, status: 'active', totalOrders: 112, lastOrder: '2024-10-14' },
  { id: '5', name: 'АвтоДеталь', contactPerson: 'Круглов Сергей', phone: '+7 (495) 500-60-70', email: 's.kruglov@autodet.ru', address: 'г. Москва, ул. Складская, 3', category: ['Двигатель', 'Кузов', 'Подвеска'], rating: 4.2, status: 'inactive', totalOrders: 34, lastOrder: '2024-08-20' },
];
