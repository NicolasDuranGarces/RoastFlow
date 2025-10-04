import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createInventoryAdjustment,
  deleteInventoryAdjustment,
  fetchInventoryAdjustments,
  fetchRoastedInventory,
  updateInventoryAdjustment
} from "../services/api";
import type { InventoryAdjustment, RoastedInventoryItem } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";

const formatGrams = (value: number) =>
  value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initialFormState = () => ({
  adjustment_g: "",
  adjustment_date: new Date().toISOString().slice(0, 10),
  reason: ""
});

const InventoryPage = () => {
  const [items, setItems] = useState<RoastedInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoastedInventoryItem | null>(null);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(false);
  const [adjustmentsError, setAdjustmentsError] = useState<string | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<{ adjustment_g?: string }>({});
  const [editingAdjustment, setEditingAdjustment] = useState<InventoryAdjustment | null>(null);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryAdjustment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRoastedInventory();
      setItems(response.data as RoastedInventoryItem[]);
    } catch (err) {
      console.error("Failed to load roasted inventory", err);
      setError("No se pudo cargar el inventario tostado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const handleOpenDialog = useCallback(async (item: RoastedInventoryItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
    setForm(initialFormState());
    setEditingAdjustment(null);
    setAdjustments([]);
    setAdjustmentsError(null);
    setAdjustmentsLoading(true);
    try {
      const response = await fetchInventoryAdjustments({ roast_id: item.roast_id });
      setAdjustments(response.data as InventoryAdjustment[]);
    } catch (err) {
      console.error("Failed to load adjustments", err);
      setAdjustmentsError("No se pudieron cargar los ajustes para esta tostión.");
    } finally {
      setAdjustmentsLoading(false);
    }
  }, []);

  const handleCloseDialog = () => {
    if (savingAdjustment || deleting) {
      return;
    }
    setDialogOpen(false);
    setSelectedItem(null);
    setAdjustments([]);
    setEditingAdjustment(null);
    setForm(initialFormState());
    setFormErrors({});
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submitAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem) {
      return;
    }

    const parsedAmount = Number(form.adjustment_g);
    if (Number.isNaN(parsedAmount) || Math.abs(parsedAmount) < 1e-6) {
      setFormErrors({ adjustment_g: "Ingresa una cantidad válida distinta de cero" });
      return;
    }

    setSavingAdjustment(true);
    try {
      const payload = {
        roast_batch_id: selectedItem.roast_id,
        adjustment_g: parsedAmount,
        adjustment_date: form.adjustment_date,
        reason: form.reason?.trim() ? form.reason : null
      };

      if (editingAdjustment) {
        await updateInventoryAdjustment(editingAdjustment.id, payload);
      } else {
        await createInventoryAdjustment(payload);
      }

      const response = await fetchInventoryAdjustments({ roast_id: selectedItem.roast_id });
      setAdjustments(response.data as InventoryAdjustment[]);
      await loadInventory();
      setForm(initialFormState());
      setEditingAdjustment(null);
    } catch (err) {
      console.error("Failed to save adjustment", err);
      setAdjustmentsError("No fue posible guardar el ajuste. Intenta de nuevo.");
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleEditAdjustment = (adjustment: InventoryAdjustment) => {
    setEditingAdjustment(adjustment);
    setForm({
      adjustment_g: String(adjustment.adjustment_g),
      adjustment_date: adjustment.adjustment_date.slice(0, 10),
      reason: adjustment.reason ?? ""
    });
  };

  const handleCancelEdit = () => {
    setEditingAdjustment(null);
    setForm(initialFormState());
    setFormErrors({});
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !selectedItem) {
      return;
    }
    setDeleting(true);
    try {
      await deleteInventoryAdjustment(deleteTarget.id);
      const response = await fetchInventoryAdjustments({ roast_id: selectedItem.roast_id });
      setAdjustments(response.data as InventoryAdjustment[]);
      await loadInventory();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete adjustment", err);
      setAdjustmentsError("No fue posible eliminar el ajuste.");
    } finally {
      setDeleting(false);
    }
  };

  const totalAvailable = useMemo(
    () => items.reduce((acc, item) => acc + item.available_g, 0),
    [items]
  );
  const totalRoasted = useMemo(
    () => items.reduce((acc, item) => acc + item.roasted_output_g, 0),
    [items]
  );

  const totalAdjustments = useMemo(
    () => adjustments.reduce((acc, adjustment) => acc + adjustment.adjustment_g, 0),
    [adjustments]
  );

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title="Inventario de café tostado"
          subheader="Controla el stock disponible, registra pérdidas o ajustes manuales"
        />
        <CardContent>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Chip
                  icon={<TuneRoundedIcon />}
                  label={`Disponible: ${formatGrams(totalAvailable)} g`}
                  color="success"
                />
                <Chip
                  label={`Producción total: ${formatGrams(totalRoasted)} g`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha tueste</TableCell>
                      <TableCell>Origen</TableCell>
                      <TableCell align="right">Producido</TableCell>
                      <TableCell align="right">Vendido</TableCell>
                      <TableCell align="right">Ajustes</TableCell>
                      <TableCell align="right">Disponible</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aún no hay tostiones registradas.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const availableChipColor =
                          item.available_g <= 0
                            ? "error"
                            : item.available_g < 500
                            ? "warning"
                            : "success";
                        return (
                          <TableRow key={item.roast_id} hover>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={600}>
                                  {new Date(item.roast_date).toLocaleDateString("es-CO")}
                                </Typography>
                                {item.roast_level ? (
                                  <Typography variant="caption" color="text.secondary">
                                    Nivel: {item.roast_level}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.farm_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.variety_name} • {item.lot_process}
                                </Typography>
                                {item.notes ? (
                                  <Tooltip title={item.notes} placement="top-start">
                                    <Typography variant="caption" color="text.secondary" sx={{ cursor: "help" }}>
                                      Ver notas
                                    </Typography>
                                  </Tooltip>
                                ) : null}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{formatGrams(item.roasted_output_g)} g</TableCell>
                            <TableCell align="right">{formatGrams(item.sold_g)} g</TableCell>
                            <TableCell align="right">{formatGrams(item.adjustments_g)} g</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${formatGrams(item.available_g)} g`}
                                color={availableChipColor}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => void handleOpenDialog(item)}
                              >
                                Ajustes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Ajustes de inventario
          {selectedItem ? (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedItem.farm_name} · {selectedItem.variety_name} · Tueste del {" "}
              {new Date(selectedItem.roast_date).toLocaleDateString("es-CO")}
            </Typography>
          ) : null}
        </DialogTitle>
        <DialogContent dividers>
          {adjustmentsError ? <Alert severity="error" sx={{ mb: 2 }}>{adjustmentsError}</Alert> : null}

          <Box component="form" onSubmit={submitAdjustment} sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Cantidad (g)"
                  name="adjustment_g"
                  value={form.adjustment_g}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: "any" }}
                  error={Boolean(formErrors.adjustment_g)}
                  helperText={formErrors.adjustment_g}
                />
                <TextField
                  label="Fecha"
                  name="adjustment_date"
                  value={form.adjustment_date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  type="date"
                  fullWidth
                  required
                />
              </Stack>
              <TextField
                label="Motivo"
                name="reason"
                value={form.reason}
                onChange={handleFormChange}
                multiline
                minRows={2}
                placeholder="Ej: Mermas por selección, degustaciones, etc."
              />
              <Stack direction="row" spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={editingAdjustment ? <EditRoundedIcon /> : <AddRoundedIcon />}
                  disabled={savingAdjustment}
                >
                  {savingAdjustment
                    ? "Guardando..."
                    : editingAdjustment
                    ? "Actualizar ajuste"
                    : "Registrar ajuste"}
                </Button>
                {editingAdjustment ? (
                  <Button onClick={handleCancelEdit} disabled={savingAdjustment}>
                    Cancelar edición
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Box>

          {adjustmentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay ajustes registrados para esta tostión.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id} hover>
                        <TableCell>
                          {new Date(adjustment.adjustment_date).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          {adjustment.reason ? (
                            <Typography variant="body2">{adjustment.reason}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin motivo
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{formatGrams(adjustment.adjustment_g)} g</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditAdjustment(adjustment)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(adjustment)}
                          >
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Total ajustes registrados: {formatGrams(totalAdjustments)} g
          </Typography>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar ajuste"
        description={
          deleteTarget
            ? `¿Seguro que deseas eliminar el ajuste de ${formatGrams(deleteTarget.adjustment_g)} g?`
            : undefined
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </Stack>
  );
};

export default InventoryPage;
