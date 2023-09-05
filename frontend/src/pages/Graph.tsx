import React from "react";
import { Link } from "react-router-dom";

const Graph: React.FC = () => {
  return (
    <div>
      <h1>Graph Component</h1>
      <p>This is the Graph component.</p>
      <Link to="/">Go to Main</Link>
    </div>
  );
};

export default Graph;
