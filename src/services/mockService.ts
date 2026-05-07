import {
  Client, Car, Order, Service, Master, SparePart, Warehouse,
  Finance, Appointment, Review, Promotion, Employee, Supplier,
  mockClients, mockCars, mockOrders, mockServices, mockMasters,
  mockSpareParts, mockWarehouses, mockFinances, mockAppointments,
  mockReviews, mockPromotions, mockEmployees, mockSuppliers
} from '@/data/mockData';

// Re-export types for use in components
export type { Client, Car, Order, Service, Master, SparePart, Warehouse, Finance, Appointment, Review, Promotion, Employee, Supplier };

// Утилита для генерации ID
const genId = () => Math.random().toString(36).substr(2, 9);

// Утилита для имитации задержки сети
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// ==================== ХРАНИЛИЩА ДАННЫХ ====================
let clients = [...mockClients];
let cars = [...mockCars];
let orders = [...mockOrders];
let services = [...mockServices];
let masters = [...mockMasters];
let spareParts = [...mockSpareParts];
let warehouses = [...mockWarehouses];
let finances = [...mockFinances];
let appointments = [...mockAppointments];
let reviews = [...mockReviews];
let promotions = [...mockPromotions];
let employees = [...mockEmployees];
let suppliers = [...mockSuppliers];

// ==================== КЛИЕНТЫ ====================
export const clientsService = {
  getAll: async (): Promise<Client[]> => { await delay(); return [...clients]; },
  getById: async (id: string): Promise<Client | null> => { await delay(); return clients.find(c => c.id === id) || null; },
  create: async (data: Omit<Client, 'id'>): Promise<Client> => {
    await delay();
    const item = { ...data, id: genId() };
    clients.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    await delay();
    clients = clients.map(c => c.id === id ? { ...c, ...data } : c);
    return clients.find(c => c.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); clients = clients.filter(c => c.id !== id); },
};

// ==================== АВТОМОБИЛИ ====================
export const carsService = {
  getAll: async (): Promise<Car[]> => { await delay(); return [...cars]; },
  getById: async (id: string): Promise<Car | null> => { await delay(); return cars.find(c => c.id === id) || null; },
  create: async (data: Omit<Car, 'id'>): Promise<Car> => {
    await delay();
    const item = { ...data, id: genId() };
    cars.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Car>): Promise<Car> => {
    await delay();
    cars = cars.map(c => c.id === id ? { ...c, ...data } : c);
    return cars.find(c => c.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); cars = cars.filter(c => c.id !== id); },
};

// ==================== ЗАКАЗ-НАРЯДЫ ====================
export const ordersService = {
  getAll: async (): Promise<Order[]> => { await delay(); return [...orders]; },
  getById: async (id: string): Promise<Order | null> => { await delay(); return orders.find(o => o.id === id) || null; },
  create: async (data: Omit<Order, 'id'>): Promise<Order> => {
    await delay();
    const item = { ...data, id: genId() };
    orders.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    await delay();
    orders = orders.map(o => o.id === id ? { ...o, ...data } : o);
    return orders.find(o => o.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); orders = orders.filter(o => o.id !== id); },
};

// ==================== УСЛУГИ ====================
export const servicesService = {
  getAll: async (): Promise<Service[]> => { await delay(); return [...services]; },
  getById: async (id: string): Promise<Service | null> => { await delay(); return services.find(s => s.id === id) || null; },
  create: async (data: Omit<Service, 'id'>): Promise<Service> => {
    await delay();
    const item = { ...data, id: genId() };
    services.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    await delay();
    services = services.map(s => s.id === id ? { ...s, ...data } : s);
    return services.find(s => s.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); services = services.filter(s => s.id !== id); },
};

// ==================== МАСТЕРА ====================
export const mastersService = {
  getAll: async (): Promise<Master[]> => { await delay(); return [...masters]; },
  getById: async (id: string): Promise<Master | null> => { await delay(); return masters.find(m => m.id === id) || null; },
  create: async (data: Omit<Master, 'id'>): Promise<Master> => {
    await delay();
    const item = { ...data, id: genId() };
    masters.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Master>): Promise<Master> => {
    await delay();
    masters = masters.map(m => m.id === id ? { ...m, ...data } : m);
    return masters.find(m => m.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); masters = masters.filter(m => m.id !== id); },
};

