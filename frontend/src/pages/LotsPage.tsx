import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
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

import { createLot, deleteLot, fetchFarms, fetchLots, fetchVarieties, updateLot } from "../services/api";
import type { CoffeeLot, Farm, Variety } from "../types";

const processOptions = ["Lavado", "Semilavado", "Honey", "Natural"];

const initialForm = {
  farm_id: "",
  variety_id: "",
  process: processOptions[0],
  purchase_date: new Date().toISOString().slice(0, 10),
  green_weight_kg: "",
  price_per_kg: "",
  moisture_level: "",
  notes: ""
};

const LotsPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [farmsRes, varietiesRes, lotsRes] = await Promise.all([
            fetchFarms(),
            fetchVarieties(),
            fetchLots()
          ]);
          setFarms(farmsRes.data as Farm[]);
          setVarieties(varietiesRes.data as Variety[]);
          setLots(lotsRes.data as CoffeeLot[]);
        } catch (error) {
          console.error("Failed to load lots", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        farm_id: Number(form.farm_id),
        variety_id: Number(form.variety_id),
        process: form.process,
        purchase_date: form.purchase_date,
        green_weight_kg: Number(form.green_weight_kg),
        price_per_kg: Number(form.price_per_kg),
        moisture_level: form.moisture_level ? Number(form.moisture_level) : null,
        notes: form.notes
      };
      if (editingId) {
        await updateLot(editingId, payload);
      } else {
        await createLot(payload);
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Failed to save lot", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lot: CoffeeLot) => {
    setEditingId(lot.id);
    setForm({
      farm_id: String(lot.farm_id),
      variety_id: String(lot.variety_id),
      process: lot.process,
      purchase_date: lot.purchase_date,
      green_weight_kg: String(lot.green_weight_kg),
      price_per_kg: String(lot.price_per_kg),
      moisture_level: lot.moisture_level ? String(lot.moisture_level) : "",
      notes: lot.notes ?? ""
    });
  };

  const handleDelete = async (lot: CoffeeLot) => {
    if (!window.confirm(`Eliminar lote del ${lot.purchase_date}?`)) {
      return;
    }
    try {
      await deleteLot(lot.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete lot", error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar lote" : "Registrar compra cafe verde"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
              <TextField
                select
                label="Finca"
                value={form.farm_id}
                onChange={(e) => setForm((prev) => ({ ...prev, farm_id: e.target.value }))}
                required
              >
                {farms.map((farm) => (
                  <MenuItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Variedad"
                value={form.variety_id}
                onChange={(e) => setForm((prev) => ({ ...prev, variety_id: e.target.value }))}
                required
              >
                {varieties.map((variety) => (
                  <MenuItem key={variety.id} value={variety.id}>
                    {variety.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Proceso"
                value={form.process}
                onChange={(e) => setForm((prev) => ({ ...prev, process: e.target.value }))}
                required
              >
                {processOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
                {!processOptions.includes(form.process) && form.process && (
                  <MenuItem value={form.process}>{form.process}</MenuItem>
                )}
              </TextField>
              <TextField
                label="Fecha compra"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.purchase_date}
                onChange={(e) => setForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
                required
              />
              <TextField
                label="Peso verde (kg)"
                type="number"
                value={form.green_weight_kg}
                onChange={(e) => setForm((prev) => ({ ...prev, green_weight_kg: e.target.value }))}
                required
              />
              <TextField
                label="Precio por kg"
                type="number"
                value={form.price_per_kg}
                onChange={(e) => setForm((prev) => ({ ...prev, price_per_kg: e.target.value }))}
                required
              />
              <TextField
                label="Humedad (%)"
                type="number"
                value={form.moisture_level}
                onChange={(e) => setForm((prev) => ({ ...prev, moisture_level: e.target.value }))}
              />
              <TextField
                label="Notas"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Guardar lote"}
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
          <CardHeader title="Lotes registrados" />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Finca</TableCell>
                  <TableCell>Variedad</TableCell>
                  <TableCell>Proceso</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Kg verdes</TableCell>
                  <TableCell align="right">Precio/kg</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>{farms.find((f) => f.id === lot.farm_id)?.name ?? ""}</TableCell>
                    <TableCell>{varieties.find((v) => v.id === lot.variety_id)?.name ?? ""}</TableCell>
                    <TableCell>{lot.process}</TableCell>
                    <TableCell>{lot.purchase_date}</TableCell>
                    <TableCell align="right">{lot.green_weight_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">${lot.price_per_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEdit(lot)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(lot)}>
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

export default LotsPage;
