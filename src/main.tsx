import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PlayerProvider } from "./context/PlayerContext";
import "./styles.css";
import "./play-viewport.css";
import "./player-lookup.css";
import "./growth-demo.css";
import "./hardcore-ui.css";
import "./hardcore-map.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PlayerProvider><App /></PlayerProvider>
    </BrowserRouter>
  </StrictMode>,
);
