import { api, setToken } from './client';
import type {
  Category, Employee, ModifierGroup, Product, Order, Shift, CashMovement, BrandSettings,
  PaymentMethod, CartLineMod,
} from '../lib/types';

// Backend row shapes may include extra fields (like pinHash won't be there thanks to sanitizing routes).

export async function login(pin: string) {
  const r = await api<{ token: string; employee: { id: string; name: string; role: 'barista' | 'owner' } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ pin }) }
  );
  setToken(r.token);
  return r.employee;
}

export function logout() {
  setToken(null);
}

export async function me() {
  return api<{ id: string; name: string; role: 'barista' | 'owner' }>('/auth/me');
}

export async function getMenu() {
  return api<{
    categories: Category[];
    products: Product[];
    modifierGroups: ModifierGroup[];
  }>('/menu');
}

export async function getBrand() {
  return api<Partial<BrandSettings>>('/settings/brand');
}

export async function getCurrentShift() {
  return api<{ shift: Shift | null; stats: ShiftStats | null }>('/shifts/current');
}

export interface ShiftStats {
  revenueCash: number;
  revenueTransfer: number;
  revenueTotal: number;
  checks: number;
  collections: number;
  deposits: number;
  expectedCash: number;
  diff: number | null;
}

export async function openShift(cashStart: number) {
  return api<{ shift: Shift }>('/shifts/open', { method: 'POST', body: JSON.stringify({ cashStart }) });
}

export async function closeShift(cashCounted: number) {
  return api<{ shift: Shift; stats: ShiftStats }>('/shifts/close', {
    method: 'POST', body: JSON.stringify({ cashCounted }),
  });
}

export async function listShifts() {
  return api<{ shifts: (Shift & { stats: ShiftStats })[] }>('/shifts');
}

export async function getShift(id: string) {
  return api<{ shift: Shift & { orders: Order[]; cashMovements: CashMovement[] }; stats: ShiftStats }>(`/shifts/${id}`);
}

export interface OrderPayloadItem {
  productId: string;
  qty: number;
  mods: CartLineMod[];
}

export async function createOrder(payload: {
  items: OrderPayloadItem[];
  paymentMethod: PaymentMethod;
  cashReceived?: number;
}) {
  return api<{ order: Order }>('/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getReceipt(id: string) {
  return api<{ order: Order; brand: Partial<BrandSettings>; receiptUrl: string }>(`/orders/${id}/receipt`);
}

export async function addCashMovement(payload: {
  type: 'collection' | 'deposit';
  amount: number;
  comment?: string;
}) {
  return api<{ movement: CashMovement }>('/cash-movements', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listCashMovements(shiftId?: string) {
  const q = shiftId ? `?shiftId=${encodeURIComponent(shiftId)}` : '';
  return api<{ movements: CashMovement[] }>(`/cash-movements${q}`);
}

export interface PeriodReport {
  revenueCash: number; revenueTransfer: number; revenueTotal: number;
  checks: number; avg: number; collections: number; deposits: number;
  byHour: Record<string, number>;
  byDay?: Record<string, number>;
  top: Array<{ name: string; qty: number; revenue: number; discountedQty?: number; discountedRevenue?: number }>;
  topDiscounted?: Array<{ name: string; discount: number; qty: number; revenue: number }>;
  shifts: (Shift & { openedByName: string })[];
}

export async function getDayReport(date: string) {
  return api<PeriodReport>(`/reports/day?date=${date}`);
}

export async function getPeriodReport(from: string, to: string) {
  return api<PeriodReport>(`/reports/period?from=${from}&to=${to}`);
}

// Products / categories
export async function listProducts() {
  return api<{ products: Product[] }>('/products');
}
export async function createProductApi(payload: Omit<Product, 'id' | 'isActive'>) {
  return api<{ product: Product }>('/products', { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateProductApi(id: string, patch: Partial<Product>) {
  return api<{ product: Product }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function deleteProductApi(id: string) {
  return api<{ product: Product }>(`/products/${id}`, { method: 'DELETE' });
}
export async function createCategoryApi(name: string) {
  return api<{ category: Category }>('/categories', { method: 'POST', body: JSON.stringify({ name }) });
}
export async function updateCategoryApi(id: string, patch: Partial<Category>) {
  return api<{ category: Category }>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

// Employees
export async function listEmployees() {
  return api<{ employees: Employee[] }>('/employees');
}
export async function createEmployeeApi(payload: { name: string; role: 'barista' | 'owner'; pin: string }) {
  return api<{ employee: Employee }>('/employees', { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateEmployeeApi(id: string, patch: Partial<Employee> & { pin?: string }) {
  return api<{ employee: Employee }>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function deleteEmployeeApi(id: string) {
  return api<{ employee: Employee }>(`/employees/${id}`, { method: 'DELETE' });
}
