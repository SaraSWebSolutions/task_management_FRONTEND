import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";

import {
  BrowserRouter,
} from "react-router-dom";

import { Provider } from "react-redux";

import { store } from "./app/store";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider><App /></ThemeProvider>
    </BrowserRouter>
  </Provider>
);