import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaLink, FaPlus, FaTree } from "react-icons/fa";
import "./SelectionCard.css";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { saveFile } from "../store/fileSlice";
import { AppDispatch } from "../store/store";
import { useNavigate } from "react-router-dom";

const tooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

export default function SelectionCard({
  selection,
  position,
  handleTree,
  codeMirrorInstance,
}) {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { currentFile, savedFiles } = useSelector((state: any) => state.files);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const selectRef = useRef() as any;

  const handleNew = () => {
    if (codeMirrorInstance) {
      const linkedNode = `[${selection}](<node:${selection}>)`;
      codeMirrorInstance.replaceSelection(linkedNode);
    }
    dispatch(
      saveFile({
        fileName: selection,
        content: `[${currentFile}](<node:${currentFile}>)`,
      }),
    ).then(() => {
      dispatch(
        saveFile({
          fileName: currentFile,
          content: codeMirrorInstance.getValue(),
        }),
      ).then(() => {
        navigate(`/${selection}`);
      });
    });
  };

  useEffect(() => {
    if (selectRef.current) {
      selectRef?.current?.select?.focus();
    }
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
          case "l":
            event.preventDefault();
            handleOpenModal();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleOpenModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (codeMirrorInstance) {
      const linkedNode = `[${selection}](<node:${selectedNode?.value}>)`;
      codeMirrorInstance.replaceSelection(linkedNode);
    }
    handleCloseModal();
  };

  const options = savedFiles.map((file) => ({ label: file, value: file }));

  if (!selection) return null;

  return (
    <Card
      className="SelectionCard"
      style={{
        left: `${position ? position.left : 0}px`,
        top: `${position ? position.top : 0}px`,
      }}
    >
      <Card.Header className="SelectionCard-header">
        <strong>What do?</strong>
      </Card.Header>
      <Card.Body className="SelectionCard-body">
        <OverlayTrigger placement="bottom" overlay={tooltip("New file")}>
          <Button
            variant="warning"
            onClick={() => handleNew()}
            className="button-left"
          >
            <FaPlus />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={tooltip("Link node")}>
          <Button
            variant="primary"
            onClick={handleOpenModal}
            className="button-inbetween"
          >
            <FaLink />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="bottom"
          overlay={tooltip("Tree of abstraction")}
        >
          <Button
            variant="success"
            onClick={() => handleTree(selection)}
            className="button-right"
          >
            <FaTree />
          </Button>
        </OverlayTrigger>
      </Card.Body>
      <Modal show={showModal} onHide={handleCloseModal}>
        <form onSubmit={handleSubmit}>
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
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Confirm
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </Card>
  );
}
