import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import InventoryIntelligenceApp from "./InventoryIntelligenceApp";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <InventoryIntelligenceApp />
  </StrictMode>
);

