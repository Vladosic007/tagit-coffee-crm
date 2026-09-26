'use client';

import { create } from 'zustand';
import type {
  BrandSettings,
  CartLine,
  CartLineMod,
  CashMovement,
  Category,
  Employee,
  ModifierGroup,
  Order,
  PaymentMethod,
  Product,
  Shift,
} from '@/lib/types';
import { initialBrand } from '@/stores/mockData';
import * as api from '@/lib/client/services';
import { getToken, setToken } from '@/lib/client/api';

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface ShiftStats {
  revenueCash: number;
  revenueTransfer: number;
  revenueTotal: number;
  checks: number;
  collections: number;
  deposits: number;
  expectedCash: number;
  diff: number | null;
}

interface AppState {
  // Bootstrap
  ready: boolean;
  bootError: string | null;
  bootstrap: () => Promise<void>;

  // Brand
  brand: BrandSettings;

  // Auth
  employees: Employee[];
  currentEmployeeId: string | null;
  loginPin: (pin: string) => Promise<Employee | null>;
  logout: () => void;
  refreshEmployees: () => Promise<void>;
  createEmployee: (e: { name: string; role: 'barista' | 'owner'; pin: string }) => Promise<void>;
  updateEmployee: (id: string, patch: Partial<Employee> & { pin?: string }) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Menu
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  refreshMenu: () => Promise<void>;
  createProduct: (p: Omit<Product, 'id' | 'isActive'>) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  toggleProductActive: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Cart (local only, submitted via createOrder)
  cart: CartLine[];
  addToCart: (line: Omit<CartLine, 'lineId'>) => void;
  incLine: (lineId: string) => void;
  decLine: (lineId: string) => void;
  setLineDiscount: (lineId: string, discount: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartQty: () => number;
  cartSubtotal: () => number;
  cartDiscountAmount: () => number;

  // Shift
  currentShiftId: string | null;
  currentShift: () => Shift | null;
  shifts: Shift[];
  cashMovements: CashMovement[];
  orders: Order[];
  refreshCurrentShift: () => Promise<void>;
  refreshShifts: () => Promise<void>;
  openShift: (cashStart: number) => Promise<void>;
  closeShift: (cashCounted: number) => Promise<void>;
  addCashMovement: (amount: number, type: 'collection' | 'deposit', comment: string) => Promise<void>;

  // Orders
  createOrder: (paymentMethod: PaymentMethod, cashReceived?: number) => Promise<Order | null>;

  // Helpers
  shiftOrders: (shiftId: string) => Order[];
  shiftCashMovements: (shiftId: string) => CashMovement[];
  shiftStats: (shiftId: string) => ShiftStats;
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  bootError: null,
  brand: initialBrand,

  employees: [],
  currentEmployeeId: null,
  categories: [],
  products: [],
  modifierGroups: [],
  cart: [],
  currentShiftId: null,
  shifts: [],
  cashMovements: [],
  orders: [],

  bootstrap: async () => {
    try {
      // Brand + menu are public (backend allows /settings/brand without auth)
      const brand = await api.getBrand().catch(() => null);
      if (brand && Object.keys(brand).length > 0) {
        set({ brand: { ...get().brand, ...brand } as BrandSettings });
      }
      const token = getToken();
      if (token) {
        try {
          const me = await api.me();
          set({ currentEmployeeId: me.id });
        } catch {
          setToken(null);
          set({ currentEmployeeId: null });
        }
      }
      // Menu requires auth; if no token, skip until login
      if (getToken()) {
        await get().refreshMenu();
        await get().refreshCurrentShift();
        if (get().currentEmployeeId) {
          const me = get().employees.find((e) => e.id === get().currentEmployeeId);
          if (me?.role === 'owner') {
            await get().refreshEmployees().catch(() => undefined);
            await get().refreshShifts().catch(() => undefined);
          }
        }
      }
      set({ ready: true, bootError: null });
    } catch (e) {
      set({ ready: true, bootError: e instanceof Error ? e.message : 'Ошибка загрузки' });
    }
  },

  loginPin: async (pin) => {
    try {
      const emp = await api.login(pin);
      set({ currentEmployeeId: emp.id });
      // Load menu + current shift + (if owner) employees
      await get().refreshMenu();
      await get().refreshCurrentShift();
      if (emp.role === 'owner') {
        await get().refreshEmployees().catch(() => undefined);
        await get().refreshShifts().catch(() => undefined);
      }
      // Add employee locally if not in list yet
      if (!get().employees.some((e) => e.id === emp.id)) {
        set({ employees: [...get().employees, { ...emp, pin: '', isActive: true } as Employee] });
      }
      return emp as Employee;
    } catch {
      return null;
    }
  },

  logout: () => {
    setToken(null);
    set({
      currentEmployeeId: null,
      cart: [],
      currentShiftId: null,
      // Keep menu/employees/shifts cached but they'll be refetched after next login
    });
  },

  refreshEmployees: async () => {
    const r = await api.listEmployees();
    set({ employees: r.employees });
  },

  createEmployee: async (payload) => {
    await api.createEmployeeApi(payload);
    await get().refreshEmployees();
  },
  updateEmployee: async (id, patch) => {
    await api.updateEmployeeApi(id, patch);
    await get().refreshEmployees();
  },
  deleteEmployee: async (id) => {
    await api.deleteEmployeeApi(id);
    await get().refreshEmployees();
  },

  refreshMenu: async () => {
    const r = await api.getMenu();
    set({ categories: r.categories, products: r.products, modifierGroups: r.modifierGroups });
  },
  createProduct: async (p) => {
    await api.createProductApi(p);
    await get().refreshMenu();
  },
  updateProduct: async (id, patch) => {
    await api.updateProductApi(id, patch);
    await get().refreshMenu();
  },
  toggleProductActive: async (id) => {
    const cur = get().products.find((p) => p.id === id);
    if (!cur) return;
    await api.updateProductApi(id, { isActive: !cur.isActive });
    await get().refreshMenu();
  },
  deleteProduct: async (id) => {
    await api.deleteProductApi(id);
    await get().refreshMenu();
  },
  createCategory: async (name) => {
    await api.createCategoryApi(name);
    await get().refreshMenu();
  },
  updateCategory: async (id, patch) => {
    await api.updateCategoryApi(id, patch);
    await get().refreshMenu();
  },
  deleteCategory: async (id) => {
    // Backend has no delete; do a soft update
    await api.updateCategoryApi(id, { isActive: false });
    await get().refreshMenu();
  },

  addToCart: (line) => set({ cart: [...get().cart, { ...line, lineId: uid('l') }] }),
  incLine: (lineId) =>
    set({
      cart: get().cart.map((l) =>
        l.lineId === lineId ? recalcLine({ ...l, qty: l.qty + 1 }) : l
      ),
    }),
  decLine: (lineId) =>
    set({
      cart: get().cart.map((l) =>
        l.lineId === lineId ? recalcLine({ ...l, qty: Math.max(1, l.qty - 1) }) : l
      ),
    }),
  setLineDiscount: (lineId, discount) =>
    set({
      cart: get().cart.map((l) =>
        l.lineId === lineId ? recalcLine({ ...l, discount: Math.min(100, Math.max(0, Math.round(discount))) }) : l
      ),
    }),
  removeLine: (lineId) => set({ cart: get().cart.filter((l) => l.lineId !== lineId) }),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((s, l) => s + l.lineTotal, 0),
  cartQty: () => get().cart.reduce((s, l) => s + l.qty, 0),
  cartSubtotal: () => get().cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
  cartDiscountAmount: () => {
    return get().cart.reduce((s, l) => s + (l.unitPrice * l.qty - l.lineTotal), 0);
  },

  currentShift: () => {
    const id = get().currentShiftId;
    return get().shifts.find((s) => s.id === id) || null;
  },

  refreshCurrentShift: async () => {
    const r = await api.getCurrentShift();
    if (!r.shift) {
      set({ currentShiftId: null });
      return;
    }
    // Merge shift into shifts array
    const shifts = get().shifts.filter((s) => s.id !== r.shift!.id);
    set({
      currentShiftId: r.shift.id,
      shifts: [r.shift as unknown as Shift, ...shifts],
    });
    // Cash movements are barista-accessible (GET /cash-movements?shiftId=)
    try {
      const cm = await api.listCashMovements(r.shift.id);
      set({ cashMovements: mergeById(get().cashMovements, cm.movements) });
    } catch {}
    // Detailed shift (with orders) is owner-only; fall back silently for baristas.
    try {
      const detail = await api.getShift(r.shift.id);
      const orders = ((detail.shift.orders ?? []) as unknown as Array<Order & { items: Array<{ modifiers?: unknown; mods?: unknown }> }>).map(normalizeOrder);
      set({
        orders: mergeById(get().orders, orders),
        cashMovements: mergeById(get().cashMovements, (detail.shift.cashMovements ?? []) as CashMovement[]),
      });
    } catch {
      // owner-only detail; barista sees only shift itself — that's fine
    }
  },

  refreshShifts: async () => {
    const r = await api.listShifts();
    const shifts = r.shifts.map((s) => s as unknown as Shift);
    set({ shifts });
    // Load all orders/cms from each shift for owner reports
    const allOrders: Order[] = [];
    const allCms: CashMovement[] = [];
    for (const s of r.shifts) {
      try {
        const d = await api.getShift(s.id);
        for (const o of (d.shift.orders as unknown as Array<Order & { items: Array<{ modifiers?: unknown; mods?: unknown }> }> | undefined) ?? []) {
          allOrders.push(normalizeOrder(o));
        }
        for (const cm of (d.shift.cashMovements as CashMovement[] | undefined) ?? []) allCms.push(cm);
      } catch {
        // ignore
      }
    }
    set({ orders: dedupeById(allOrders), cashMovements: dedupeById(allCms) });
  },

  openShift: async (cashStart) => {
    await api.openShift(cashStart);
    await get().refreshCurrentShift();
  },
  closeShift: async (cashCounted) => {
    await api.closeShift(cashCounted);
    set({ currentShiftId: null });
    await get().refreshShifts();
  },
  addCashMovement: async (amount, type, comment) => {
    const r = await api.addCashMovement({ amount, type, comment });
    // Barista can't fetch owner-only /shifts/:id detail, so add the movement
    // to local state directly.
    set({ cashMovements: [...get().cashMovements, r.movement as CashMovement] });
    await get().refreshCurrentShift();
  },

  createOrder: async (paymentMethod, cashReceived) => {
    const items = get().cart.map((l) =>
      l.productId
        ? { productId: l.productId, qty: l.qty, mods: l.mods, discount: l.discount }
        : {
            customName: l.productName,
            customPrice: l.unitPrice,
            qty: l.qty,
            mods: [] as typeof l.mods,
            discount: l.discount,
          }
    );
    if (items.length === 0) return null;
    const r = await api.createOrder({ items, paymentMethod, cashReceived });
    const order = normalizeOrder(r.order as unknown as Order & { items: Array<{ modifiers?: unknown; mods?: unknown }> });
    set({
      cart: [],
      orders: [...get().orders, order],
    });
    // Refresh stats
    await get().refreshCurrentShift();
    return order;
  },

  shiftOrders: (shiftId) => get().orders.filter((o) => o.shiftId === shiftId),
  shiftCashMovements: (shiftId) => get().cashMovements.filter((cm) => cm.shiftId === shiftId),
  shiftStats: (shiftId) => {
    const orders = get().orders.filter((o) => o.shiftId === shiftId);
    const revenueCash = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const revenueTransfer = orders
      .filter((o) => o.paymentMethod === 'transfer')
      .reduce((s, o) => s + o.total, 0);
    const revenueTotal = revenueCash + revenueTransfer;
    const checks = orders.length;
    const cms = get().cashMovements.filter((cm) => cm.shiftId === shiftId);
    const collections = cms.filter((cm) => cm.type === 'collection').reduce((s, cm) => s + cm.amount, 0);
    const deposits = cms.filter((cm) => cm.type === 'deposit').reduce((s, cm) => s + cm.amount, 0);
    const shift = get().shifts.find((s) => s.id === shiftId);
    const cashStart = shift?.cashStart ?? 0;
    const expectedCash = cashStart + revenueCash - collections + deposits;
    const diff = shift?.cashCounted != null ? shift.cashCounted - expectedCash : null;
    return { revenueCash, revenueTransfer, revenueTotal, checks, collections, deposits, expectedCash, diff };
  },
}));

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const c of current) map.set(c.id, c);
  for (const i of incoming) map.set(i.id, i);
  return Array.from(map.values());
}

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const map = new Map<string, T>();
  for (const a of arr) map.set(a.id, a);
  return Array.from(map.values());
}

