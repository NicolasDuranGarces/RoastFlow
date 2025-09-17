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
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from "../services/api";
import type { Customer } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const emptyForm = { name: "", contact_info: "" };

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ name: "", contact: "" });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const filteredCustomers = useMemo(() => {
    const nameFilter = filters.name.toLowerCase();
    const contactFilter = filters.contact.toLowerCase();
    return customers.filter((customer) => {
      const matchesName = customer.name.toLowerCase().includes(nameFilter);
      const matchesContact = (customer.contact_info ?? "").toLowerCase().includes(contactFilter);
      return matchesName && matchesContact;
    });
  }, [customers, filters]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
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

  const handleDeleteRequest = (customer: Customer) => {
    setDeleteTarget(customer);
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
      await deleteCustomer(deleteTarget.id);
      await loadCustomers();
    } catch (error) {
      console.error("Failed to delete customer", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
          <CardHeader
            title="Clientes registrados"
            subheader={`${filteredCustomers.length} de ${customers.length} registros`}
          />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <FilterPanel
              isDirty={isFiltering}
              onClear={() => setFilters({ name: "", contact: "" })}
            >
              <TextField
                label="Nombre"
                value={filters.name}
                onChange={handleFilterChange("name")}
                placeholder="Filtrar por nombre"
              />
              <TextField
                label="Contacto"
                value={filters.contact}
                onChange={handleFilterChange("contact")}
                placeholder="Filtrar por contacto"
              />
            </FilterPanel>
            {filteredCustomers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isFiltering
                  ? "No hay clientes que coincidan con los filtros."
                  : "No hay clientes registrados."}
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
                  {filteredCustomers.map((customer) => (
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
                          <IconButton color="error" onClick={() => handleDeleteRequest(customer)}>
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar cliente"
        description={
          deleteTarget
            ? `¿Deseas eliminar al cliente "${deleteTarget.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Grid>
  );
};

export default CustomersPage;
