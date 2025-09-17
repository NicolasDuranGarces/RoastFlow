import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";

import { createFarm, createVariety, fetchFarms, fetchVarieties } from "../services/api";
import type { Farm, Variety } from "../types";

const CatalogPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [farmForm, setFarmForm] = useState({ name: "", location: "", notes: "" });
  const [varietyForm, setVarietyForm] = useState({ name: "", description: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [farmsRes, varietiesRes] = await Promise.all([fetchFarms(), fetchVarieties()]);
        setFarms(farmsRes.data as Farm[]);
        setVarieties(varietiesRes.data as Variety[]);
      } catch (error) {
        console.error("Failed to load catalog data", error);
      }
    };
    loadData();
  }, []);

  const handleAddFarm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await createFarm(farmForm);
      setFarms((prev) => [...prev, data as Farm]);
      setFarmForm({ name: "", location: "", notes: "" });
    } catch (error) {
      console.error("Failed to create farm", error);
    }
  };

  const handleAddVariety = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await createVariety(varietyForm);
      setVarieties((prev) => [...prev, data as Variety]);
      setVarietyForm({ name: "", description: "" });
    } catch (error) {
      console.error("Failed to create variety", error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Registrar finca" subheader="Origen del cafe" />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleAddFarm}>
              <TextField
                label="Nombre"
                value={farmForm.name}
                onChange={(e) => setFarmForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <TextField
                label="Ubicacion"
                value={farmForm.location}
                onChange={(e) => setFarmForm((prev) => ({ ...prev, location: e.target.value }))}
              />
              <TextField
                label="Notas"
                value={farmForm.notes}
                onChange={(e) => setFarmForm((prev) => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
              <Button type="submit" variant="contained">
                Guardar finca
              </Button>
            </Box>
            <List dense sx={{ mt: 2 }}>
              {farms.map((farm) => (
                <ListItem key={farm.id} divider>
                  <ListItemText primary={farm.name} secondary={farm.location} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Registrar variedad" subheader="Variedad y proceso" />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleAddVariety}>
              <TextField
                label="Nombre"
                value={varietyForm.name}
                onChange={(e) => setVarietyForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <TextField
                label="Descripcion"
                value={varietyForm.description}
                onChange={(e) => setVarietyForm((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
              <Button type="submit" variant="contained">
                Guardar variedad
              </Button>
            </Box>
            <List dense sx={{ mt: 2 }}>
              {varieties.map((variety) => (
                <ListItem key={variety.id} divider>
                  <ListItemText primary={variety.name} secondary={variety.description} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CatalogPage;
