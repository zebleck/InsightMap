import React, { useState } from "react";
import { Button, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { renameNode } from "../store/graphSlice";
import { AppDispatch } from "../store/store";
import { useHandleLoad } from "../hooks/useHandleLoad";

const RenameButton = ({ ...rest }) => {
  const dispatch: AppDispatch = useDispatch();
  const handleLoad = useHandleLoad();
  const { currentNode } = useSelector((state: any) => state.graph);
  const [show, setShow] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setNewNodeName(currentNode);
    setShow(true);
  };

  const handleRename = (e) => {
    if (newNodeName) {
      dispatch(renameNode({ oldNodeName: currentNode, newNodeName })).then(
        () => {
          handleClose();
          handleLoad(e, newNodeName);
        },
      );
    }
  };

  return (
    <>
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-top`}>Rename Node</Tooltip>}
      >
        <Button
          variant="outline-primary"
          onClick={handleShow}
          {...rest}
          disabled={!currentNode}
        >
          <FaEdit />
        </Button>
      </OverlayTrigger>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Rename Node</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            placeholder="Enter new node name"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleRename}>
            Rename
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RenameButton;
