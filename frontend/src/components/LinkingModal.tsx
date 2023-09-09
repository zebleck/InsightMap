import React, { useEffect, useRef, useState } from "react";

import { Button, Form, Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import Select from "react-select";

const LinkingModal = ({ show, handleClose, handleSubmit }) => {
  const { nodes } = useSelector((state: any) => state.graph);
  const selectRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [linkAll, setLinkAll] = useState(false);

  useEffect(() => {
    if (selectRef.current) {
      selectRef?.current?.select?.focus();
    }
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(selectedNode.label, linkAll);
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
            className="mb-3"
          />
          <Form.Check
            type="checkbox"
            label="Link all"
            checked={linkAll}
            onChange={(e) => setLinkAll(e.target.checked)}
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
