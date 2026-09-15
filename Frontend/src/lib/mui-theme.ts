import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const muiTheme = createTheme({
  palette: {
    primary: { main: "#a9531f" },
    background: {
      default: "#f2e8dc",
      paper: "#fffaf4",
    },
    text: {
      primary: "#392b23",
      secondary: "#7c6e63",
    },
    divider: "#e7d8c9",
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
  shape: { borderRadius: 12 },
});
