import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createExpense, deleteExpense, fetchExpenses, updateExpense } from "../services/api";
import type { Expense } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const buildEmptyForm = () => ({
  expense_date: new Date().toISOString().slice(0, 10),
  category: "Bolsas",
  amount: "",
  notes: ""
});

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(buildEmptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  });
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadExpenses = useMemo(
    () =>
      async () => {
        try {
          const { data } = await fetchExpenses();
          setExpenses(data as Expense[]);
        } catch (error) {
          console.error("Failed to load expenses", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.category && !expense.category.toLowerCase().includes(filters.category.toLowerCase())) {
        return false;
      }
      if (filters.dateFrom && expense.expense_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && expense.expense_date > filters.dateTo) {
        return false;
      }
      if (filters.minAmount) {
        const min = Number(filters.minAmount);
        if (!Number.isNaN(min) && expense.amount < min) {
          return false;
        }
      }
      if (filters.maxAmount) {
        const max = Number(filters.maxAmount);
        if (!Number.isNaN(max) && expense.amount > max) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, filters]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  const resetForm = () => {
    setForm(buildEmptyForm());
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        expense_date: form.expense_date,
        category: form.category,
        amount: Number(form.amount),
        notes: form.notes
      };
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      await loadExpenses();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save expense", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      expense_date: expense.expense_date,
      category: expense.category,
      amount: String(expense.amount),
      notes: expense.notes ?? ""
    });
    setDialogOpen(true);
  };

  const handleDeleteRequest = (expense: Expense) => {
    setDeleteTarget(expense);
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
      await deleteExpense(deleteTarget.id);
      await loadExpenses();
    } catch (error) {
      console.error("Failed to delete expense", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = () => {
    if (saving) {
      return;
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Stack spacing={4}>
      <Card sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardHeader
          title="Historial de gastos"
          subheader={`${filteredExpenses.length} de ${expenses.length} registros`}
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nuevo gasto
            </Button>
          }
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
          <FilterPanel
            isDirty={isFiltering}
            onClear={() => setFilters({ category: "", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "" })}
          >
            <TextField
              label="Categoria"
              value={filters.category}
              onChange={handleFilterChange("category")}
              placeholder="Buscar categoria"
            />
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
              label="Monto minimo"
              type="number"
              value={filters.minAmount}
              onChange={handleFilterChange("minAmount")}
            />
            <TextField
              label="Monto maximo"
              type="number"
              value={filters.maxAmount}
              onChange={handleFilterChange("maxAmount")}
            />
          </FilterPanel>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    {isFiltering
                      ? "No hay gastos que coincidan con los filtros."
                      : "No hay gastos registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.expense_date}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell align="right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{expense.notes}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEdit(expense)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDeleteRequest(expense)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar gasto"
        description={
          deleteTarget
            ? `¿Deseas eliminar el gasto "${deleteTarget.category}" del ${deleteTarget.expense_date}?`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
        <Box component="form" id="expense-form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={0}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Fecha"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.expense_date}
              onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))}
              required
            />
            <TextField
              label="Categoria"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <TextField
              label="Monto"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
};

export default ExpensesPage;
