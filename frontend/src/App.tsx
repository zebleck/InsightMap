import React from "react";
import { Route, Routes } from "react-router-dom";
import Graph from "./pages/Graph";
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store/store";
import Main from "./pages/Main";

const App: React.FC = () => {
  return (
    <Provider store={store}>
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/graph" element={<Graph />} />
    </Routes>
    </Provider>
  );
};

export default App;
