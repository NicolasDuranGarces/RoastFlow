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
  Tooltip,
  Typography
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from "../services/api";
import type { Customer } from "../types";

const emptyForm = { name: "", contact_info: "" };

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCustomers = useMemo(
    () =>
      async () => {
        try {
          const { data } = await fetchCustomers();
          setCustomers(data as Customer[]);
        } catch (error) {
          console.error("Failed to load customers", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
      } else {
        await createCustomer(form);
      }
      resetForm();
      await loadCustomers();
    } catch (error) {
      console.error("Failed to save customer", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({ name: customer.name, contact_info: customer.contact_info ?? "" });
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Eliminar cliente "${customer.name}"?`)) {
      return;
    }
    try {
      await deleteCustomer(customer.id);
      await loadCustomers();
    } catch (error) {
      console.error("Failed to delete customer", error);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar cliente" : "Registrar cliente"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <TextField
                label="Contacto"
                value={form.contact_info}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_info: e.target.value }))}
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Guardar cliente"}
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
          <CardHeader title="Clientes registrados" subheader={`${customers.length} registros`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            {customers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay clientes registrados.
              </Typography>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Contacto</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.contact_info}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEdit(customer)}>
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDelete(customer)}>
                            <DeleteRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CustomersPage;