// ==================== ЗАПЧАСТИ ====================
export const sparePartsService = {
  getAll: async (): Promise<SparePart[]> => { await delay(); return [...spareParts]; },
  getById: async (id: string): Promise<SparePart | null> => { await delay(); return spareParts.find(s => s.id === id) || null; },
  create: async (data: Omit<SparePart, 'id'>): Promise<SparePart> => {
    await delay();
    const item = { ...data, id: genId() };
    spareParts.push(item);
    return item;
  },
  update: async (id: string, data: Partial<SparePart>): Promise<SparePart> => {
    await delay();
    spareParts = spareParts.map(s => s.id === id ? { ...s, ...data } : s);
    return spareParts.find(s => s.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); spareParts = spareParts.filter(s => s.id !== id); },
};

// ==================== СКЛАДЫ ====================
export const warehousesService = {
  getAll: async (): Promise<Warehouse[]> => { await delay(); return [...warehouses]; },
  getById: async (id: string): Promise<Warehouse | null> => { await delay(); return warehouses.find(w => w.id === id) || null; },
  create: async (data: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
    await delay();
    const item = { ...data, id: genId() };
    warehouses.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
    await delay();
    warehouses = warehouses.map(w => w.id === id ? { ...w, ...data } : w);
    return warehouses.find(w => w.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); warehouses = warehouses.filter(w => w.id !== id); },
};

// ==================== ФИНАНСЫ ====================
export const financesService = {
  getAll: async (): Promise<Finance[]> => { await delay(); return [...finances]; },
  getById: async (id: string): Promise<Finance | null> => { await delay(); return finances.find(f => f.id === id) || null; },
  create: async (data: Omit<Finance, 'id'>): Promise<Finance> => {
    await delay();
    const item = { ...data, id: genId() };
    finances.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Finance>): Promise<Finance> => {
    await delay();
    finances = finances.map(f => f.id === id ? { ...f, ...data } : f);
    return finances.find(f => f.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); finances = finances.filter(f => f.id !== id); },
};

// ==================== ЗАПИСИ ====================
export const appointmentsService = {
  getAll: async (): Promise<Appointment[]> => { await delay(); return [...appointments]; },
  getById: async (id: string): Promise<Appointment | null> => { await delay(); return appointments.find(a => a.id === id) || null; },
  create: async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
    await delay();
    const item = { ...data, id: genId() };
    appointments.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    await delay();
    appointments = appointments.map(a => a.id === id ? { ...a, ...data } : a);
    return appointments.find(a => a.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); appointments = appointments.filter(a => a.id !== id); },
};

// ==================== ОТЗЫВЫ ====================
export const reviewsService = {
  getAll: async (): Promise<Review[]> => { await delay(); return [...reviews]; },
  getById: async (id: string): Promise<Review | null> => { await delay(); return reviews.find(r => r.id === id) || null; },
  create: async (data: Omit<Review, 'id'>): Promise<Review> => {
    await delay();
    const item = { ...data, id: genId() };
    reviews.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Review>): Promise<Review> => {
    await delay();
    reviews = reviews.map(r => r.id === id ? { ...r, ...data } : r);
    return reviews.find(r => r.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); reviews = reviews.filter(r => r.id !== id); },
};

// ==================== АКЦИИ ====================
export const promotionsService = {
  getAll: async (): Promise<Promotion[]> => { await delay(); return [...promotions]; },
  getById: async (id: string): Promise<Promotion | null> => { await delay(); return promotions.find(p => p.id === id) || null; },
  create: async (data: Omit<Promotion, 'id'>): Promise<Promotion> => {
    await delay();
    const item = { ...data, id: genId() };
    promotions.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    await delay();
    promotions = promotions.map(p => p.id === id ? { ...p, ...data } : p);
    return promotions.find(p => p.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); promotions = promotions.filter(p => p.id !== id); },
};

// ==================== СОТРУДНИКИ ====================
export const employeesService = {
  getAll: async (): Promise<Employee[]> => { await delay(); return [...employees]; },
  getById: async (id: string): Promise<Employee | null> => { await delay(); return employees.find(e => e.id === id) || null; },
  create: async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    await delay();
    const item = { ...data, id: genId() };
    employees.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    await delay();
    employees = employees.map(e => e.id === id ? { ...e, ...data } : e);
    return employees.find(e => e.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); employees = employees.filter(e => e.id !== id); },
};

// ==================== ПОСТАВЩИКИ ====================
export const suppliersService = {
  getAll: async (): Promise<Supplier[]> => { await delay(); return [...suppliers]; },
  getById: async (id: string): Promise<Supplier | null> => { await delay(); return suppliers.find(s => s.id === id) || null; },
  create: async (data: Omit<Supplier, 'id'>): Promise<Supplier> => {
    await delay();
    const item = { ...data, id: genId() };
    suppliers.push(item);
    return item;
  },
  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    await delay();
    suppliers = suppliers.map(s => s.id === id ? { ...s, ...data } : s);
    return suppliers.find(s => s.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); suppliers = suppliers.filter(s => s.id !== id); },
};