// Backend returns items with a `modifiers` field; the frontend type uses `mods`.
// Normalize so components see `mods` consistently.
function normalizeOrder(o: Order & { items: Array<{ modifiers?: unknown; mods?: unknown }> }): Order {
  return {
    ...o,
    items: (o.items ?? []).map((it) => ({
      ...(it as unknown as Order['items'][number]),
      mods: (it.mods ?? (it as { modifiers?: Order['items'][number]['mods'] }).modifiers ?? []) as Order['items'][number]['mods'],
    })),
  };
}

function recalcLine(l: CartLine): CartLine {
  const discountedUnit = Math.round((l.unitPrice * (100 - l.discount)) / 100);
  return { ...l, discountedUnit, lineTotal: discountedUnit * l.qty };
}

export function buildCustomLine(name: string, price: number, qty: number): Omit<CartLine, 'lineId'> {
  const d = 0;
  const discountedUnit = price;
  return {
    productId: null,
    productName: name.trim(),
    basePrice: price,
    qty,
    mods: [],
    unitPrice: price,
    discount: d,
    discountedUnit,
    lineTotal: discountedUnit * qty,
    isCustom: true,
  };
}

export function buildCartLine(
  product: Product,
  qty: number,
  mods: CartLineMod[],
  discount: number = 0
): Omit<CartLine, 'lineId'> {
  const unitPrice = product.basePrice + mods.reduce((s, m) => s + m.priceDelta, 0);
  const d = Math.min(100, Math.max(0, Math.round(discount)));
  const discountedUnit = Math.round((unitPrice * (100 - d)) / 100);
  return {
    productId: product.id,
    productName: product.name,
    basePrice: product.basePrice,
    qty,
    mods,
    unitPrice,
    discount: d,
    discountedUnit,
    lineTotal: discountedUnit * qty,
  };
}
