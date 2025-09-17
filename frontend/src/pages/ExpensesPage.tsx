import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createExpense, deleteExpense, fetchExpenses, updateExpense } from "../services/api";
import type { Expense } from "../types";

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

  const resetForm = () => {
    setForm(buildEmptyForm());
    setEditingId(null);
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
      resetForm();
      await loadExpenses();
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
  };

  const handleDelete = async (expense: Expense) => {
    if (!window.confirm(`Eliminar gasto de "${expense.category}"?`)) {
      return;
    }
    try {
      await deleteExpense(expense.id);
      await loadExpenses();
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar gasto" : "Registrar gasto"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
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
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Guardar gasto"}
                </Button>
                {editingId && (
                  <Button variant="outlined" onClick={resetForm} disabled={saving}>
                    Cancelar
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader title="Historial de gastos" subheader={`${expenses.length} registros`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
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
                {expenses.map((expense) => (
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
                        <IconButton color="error" onClick={() => handleDelete(expense)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ExpensesPage;
