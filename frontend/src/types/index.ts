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
  green_weight_kg: number;
  price_per_kg: number;
  moisture_level?: number | null;
  notes?: string | null;
}

export interface RoastBatch {
  id: number;
  lot_id: number;
  roast_date: string;
  green_input_kg: number;
  roasted_output_kg: number;
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
  roast_batch_id: number;
  customer_id?: number | null;
  sale_date: string;
  quantity_kg: number;
  price_per_kg: number;
  total_price: number;
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
  green_available_kg: number;
  roasted_available_kg: number;
}

export interface FinancialSummary {
  total_sales: number;
  total_expenses: number;
  purchase_costs: number;
  net_profit: number;
  total_quantity_sold: number;
  average_price_per_kg: number;
  projected_full_sale_value: number;
  projected_half_sale_value: number;
}

export interface RoastSummary {
  total_green_purchased: number;
  total_roasted_produced: number;
  total_roasted_sold: number;
}

export interface DashboardSummary {
  inventory: InventorySummary;
  financials: FinancialSummary;
  roasts: RoastSummary;
}
