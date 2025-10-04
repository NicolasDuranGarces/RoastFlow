import axios from "axios";

const resolveBaseURL = () => {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (configured && configured.trim().length > 0) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const port = "8000";
    return `${protocol}//${hostname}:${port}`;
  }

  return "http://localhost:8000";
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: false
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const loginRequest = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return api.post("/api/v1/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
};

export const fetchCurrentUser = () => api.get("/api/v1/auth/me");

export const fetchDashboardSummary = () => api.get("/api/v1/dashboard/summary");

export const fetchFarms = () => api.get("/api/v1/farms/");
export const createFarm = (payload: Record<string, unknown>) => api.post("/api/v1/farms/", payload);
export const updateFarm = (id: number, payload: Record<string, unknown>) => api.put(`/api/v1/farms/${id}`, payload);
export const deleteFarm = (id: number) => api.delete(`/api/v1/farms/${id}`);

export const fetchVarieties = () => api.get("/api/v1/varieties/");
export const createVariety = (payload: Record<string, unknown>) => api.post("/api/v1/varieties/", payload);
export const updateVariety = (id: number, payload: Record<string, unknown>) =>
  api.put(`/api/v1/varieties/${id}`, payload);
export const deleteVariety = (id: number) => api.delete(`/api/v1/varieties/${id}`);

export const fetchLots = () => api.get("/api/v1/lots/");
export const createLot = (payload: Record<string, unknown>) => api.post("/api/v1/lots/", payload);
export const updateLot = (id: number, payload: Record<string, unknown>) => api.put(`/api/v1/lots/${id}`, payload);
export const deleteLot = (id: number) => api.delete(`/api/v1/lots/${id}`);

export const fetchRoasts = () => api.get("/api/v1/roasts/");
export const createRoast = (payload: Record<string, unknown>) => api.post("/api/v1/roasts/", payload);
export const updateRoast = (id: number, payload: Record<string, unknown>) => api.put(`/api/v1/roasts/${id}`, payload);
export const deleteRoast = (id: number) => api.delete(`/api/v1/roasts/${id}`);

export const fetchRoastedInventory = () => api.get("/api/v1/inventory/roasted");
export const fetchInventoryAdjustments = (params?: { roast_id?: number }) =>
  api.get("/api/v1/inventory/adjustments", { params });
export const createInventoryAdjustment = (payload: Record<string, unknown>) =>
  api.post("/api/v1/inventory/adjustments", payload);
export const updateInventoryAdjustment = (id: number, payload: Record<string, unknown>) =>
  api.put(`/api/v1/inventory/adjustments/${id}`, payload);
export const deleteInventoryAdjustment = (id: number) =>
  api.delete(`/api/v1/inventory/adjustments/${id}`);

export const fetchCustomers = () => api.get("/api/v1/customers/");
export const createCustomer = (payload: Record<string, unknown>) => api.post("/api/v1/customers/", payload);
export const updateCustomer = (id: number, payload: Record<string, unknown>) =>
  api.put(`/api/v1/customers/${id}`, payload);
export const deleteCustomer = (id: number) => api.delete(`/api/v1/customers/${id}`);

export const fetchSales = () => api.get("/api/v1/sales/");
export const createSale = (payload: Record<string, unknown>) => api.post("/api/v1/sales/", payload);
export const updateSale = (id: number, payload: Record<string, unknown>) => api.put(`/api/v1/sales/${id}`, payload);
export const deleteSale = (id: number) => api.delete(`/api/v1/sales/${id}`);
export const fetchSalesDebts = () => api.get("/api/v1/sales/debts");

export const fetchPriceReferences = () => api.get("/api/v1/price-references/");
export const createPriceReference = (payload: Record<string, unknown>) =>
  api.post("/api/v1/price-references/", payload);
export const updatePriceReference = (id: number, payload: Record<string, unknown>) =>
  api.put(`/api/v1/price-references/${id}`, payload);
export const deletePriceReference = (id: number) => api.delete(`/api/v1/price-references/${id}`);

export const fetchExpenses = () => api.get("/api/v1/expenses/");
export const createExpense = (payload: Record<string, unknown>) => api.post("/api/v1/expenses/", payload);
export const updateExpense = (id: number, payload: Record<string, unknown>) =>
  api.put(`/api/v1/expenses/${id}`, payload);
export const deleteExpense = (id: number) => api.delete(`/api/v1/expenses/${id}`);

export const fetchUsers = () => api.get("/api/v1/users/");
export const createUser = (payload: Record<string, unknown>) => api.post("/api/v1/users/", payload);
export const updateUser = (id: number, payload: Record<string, unknown>) => api.put(`/api/v1/users/${id}`, payload);
export const deleteUser = (id: number) => api.delete(`/api/v1/users/${id}`);

export default api;
