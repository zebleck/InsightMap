import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./NodeList.css";
import { Badge, Form } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { selectAllTags, selectConnectedNodeTags } from "../store/graphSlice";
import "./Tag.css";

const NodeList = ({ handleLoad }) => {
  const { nodeName } = useParams();
  const { nodes, connectedNodes } = useSelector((state: any) => state.graph);
  const allTags = useSelector(selectAllTags);
  const connectedNodeTags = useSelector(selectConnectedNodeTags);
  const tags = nodeName ? connectedNodeTags : allTags;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    setSearchTerm("");
    setSelectedTag(null);
  }, [nodeName]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag) setSelectedTag(null);
    else setSelectedTag(tag);
  };

  const filteredConnectedNodes = connectedNodes
    .filter((node) => {
      return (
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!selectedTag || node.tags?.includes(selectedTag))
      );
    })
    ?.sort((a, b) => a.label.localeCompare(b));

  const filteredNodes = nodes
    .filter((node) => {
      return (
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!selectedTag || node.tags?.includes(selectedTag))
      );
    })
    ?.sort((a, b) => a.label.localeCompare(b.label));

  console.log(connectedNodes);

  console.log(nodes);

  if (nodeName && !filteredConnectedNodes.length) {
    return (
      <div className="node-list">
        {tags.length > 0 && (
          <>
            <h5 className="mb-3">Filter by Tags:</h5>
            <div className="mb-3">
              {tags.map((tag: string) => {
                console.log(selectedTag === tag);
                return (
                  <Badge
                    className={`badge badge-hover bg-${
                      selectedTag === tag ? "primary" : "secondary"
                    } m-1`}
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </>
        )}
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
      {tags.length > 0 && (
        <>
          <h5 className="mb-3">Filter by Tags:</h5>
          <div className="mb-3">
            {tags.map((tag: string) => {
              console.log(selectedTag === tag);
              return (
                <Badge
                  className={`badge badge-hover bg-${
                    selectedTag === tag ? "primary" : "secondary"
                  } m-1`}
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </>
      )}
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
            <a href="/" onClick={(e) => handleLoad(e, "")}>
              All Nodes
            </a>
          </h5>
          <h4>Connected with</h4>
          <ul>
            {filteredConnectedNodes.map((node) => (
              <li key={node.label}>
                <a href={node.label} onClick={(e) => handleLoad(e, node.label)}>
                  {node.label}
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
                <a href={node.label} onClick={(e) => handleLoad(e, node.label)}>
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
