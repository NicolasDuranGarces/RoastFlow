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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createPriceReference,
  deletePriceReference,
  fetchPriceReferences,
  fetchVarieties,
  updatePriceReference
} from "../services/api";
import type { PriceReference, Variety } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";

const BAG_SIZES = [250, 340, 500, 2500];

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

const PriceReferencePage = () => {
  const [references, setReferences] = useState<PriceReference[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ variety_id: "", process: "Lavado", bag_size_g: BAG_SIZES[0], price: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<PriceReference | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [refsRes, varietiesRes] = await Promise.all([fetchPriceReferences(), fetchVarieties()]);
      setReferences(refsRes.data as PriceReference[]);
      setVarieties(varietiesRes.data as Variety[]);
    } catch (error) {
      console.error("Failed to load price references", error);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedReferences = useMemo(() => {
    return [...references].sort((a, b) => {
      if (a.variety_id !== b.variety_id) {
        return (a.variety_id ?? -1) - (b.variety_id ?? -1);
      }
      if (a.process !== b.process) {
        return a.process.localeCompare(b.process);
      }
      return a.bag_size_g - b.bag_size_g;
    });
  }, [references]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedReferences.slice(start, start + rowsPerPage);
  }, [sortedReferences, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [sortedReferences.length]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ variety_id: "", process: "Lavado", bag_size_g: BAG_SIZES[0], price: "", notes: "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      variety_id: form.variety_id ? Number(form.variety_id) : null,
      process: form.process.trim(),
      bag_size_g: form.bag_size_g,
      price: Math.round(Number(form.price)),
      notes: form.notes.trim() ? form.notes : undefined
    };

    try {
      if (editingId) {
        await updatePriceReference(editingId, payload);
      } else {
        await createPriceReference(payload);
      }
      await loadData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save price reference", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reference: PriceReference) => {
    setEditingId(reference.id);
    setForm({
      variety_id: reference.variety_id ? String(reference.variety_id) : "",
      process: reference.process,
      bag_size_g: reference.bag_size_g,
      price: reference.price.toString(),
      notes: reference.notes ?? ""
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deletePriceReference(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete price reference", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const varietyLabel = (id?: number | null) => {
    if (!id) {
      return "General";
    }
    return varieties.find((variety) => variety.id === id)?.name ?? "Variedad";
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Referencias de precio"
          subheader="Define precios sugeridos por variedad, proceso y tamaño de bolsa"
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nueva referencia
            </Button>
          }
        />
        <CardContent>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Variedad</TableCell>
                <TableCell>Proceso</TableCell>
                <TableCell align="right">Bolsa (g)</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Aún no hay referencias registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((reference) => (
                  <TableRow key={reference.id}>
                    <TableCell>{varietyLabel(reference.variety_id)}</TableCell>
                    <TableCell>{reference.process}</TableCell>
                    <TableCell align="right">{reference.bag_size_g}</TableCell>
                    <TableCell align="right">{formatCurrency(reference.price)}</TableCell>
                    <TableCell>{reference.notes ?? "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(reference)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" size="small" onClick={() => setDeleteTarget(reference)}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedReferences.length}
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
        title="Eliminar referencia"
        description={
          deleteTarget
            ? `¿Eliminar la referencia de ${varietyLabel(deleteTarget.variety_id)} (${deleteTarget.process})?`
            : undefined
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar referencia" : "Nueva referencia"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Variedad"
              value={form.variety_id}
              onChange={(e) => setForm((prev) => ({ ...prev, variety_id: e.target.value }))}
            >
              <MenuItem value="">General (todas las variedades)</MenuItem>
              {varieties.map((variety) => (
                <MenuItem key={variety.id} value={String(variety.id)}>
                  {variety.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Proceso"
              value={form.process}
              onChange={(e) => setForm((prev) => ({ ...prev, process: e.target.value }))}
              required
            />
            <TextField
              select
              label="Bolsa (g)"
              value={form.bag_size_g}
              onChange={(e) => setForm((prev) => ({ ...prev, bag_size_g: Number(e.target.value) }))}
              required
            >
              {BAG_SIZES.map((size) => (
                <MenuItem key={size} value={size}>
                  {`${size} g`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Precio"
              type="number"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              inputProps={{ min: 0, step: "1" }}
              required
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
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

export default PriceReferencePage;
