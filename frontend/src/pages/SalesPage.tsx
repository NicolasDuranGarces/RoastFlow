import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  createSale,
  deleteSale,
  fetchCustomers,
  fetchFarms,
  fetchLots,
  fetchRoasts,
  fetchSales,
  fetchVarieties,
  updateSale
} from "../services/api";
import type { Customer, Farm, RoastBatch, Sale, Variety, CoffeeLot } from "../types";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const formatGrams = (value: number) =>
  value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : "";

const BAG_SIZES = [250, 340, 500, 2500] as const;

type SaleItemForm = {
  roast_batch_id: string;
  bag_size_g: number;
  bags: string;
  bag_price: string;
  notes: string;
};

type SaleItemFormError = {
  roast?: string;
  bags?: string;
  bag_price?: string;
  availability?: string;
};

const createEmptySaleItem = (): SaleItemForm => ({
  roast_batch_id: "",
  bag_size_g: BAG_SIZES[0],
  bags: "1",
  bag_price: "",
  notes: ""
});

const buildEmptySaleForm = () => ({
  customer_id: "",
  sale_date: new Date().toISOString().slice(0, 10),
  notes: "",
  is_paid: true,
  amount_paid: "",
  items: [createEmptySaleItem()]
});

const MIN_AVAILABLE_ROAST_G = 100;

const SalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roasts, setRoasts] = useState<RoastBatch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  const [saleForm, setSaleForm] = useState(buildEmptySaleForm);
  const [saleEditingId, setSaleEditingId] = useState<number | null>(null);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleItemErrors, setSaleItemErrors] = useState<Record<number, SaleItemFormError>>({});
  const [generalSaleError, setGeneralSaleError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    roastId: "",
    customerId: "",
    minQuantity: "",
    maxQuantity: "",
    minPrice: "",
    maxPrice: "",
    minTotal: "",
    maxTotal: "",
    notes: "",
    varietyId: "",
    status: ""
  });
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [customersRes, roastsRes, salesRes, lotsRes, varietiesRes, farmsRes] = await Promise.all([
            fetchCustomers(),
            fetchRoasts(),
            fetchSales(),
            fetchLots(),
            fetchVarieties(),
            fetchFarms()
          ]);
          setCustomers(customersRes.data as Customer[]);
          setRoasts(roastsRes.data as RoastBatch[]);
          setSales(salesRes.data as Sale[]);
          setLots(lotsRes.data as CoffeeLot[]);
          setVarieties(varietiesRes.data as Variety[]);
          setFarms(farmsRes.data as Farm[]);
        } catch (error) {
          console.error("Failed to load sales data", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const state = location.state as { prefilters?: Partial<typeof filters> } | undefined;
    if (state?.prefilters) {
      setFilters((prev) => ({ ...prev, ...state.prefilters }));
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const getAvailableRoastedGrams = (roastId: number, ignoreSaleId: number | null) => {
    const roast = roasts.find((candidate) => candidate.id === roastId);
    if (!roast) {
      return 0;
    }
    const used = sales.reduce((total, current) => {
      if (ignoreSaleId && current.id === ignoreSaleId) {
        return total;
      }
      const roastUsage = current.items?.reduce((sum, item) => {
        if (item.roast_batch_id !== roastId) {
          return sum;
        }
        return sum + item.bag_size_g * item.bags;
      }, 0) ?? 0;
      return total + roastUsage;
    }, 0);
    return Math.max(0, roast.roasted_output_g - used);
  };

  const roastOptions = useMemo(() => {
    const selectedInForm = new Set(
      saleForm.items
        .map((item) => Number(item.roast_batch_id))
        .filter((roastId) => !Number.isNaN(roastId) && roastId > 0)
    );

    return roasts.filter((roast) => {
      if (selectedInForm.has(roast.id)) {
        return true;
      }
      const available = getAvailableRoastedGrams(roast.id, saleEditingId);
      return available >= MIN_AVAILABLE_ROAST_G;
    });
  }, [roasts, saleForm.items, saleEditingId, sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (filters.dateFrom && sale.sale_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && sale.sale_date > filters.dateTo) {
        return false;
      }
      if (filters.roastId) {
        const matchesRoast = sale.items?.some((item) => item.roast_batch_id === Number(filters.roastId));
        if (!matchesRoast) {
          return false;
        }
      }
      if (filters.customerId) {
        const customerId = sale.customer_id ?? null;
        if (filters.customerId === "none" && customerId !== null) {
          return false;
        }
        if (filters.customerId !== "none" && customerId !== Number(filters.customerId)) {
          return false;
        }
      }
      if (filters.minQuantity) {
        const minQuantity = Number(filters.minQuantity);
        if (!Number.isNaN(minQuantity) && sale.total_quantity_g < minQuantity) {
          return false;
        }
      }
      if (filters.maxQuantity) {
        const maxQuantity = Number(filters.maxQuantity);
        if (!Number.isNaN(maxQuantity) && sale.total_quantity_g > maxQuantity) {
          return false;
        }
      }

      const itemPrices = sale.items?.map((item) => item.bag_price) ?? [];
      const highestBagPrice = itemPrices.length ? Math.max(...itemPrices) : 0;
      const lowestBagPrice = itemPrices.length ? Math.min(...itemPrices) : 0;

      if (filters.minPrice) {
        const minPrice = Number(filters.minPrice);
        if (!Number.isNaN(minPrice) && highestBagPrice < minPrice) {
          return false;
        }
      }
      if (filters.maxPrice) {
        const maxPrice = Number(filters.maxPrice);
        if (!Number.isNaN(maxPrice) && (lowestBagPrice === 0 || lowestBagPrice > maxPrice)) {
          return false;
        }
      }

      if (filters.minTotal) {
        const minTotal = Number(filters.minTotal);
        if (!Number.isNaN(minTotal) && sale.total_price < minTotal) {
          return false;
        }
      }
      if (filters.maxTotal) {
        const maxTotal = Number(filters.maxTotal);
        if (!Number.isNaN(maxTotal) && sale.total_price > maxTotal) {
          return false;
        }
      }
      if (filters.notes && !(sale.notes ?? "").toLowerCase().includes(filters.notes.toLowerCase())) {
        return false;
      }
      const balanceDue = Math.max(sale.total_price - sale.amount_paid, 0);
      const isPending = balanceDue > 0.0001;
      if (filters.status === "paid" && isPending) {
        return false;
      }
      if (filters.status === "pending" && !isPending) {
        return false;
      }
      if (filters.varietyId) {
        const matchesVariety = sale.items?.some((item) => {
          const roast = roasts.find((candidate) => candidate.id === item.roast_batch_id);
          if (!roast) {
            return false;
          }
          const lot = lots.find((candidate) => candidate.id === roast.lot_id);
          return lot ? String(lot.variety_id) === filters.varietyId : false;
        });
        if (!matchesVariety) {
          return false;
        }
      }
      return true;
    });
  }, [filters, sales, roasts, lots]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      const dateDiff = new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return b.id - a.id;
    });
  }, [filteredSales]);

  const paginatedSales = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedSales.slice(start, start + rowsPerPage);
  }, [sortedSales, page, rowsPerPage]);

  const totalFilteredSalesAmount = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + sale.total_price, 0),
    [filteredSales]
  );

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  useEffect(() => {
    setPage(0);
  }, [filteredSales.length]);

