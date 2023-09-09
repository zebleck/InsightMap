import React, { useEffect, useRef, useState } from "react";

import { Button, Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import Select from "react-select";

const LinkingModal = ({ show, handleClose, handleSubmit }) => {
  const { nodes } = useSelector((state: any) => state.graph);
  const selectRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (selectRef.current) {
      selectRef?.current?.select?.focus();
    }
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(selectedNode.label);
    setSelectedNode(null);
    handleClose();
  };

  const options = nodes.map((node) => ({
    label: node.label,
    value: node.label,
  }));

  return (
    <Modal show={show} onHide={handleClose}>
      <form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Link to Node</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Select
            options={options}
            value={selectedNode}
            onChange={(node) => setSelectedNode(node)}
            ref={selectRef}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit">
            Confirm
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default LinkingModal;
