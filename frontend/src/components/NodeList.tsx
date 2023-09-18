import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./NodeList.css";
import { Form } from "react-bootstrap";
import { useParams } from "react-router-dom";

const NodeList = ({ handleLoad }) => {
  const { nodeName } = useParams();
  const { nodes, connectedNodes } = useSelector((state: any) => state.graph);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSearchTerm("");
  }, [nodeName]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredConnectedNodes = connectedNodes
    .filter((node) => node.toLowerCase().includes(searchTerm.toLowerCase()))
    ?.sort((a, b) => a.localeCompare(b));

  const filteredNodes = nodes
    .filter((node) =>
      node.label.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    ?.sort((a, b) => a.label.localeCompare(b.label));

  if (nodeName && !filteredConnectedNodes.length) {
    return (
      <div className="node-list">
        <h5>
          <a href="#" onClick={(e) => handleLoad(e, "")}>
            All Nodes
          </a>
        </h5>
        <h4>No connected nodes</h4>
      </div>
    );
  }

  return (
    <div className="node-list">
      <Form.Control
        type="search"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="mb-3"
      />
      {nodeName ? (
        <>
          <h5>
            <a href="#" onClick={(e) => handleLoad(e, "")}>
              All Nodes
            </a>
          </h5>
          <h4>Connected with</h4>
          <ul>
            {filteredConnectedNodes.map((node) => (
              <li key={node}>
                <a href="#" onClick={(e) => handleLoad(e, node)}>
                  {node}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h4>All Nodes</h4>
          <ul>
            {filteredNodes.map((node) => (
              <li key={node.label}>
                <a href="#" onClick={(e) => handleLoad(e, node.label)}>
                  {node.label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default NodeList;
