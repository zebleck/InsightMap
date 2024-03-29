import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DataSet,
  Network,
} from "vis-network/standalone/esm/vis-network.min.js";
import { useNavigate } from "react-router-dom";

const Graph: React.FC = () => {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    // Fetch graph data from your Flask API
    axios.get("http://localhost:5001/graph").then((response) => {
      setGraphData(response.data);
    });
  }, []);

  useEffect(() => {
    // Create Vis Network
    const nodes = new DataSet(
      graphData.nodes.map((node) => ({ ...node, shape: "box" })),
    );
    const edges = new DataSet(
      graphData.edges.map((edge) => ({ ...edge, label: "", arrows: "to" })),
    );

    const container = document.getElementById("network");

    const data = {
      nodes: nodes,
      edges: edges,
    };

    const options = {
      physics: {
        stabilization: false,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.5,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1,
        },
      },
    };

    if (container) {
      const network = new Network(container, data, options);

      network.on("doubleClick", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const nodeData = nodes.get(nodeId) as any;
          if (nodeData && nodeData.label) {
            navigate(`/${nodeData.label}`);
          }
        }
      });
    }
  }, [graphData]);

  return (
    <div>
      <div id="network" style={{ height: "800px" }}></div>
    </div>
  );
};

export default Graph;
