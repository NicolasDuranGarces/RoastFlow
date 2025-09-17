import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  onClear: () => void;
  isDirty: boolean;
}

const FilterPanel = ({ title = "Filtros", children, onClear, isDirty }: FilterPanelProps) => {
  const theme = useTheme();

  const enhancedChildren = Children.map(children, (child, index) => {
    if (!isValidElement(child)) {
      return child;
    }

    const props = child.props ?? {};
    const shouldFillWidth = Object.prototype.hasOwnProperty.call(props, "fullWidth") ? props.fullWidth : true;
    const cloned = shouldFillWidth ? cloneElement(child, { fullWidth: true }) : child;

    return (
      <Box
        key={index}
        sx={{
          flex: "1 1 240px",
          minWidth: { xs: "100%", sm: 240 },
          maxWidth: { xs: "100%", md: 360 }
        }}
      >
        {cloned}
      </Box>
    );
  });

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        mb: 3,
        backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
          theme.palette.common.white,
          0.82
        )} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        boxShadow: isDirty
          ? "0 20px 45px rgba(31, 26, 56, 0.12)"
          : "0 14px 32px rgba(31, 26, 56, 0.08)",
        backdropFilter: "blur(14px)"
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FilterAltRoundedIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            <Chip
              label={isDirty ? "Filtros activos" : "Sin filtros"}
              color={isDirty ? "secondary" : "default"}
              variant={isDirty ? "filled" : "outlined"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Button
            variant="outlined"
            startIcon={<ReplayRoundedIcon />}
            onClick={onClear}
            disabled={!isDirty}
            color="secondary"
            size="small"
            sx={{
              borderRadius: 999,
              px: 2.5,
              py: 0.75,
              borderWidth: 1.5,
              '&.Mui-disabled': {
                opacity: 0.4
              }
            }}
          >
            Limpiar filtros
          </Button>
        </Stack>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {enhancedChildren}
        </Box>
      </Stack>
    </Paper>
  );
};

export default FilterPanel;
