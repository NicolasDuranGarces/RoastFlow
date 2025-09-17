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
      main: "#1f2937"
    },
    secondary: {
      main: "#f97316"
    },
    background: {
      default: "#eef2f6",
      paper: "#ffffff"
    },
    text: {
      primary: "#1f2937"
    }
  },
  typography: {
    fontFamily: "'Poppins', sans-serif"
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 20,
          paddingBlock: 12,
          boxShadow: "0 12px 22px rgba(31, 41, 55, 0.14)",
          transition: "all 0.25s ease",
          '&:hover': {
            boxShadow: "0 18px 30px rgba(249, 115, 22, 0.25)",
            transform: "translateY(-1px)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          backgroundColor: alpha(theme.palette.common.white, 0.96),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: "0 10px 24px rgba(31, 41, 55, 0.08)",
          transition: theme.transitions.create(["box-shadow", "transform", "border-color"], {
            duration: theme.transitions.duration.shorter
          }),
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.secondary.main, 0.5)
          },
          '&.Mui-focused': {
            transform: "translateY(-1px)",
            boxShadow: `0 18px 36px ${alpha(theme.palette.secondary.main, 0.24)}`,
            backgroundColor: theme.palette.common.white
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.secondary.main
          },
          '& .MuiOutlinedInput-input': {
            padding: "14px 16px"
          },
          '& .MuiOutlinedInput-inputMultiline': {
            padding: 0
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.2,
            borderColor: alpha(theme.palette.primary.main, 0.12)
          }
        })
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          letterSpacing: 0.3,
          color: alpha(theme.palette.text.primary, 0.6),
          '&.Mui-focused': {
            color: theme.palette.secondary.main
          }
        })
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "14px 16px",
          borderRadius: 12
        },
        icon: ({ theme }) => ({
          color: alpha(theme.palette.text.primary, 0.56)
        })
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          margin: "2px 4px",
          paddingInline: 16,
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
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          '& .MuiTableCell-root': {
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
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