const currentSaleTotal = useMemo(() => {
    return saleForm.items.reduce((total, item) => {
      const price = Math.round(Number(item.bag_price));
      const bags = Math.round(Number(item.bags));
      if (Number.isNaN(price) || Number.isNaN(bags)) {
        return total;
      }
      return total + price * bags;
    }, 0);
  }, [saleForm.items]);

  const parsedAmountPaid = saleForm.is_paid ? currentSaleTotal : Math.round(Number(saleForm.amount_paid || 0));
  const currentBalancePreview = Math.max(
    currentSaleTotal - (Number.isNaN(parsedAmountPaid) ? 0 : parsedAmountPaid),
    0
  );

  const resetSaleForm = () => {
    setSaleForm(buildEmptySaleForm());
    setSaleEditingId(null);
    setSaleItemErrors({});
    setGeneralSaleError(null);
  };

  const openCreateDialog = () => {
    resetSaleForm();
    setDialogOpen(true);
  };

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
  };

  const updateSaleItem = (index: number, updates: Partial<SaleItemForm>) => {
    setSaleForm((prev) => {
      const nextItems = prev.items.map((item, idx) => (idx === index ? { ...item, ...updates } : item));
      return { ...prev, items: nextItems };
    });
    setSaleItemErrors((prev) => {
      if (!prev[index]) {
        return prev;
      }
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setGeneralSaleError(null);
  };

  const addSaleItem = () => {
    setSaleForm((prev) => ({ ...prev, items: [...prev.items, createEmptySaleItem()] }));
    setGeneralSaleError(null);
  };

  const removeSaleItem = (index: number) => {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
    setSaleItemErrors({});
    setGeneralSaleError(null);
  };

  const handlePaidToggle = (checked: boolean) => {
    setSaleForm((prev) => ({
      ...prev,
      is_paid: checked,
      amount_paid: checked ? "" : prev.amount_paid
    }));
    setGeneralSaleError(null);
  };

  const handleAmountPaidChange = (value: string) => {
    setSaleForm((prev) => ({ ...prev, amount_paid: value }));
    setGeneralSaleError(null);
  };

  const handleSaveSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const itemErrors: Record<number, SaleItemFormError> = {};
    let hasErrors = false;
    const totalsByRoast = new Map<number, number>();

    if (!saleForm.items.length) {
      setGeneralSaleError("Agrega al menos una tostión a la venta");
      return;
    }

    saleForm.items.forEach((item, index) => {
      const currentErrors: SaleItemFormError = {};
      const roastId = Number(item.roast_batch_id);
      if (!item.roast_batch_id || Number.isNaN(roastId) || roastId <= 0) {
        currentErrors.roast = "Selecciona una tostión";
      }

      const bags = Number(item.bags);
      if (Number.isNaN(bags) || bags <= 0) {
        currentErrors.bags = "Bolsas mayores a cero";
      }

      const bagPrice = Number(item.bag_price);
      if (Number.isNaN(bagPrice) || bagPrice <= 0) {
        currentErrors.bag_price = "Ingresa un precio válido";
      }

      if (!BAG_SIZES.includes(item.bag_size_g as (typeof BAG_SIZES)[number])) {
        currentErrors.availability = "Selecciona un tamaño válido";
      }

      if (Object.keys(currentErrors).length === 0 && !Number.isNaN(roastId)) {
        const grams = item.bag_size_g * Number(item.bags);
        totalsByRoast.set(roastId, (totalsByRoast.get(roastId) ?? 0) + grams);
      }

      if (Object.keys(currentErrors).length > 0) {
        itemErrors[index] = currentErrors;
        hasErrors = true;
      }
    });

    totalsByRoast.forEach((grams, roastId) => {
      const available = getAvailableRoastedGrams(roastId, saleEditingId);
      if (grams > available) {
        hasErrors = true;
        saleForm.items.forEach((item, index) => {
          if (Number(item.roast_batch_id) === roastId) {
            itemErrors[index] = {
              ...itemErrors[index],
              availability: `Solo hay ${formatGrams(available)} g disponibles`
            };
          }
        });
      }
    });

  if (hasErrors) {
      setSaleItemErrors(itemErrors);
      setGeneralSaleError("Corrige los campos marcados antes de guardar");
      return;
    }

    setSaleItemErrors({});
    setGeneralSaleError(null);

    const rawAmountPaid = saleForm.is_paid ? currentSaleTotal : Math.round(Number(saleForm.amount_paid || 0));
    if (!saleForm.is_paid && (Number.isNaN(rawAmountPaid) || rawAmountPaid < 0)) {
      setGeneralSaleError("Ingresa un monto pagado válido");
      return;
    }
    if (!saleForm.is_paid && rawAmountPaid > currentSaleTotal) {
      setGeneralSaleError("El monto pagado no puede superar el total de la venta");
      return;
    }

    const resolvedIsPaid = saleForm.is_paid || rawAmountPaid >= currentSaleTotal;
    const resolvedAmountPaid = resolvedIsPaid ? currentSaleTotal : rawAmountPaid;

    const payload = {
      customer_id: saleForm.customer_id ? Number(saleForm.customer_id) : null,
      sale_date: saleForm.sale_date,
      notes: saleForm.notes.trim() ? saleForm.notes : undefined,
      is_paid: resolvedIsPaid,
      amount_paid: resolvedAmountPaid,
      items: saleForm.items.map((item) => ({
        roast_batch_id: Number(item.roast_batch_id),
        bag_size_g: item.bag_size_g,
        bags: Math.round(Number(item.bags)),
        bag_price: Math.round(Number(item.bag_price)),
        notes: item.notes.trim() ? item.notes : undefined
      }))
    };

    setSaleSaving(true);
    try {
      if (saleEditingId) {
        await updateSale(saleEditingId, payload);
      } else {
        await createSale(payload);
      }
      await loadData();
      resetSaleForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save sale", error);
    } finally {
      setSaleSaving(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setSaleEditingId(sale.id);
    const mappedItems = (sale.items ?? []).map((item) => ({
      roast_batch_id: String(item.roast_batch_id),
      bag_size_g: item.bag_size_g,
      bags: String(item.bags),
      bag_price: String(item.bag_price),
      notes: item.notes ?? ""
    }));
    const saleBalance = Math.max(sale.total_price - sale.amount_paid, 0);
    setSaleForm({
      customer_id: sale.customer_id ? String(sale.customer_id) : "",
      sale_date: sale.sale_date,
      notes: sale.notes ?? "",
      is_paid: saleBalance <= 0.0001,
      amount_paid: saleBalance <= 0.0001
        ? sale.total_price.toString()
        : sale.amount_paid.toString(),
      items: mappedItems.length ? mappedItems : [createEmptySaleItem()]
    });
    setSaleItemErrors({});
    setGeneralSaleError(null);
    setDialogOpen(true);
  };

  const handleDeleteRequest = (sale: Sale) => {
    setDeleteTarget(sale);
  };

  const handleDeleteCancel = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteSale(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete sale", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = () => {
    if (saleSaving) {
      return;
    }
    setDialogOpen(false);
    resetSaleForm();
  };

  return (
    <Stack spacing={4}>
      <Card sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardHeader
          title="Historial de ventas"
          subheader={`${sortedSales.length} de ${sales.length} registros · Total mostrado: ${formatCurrency(
            totalFilteredSalesAmount
          )}`}
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nueva venta
            </Button>
          }
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
          <FilterPanel
            isDirty={isFiltering}
            onClear={() =>
              setFilters({
                dateFrom: "",
                dateTo: "",
                roastId: "",
                customerId: "",
                minQuantity: "",
                maxQuantity: "",
                minPrice: "",
                maxPrice: "",
                minTotal: "",
                maxTotal: "",
                notes: "",
                varietyId: "",
                status: ""
              })
            }
          >
            <TextField
              label="Desde"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateFrom}
              onChange={handleFilterChange("dateFrom")}
            />
            <TextField
              label="Hasta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateTo}
              onChange={handleFilterChange("dateTo")}
            />
            <TextField
              select
              label="Tostion"
              value={filters.roastId}
              onChange={handleFilterChange("roastId")}
            >
              <MenuItem value="">Todas</MenuItem>
              {roasts.map((roast) => (
                <MenuItem key={roast.id} value={String(roast.id)}>
                  Roast #{roast.id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Cliente"
              value={filters.customerId}
              onChange={handleFilterChange("customerId")}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="none">Venta mostrador</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Gramos mínimos"
              type="number"
              value={filters.minQuantity}
              onChange={handleFilterChange("minQuantity")}
            />
            <TextField
              label="Gramos máximos"
              type="number"
              value={filters.maxQuantity}
              onChange={handleFilterChange("maxQuantity")}
            />
            <TextField
              label="Precio mínimo (bolsa)"
              type="number"
              value={filters.minPrice}
              onChange={handleFilterChange("minPrice")}
            />
            <TextField
              label="Precio máximo (bolsa)"
              type="number"
              value={filters.maxPrice}
              onChange={handleFilterChange("maxPrice")}
            />
            <TextField
              label="Total minimo"
              type="number"
              value={filters.minTotal}
              onChange={handleFilterChange("minTotal")}
            />
            <TextField
              label="Total maximo"
              type="number"
              value={filters.maxTotal}
              onChange={handleFilterChange("maxTotal")}
            />
            <TextField
              label="Notas"
              value={filters.notes}
              onChange={handleFilterChange("notes")}
              placeholder="Buscar en notas"
            />
            <TextField
              select
              label="Variedad"
              value={filters.varietyId}
              onChange={handleFilterChange("varietyId")}
            >
              <MenuItem value="">Todas</MenuItem>
              {varieties.map((variety) => (
                <MenuItem key={variety.id} value={String(variety.id)}>
                  {variety.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Estado de pago"
              value={filters.status}
              onChange={handleFilterChange("status")}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="paid">Pagadas</MenuItem>
              <MenuItem value="pending">Pendientes</MenuItem>
            </TextField>
          </FilterPanel>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Venta</TableCell>
                <TableCell>Detalle</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Gramos</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    {isFiltering
                      ? "No hay ventas que coincidan con los filtros."
                      : "No hay ventas registradas."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale) => {
                  const customerName = customers.find((c) => c.id === sale.customer_id)?.name ?? "Venta mostrador";
                  const saleItems = sale.items ?? [];
                  const balanceDue = Math.max(sale.total_price - sale.amount_paid, 0);
                  const isPending = balanceDue > 0.0001;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {`Venta #${sale.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          {saleItems.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              Sin detalle disponible
                            </Typography>
                          ) : (
                            saleItems.map((item) => {
                              const roast = roasts.find((candidate) => candidate.id === item.roast_batch_id);
                              const lot = roast ? lots.find((candidate) => candidate.id === roast.lot_id) : undefined;
                              const varietyName = lot
                                ? varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad"
                                : "Variedad";
                              const farmName = lot
                                ? farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca"
                                : "Finca";
                              const process = lot?.process ?? "Proceso N/D";
                              const roastDate = roast
                                ? new Date(roast.roast_date).toLocaleDateString()
                                : "Fecha N/D";

                              return (
                                <Box key={`${sale.id}-${item.id}`} sx={{ borderRadius: 1, bgcolor: "action.hover", p: 1 }}>
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {`Roast #${item.roast_batch_id} · ${varietyName}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {`${roastDate} · ${process} · ${farmName}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {`${item.bags} bolsa(s) de ${item.bag_size_g} g · ${formatCurrency(item.bag_price)} c/u`}
                                    </Typography>
                                  </Stack>
                                </Box>
                              );
                            })
                          )}
                          {isPending ? (
                            <Typography variant="caption" color="error">
                              {`Saldo pendiente: ${formatCurrency(balanceDue)}`}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {`Pagado: ${formatCurrency(sale.amount_paid)}`}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {customerName}
                          </Typography>
                          {sale.customer_id === null ? (
                            <Typography variant="caption" color="text.secondary">
                              Venta mostrador
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatGrams(sale.total_quantity_g)}</TableCell>
                      <TableCell align="right">{formatCurrency(sale.total_price)}</TableCell>
                      <TableCell align="right">
                        <Stack spacing={0.5} alignItems="flex-end">
                          <Chip
                            size="small"
                            color={isPending ? "warning" : "success"}
                            label={isPending ? "Pendiente" : "Pagado"}
                          />
                          {isPending ? (
                            <Typography variant="caption" color="error">
                              {formatCurrency(balanceDue)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {sale.paid_at
                                ? `Pagado el ${formatDate(sale.paid_at)}`
                                : formatCurrency(sale.amount_paid)}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEditSale(sale)}>
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDeleteRequest(sale)}>
                            <DeleteRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedSales.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="Filas por página"
          />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar venta"
        description={
          deleteTarget
            ? `¿Deseas eliminar la venta del ${deleteTarget.sale_date}? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>{saleEditingId ? "Editar venta" : "Registrar venta"}</DialogTitle>
        <Box component="form" id="sale-form" onSubmit={handleSaveSale} display="flex" flexDirection="column" gap={0}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Cliente"
              value={saleForm.customer_id}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, customer_id: e.target.value }))}
            >
              <MenuItem value="">Venta mostrador</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={saleForm.sale_date}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, sale_date: e.target.value }))}
              required
            />
            {generalSaleError ? (
              <Typography variant="body2" color="error">
                {generalSaleError}
              </Typography>
            ) : null}
            <Stack spacing={2}>
              {saleForm.items.map((item, index) => {
                const selectedRoastId = Number(item.roast_batch_id);
                const available = selectedRoastId
                  ? getAvailableRoastedGrams(selectedRoastId, saleEditingId)
                  : null;

                return (
                  <Box key={index} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle2">{`Tostión ${index + 1}`}</Typography>
                      {saleForm.items.length > 1 ? (
                        <Tooltip title="Eliminar tostión">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => removeSaleItem(index)}
                              disabled={saleForm.items.length === 1}
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="Tostión"
                        value={item.roast_batch_id}
                        onChange={(e) => updateSaleItem(index, { roast_batch_id: e.target.value })}
                        error={Boolean(saleItemErrors[index]?.roast)}
                        helperText={saleItemErrors[index]?.roast}
                        required
                      >
                        {roastOptions.map((roast) => {
                          const lot = lots.find((candidate) => candidate.id === roast.lot_id);
                          const varietyName = lot
                            ? varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad"
                            : "Variedad";
                          const farmName = lot
                            ? farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca"
                            : "Finca";
                          const process = lot?.process ?? "Proceso N/D";
                          const roastDate = new Date(roast.roast_date).toLocaleDateString();
                          const availableRoast = getAvailableRoastedGrams(roast.id, saleEditingId);

                          return (
                            <MenuItem key={roast.id} value={String(roast.id)}>
                              <Box display="flex" flexDirection="column" alignItems="flex-start">
                                <Typography variant="body2" fontWeight={600}>
                                  {`Roast #${roast.id} · ${varietyName}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {`${roastDate} · ${process} · ${farmName} · Disponible: ${formatGrams(availableRoast)} g`}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </TextField>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                          label="Gramos por bolsa"
                          type="number"
                          value={item.bag_size_g}
                          onChange={(e) => updateSaleItem(index, { bag_size_g: Number(e.target.value) })}
                          inputProps={{ min: 1, step: "1" }}
                          required
                        />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {BAG_SIZES.map((size) => (
                            <Chip
                              key={size}
                              label={`${size} g`}
                              size="small"
                              color={item.bag_size_g === size ? "primary" : "default"}
                              onClick={() => updateSaleItem(index, { bag_size_g: size })}
                            />
                          ))}
                        </Stack>
                        <TextField
                          label="Cantidad de bolsas"
                          type="number"
                          value={item.bags}
                          onChange={(e) => updateSaleItem(index, { bags: e.target.value })}
                          error={Boolean(saleItemErrors[index]?.bags)}
                          helperText={saleItemErrors[index]?.bags}
                          inputProps={{ min: 1, step: "1" }}
                          required
                        />
                        <TextField
                          label="Precio por bolsa"
                          type="number"
                          value={item.bag_price}
                          onChange={(e) => updateSaleItem(index, { bag_price: e.target.value })}
                          error={Boolean(saleItemErrors[index]?.bag_price)}
                          helperText={saleItemErrors[index]?.bag_price}
                          inputProps={{ min: 0, step: "1" }}
                          required
                        />
                      </Stack>
                      {saleItemErrors[index]?.availability ? (
                        <Typography variant="caption" color="error">
                          {saleItemErrors[index]?.availability}
                        </Typography>
                      ) : null}
                      {available !== null ? (
                        <Typography variant="caption" color="text.secondary">
                          {`Disponible: ${formatGrams(available)} g`}
                        </Typography>
                      ) : null}
                      <TextField
                        label="Notas"
                        value={item.notes}
                        onChange={(e) => updateSaleItem(index, { notes: e.target.value })}
                        multiline
                        rows={2}
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
            <Button
              startIcon={<AddRoundedIcon />}
              variant="outlined"
              onClick={addSaleItem}
              sx={{ alignSelf: "flex-start" }}
            >
              Agregar tostión
            </Button>
            <FormControlLabel
              control={<Switch checked={saleForm.is_paid} onChange={(e) => handlePaidToggle(e.target.checked)} />}
              label={saleForm.is_paid ? "Venta pagada" : "Venta pendiente"}
            />
            <TextField
              label="Monto pagado"
              type="number"
              value={saleForm.is_paid ? currentSaleTotal.toString() : saleForm.amount_paid}
              onChange={(e) => handleAmountPaidChange(e.target.value)}
              disabled={saleForm.is_paid}
              inputProps={{ min: 0, step: "1" }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Typography variant="body2" fontWeight={600}>
                {`Total venta: ${formatCurrency(currentSaleTotal)}`}
              </Typography>
              <Typography variant="body2" color={currentBalancePreview > 0 ? "error" : "success.main"}>
                {currentBalancePreview > 0
                  ? `Saldo pendiente: ${formatCurrency(currentBalancePreview)}`
                  : "Sin saldo pendiente"}
              </Typography>
            </Stack>
            <TextField
              label="Notas"
              value={saleForm.notes}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={saleSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saleSaving}>
              {saleEditingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
};

export default SalesPage;
