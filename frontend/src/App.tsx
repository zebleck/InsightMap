import React from "react";
import { Route, Routes } from "react-router-dom";
import Main from "./pages/Main";
import Graph from "./pages/Graph";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/graph" element={<Graph />} />
    </Routes>
  );
};

export default App;
