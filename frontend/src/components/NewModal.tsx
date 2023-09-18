import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

const NewModal = ({ show, handleClose, handleSubmit, selection }) => {
  const [nodeName, setNodeName] = useState(selection);

  const handleInputChange = (e) => {
    setNodeName(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(nodeName);
    setNodeName('');
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Node</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="newNodeName">
            <Form.Label>Node Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter node name"
              value={nodeName}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit">
            Create Node
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default NewModal;
