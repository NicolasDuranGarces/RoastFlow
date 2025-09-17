import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  onClear: () => void;
  isDirty: boolean;
}

const FilterPanel = ({ title = "Filtros", children, onClear, isDirty }: FilterPanelProps) => {
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
      elevation={1}
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 3 },
        mb: 3,
        background: (theme) => theme.palette.background.paper,
        border: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FilterAltRoundedIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Stack>
          <Button
            startIcon={<ReplayRoundedIcon />}
            onClick={onClear}
            disabled={!isDirty}
            color="secondary"
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
