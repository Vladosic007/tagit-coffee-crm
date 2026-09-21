export type Role = 'barista' | 'owner';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  pin: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export type ModGroupType = 'size' | 'milk' | 'syrup' | 'extra';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: ModGroupType;
  required: boolean;
  multi: boolean;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  basePrice: number;
  emoji?: string;
  isActive: boolean;
  sortOrder: number;
  modifierGroupIds: string[];
}

export interface CartLineMod {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartLine {
  lineId: string;
  productId: string;
  productName: string;
  basePrice: number;
  qty: number;
  mods: CartLineMod[];
  unitPrice: number;      // basePrice + модификаторы (без скидки)
  discount: number;       // 0..100 (%)
  discountedUnit: number; // цена после скидки за единицу
  lineTotal: number;      // discountedUnit * qty
}

export type PaymentMethod = 'cash' | 'transfer';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  mods: CartLineMod[];
  discount: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  receiptNo: number;
  shiftId: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
}

export type ShiftStatus = 'open' | 'closed';
export type CashMovementType = 'collection' | 'deposit';

export interface CashMovement {
  id: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  comment: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
}

export interface Shift {
  id: string;
  openedBy: string;
  openedByName: string;
  closedBy?: string;
  closedByName?: string;
  openedAt: string;
  closedAt?: string;
  cashStart: number;
  cashCounted?: number;
  status: ShiftStatus;
}

export interface BrandSettings {
  name: string;
  logoEmoji: string;
  transferPhone: string;
  transferHolder: string;
  transferBank: string;
}
