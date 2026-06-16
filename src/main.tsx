import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.scss";
import "./styles/components/_buttons.scss";
import "./styles/components/_cards.scss";
import "./styles/components/_forms.scss";
import "./styles/components/_misc.scss";
import "./styles/components/_modals.scss";
import "./styles/components/_pills.scss";
import "./styles/components/_tables.scss";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
