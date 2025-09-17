import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f1a38"
    },
    secondary: {
      main: "#ff7b54"
    },
    background: {
      default: "#f5f2ed",
      paper: "#ffffff"
    },
    text: {
      primary: "#1b1a2f"
    }
  },
  typography: {
    fontFamily: "'Poppins', sans-serif"
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 22,
          paddingBlock: 12,
          boxShadow: "0 12px 25px rgba(31, 26, 56, 0.15)",
          transition: "all 0.25s ease",
          '&:hover': {
            boxShadow: "0 16px 32px rgba(255, 123, 84, 0.25)",
            transform: "translateY(-1px)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 18,
          backgroundColor: alpha(theme.palette.common.white, 0.92),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: "0 12px 32px rgba(31, 26, 56, 0.08)",
          transition: theme.transitions.create(["box-shadow", "transform", "border-color"], {
            duration: theme.transitions.duration.shorter
          }),
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.secondary.main, 0.5)
          },
          '&.Mui-focused': {
            transform: "translateY(-2px)",
            boxShadow: `0 20px 44px ${alpha(theme.palette.secondary.main, 0.28)}`,
            backgroundColor: theme.palette.common.white
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.secondary.main
          },
          '& .MuiOutlinedInput-input': {
            padding: "16px 20px"
          },
          '& .MuiOutlinedInput-inputMultiline': {
            padding: 0
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.4,
            borderColor: alpha(theme.palette.primary.main, 0.12)
          }
        })
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          letterSpacing: 0.2,
          color: alpha(theme.palette.text.primary, 0.58),
          '&.Mui-focused': {
            color: theme.palette.secondary.main
          }
        })
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "16px 20px",
          borderRadius: 18
        },
        icon: ({ theme }) => ({
          color: alpha(theme.palette.text.primary, 0.56)
        })
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          margin: "4px 8px",
          paddingInline: 18,
          paddingBlock: 10,
          transition: theme.transitions.create(["background-color", "transform"], {
            duration: theme.transitions.duration.shorter
          }),
          '&:hover': {
            backgroundColor: alpha(theme.palette.secondary.main, 0.18)
          },
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.secondary.main, 0.22)
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(theme.palette.secondary.main, 0.3)
          }
        })
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          '& .MuiTableCell-root': {
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.7,
            fontSize: "0.75rem",
            color: alpha(theme.palette.text.primary, 0.7)
          }
        })
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
        })
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
