export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

export interface Farm {
  id: number;
  name: string;
  location?: string | null;
  notes?: string | null;
}

export interface Variety {
  id: number;
  name: string;
  description?: string | null;
}

export interface CoffeeLot {
  id: number;
  farm_id: number;
  variety_id: number;
  process: string;
  purchase_date: string;
  green_weight_g: number;
  price_per_kg: number;
  moisture_level?: number | null;
  notes?: string | null;
}

export interface RoastBatch {
  id: number;
  lot_id: number;
  roast_date: string;
  green_input_g: number;
  roasted_output_g: number;
  roast_level?: string | null;
  notes?: string | null;
  shrinkage_pct: number;
}

export interface Customer {
  id: number;
  name: string;
  contact_info?: string | null;
}

export interface Sale {
  id: number;
  customer_id?: number | null;
  sale_date: string;
  total_quantity_g: number;
  total_price: number;
  is_paid: boolean;
  amount_paid: number;
  paid_at?: string | null;
  notes?: string | null;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  roast_batch_id: number;
  bag_size_g: number;
  bags: number;
  bag_price: number;
  notes?: string | null;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  notes?: string | null;
}

export interface InventorySummary {
  green_available_g: number;
  roasted_available_g: number;
}

export interface CashSummary {
  expected_cash: number;
  total_sales: number;
  total_purchases: number;
  total_expenses: number;
  coffee_inventory_value: number;
  green_inventory_value: number;
  roasted_inventory_value: number;
  total_debt: number;
}

export interface DashboardSummary {
  cash: CashSummary;
  inventory: InventorySummary;
  recent_purchases: CoffeeLot[];
  recent_expenses: Expense[];
  recent_sales: Sale[];
}

export interface PriceReference {
  id: number;
  variety_id?: number | null;
  process: string;
  bag_size_g: number;
  price: number;
  notes?: string | null;
}
