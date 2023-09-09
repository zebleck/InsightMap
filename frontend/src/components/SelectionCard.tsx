import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaLink, FaPlus, FaQuestion, FaTree } from "react-icons/fa";
import "./SelectionCard.css";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { saveNode } from "../store/graphSlice";
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
  const { currentNode, nodes } = useSelector((state: any) => state.graph);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const selectRef = useRef() as any;

  const handleNew = () => {
    if (codeMirrorInstance) {
      const linkedNode = `[${selection}](<node:${selection}>)`;
      codeMirrorInstance.replaceSelection(linkedNode);
    }
    dispatch(
      saveNode({
        nodeName: selection,
        content: `[${currentNode}](<node:${currentNode}>)`,
      }),
    ).then(() => {
      dispatch(
        saveNode({
          nodeName: currentNode,
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

  const options = nodes.map((node) => ({
    label: node.label,
    value: node.label,
  }));

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
          <Button onClick={() => handleNew()} className="button-left new">
            <FaPlus />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={tooltip("Link node")}>
          <Button onClick={handleOpenModal} className="button-inbetween link">
            <FaLink />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={tooltip("Ask a question")}>
          <Button
            onClick={() => handleTree(selection)}
            className="button-inbetween ask"
          >
            <FaQuestion />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="bottom"
          overlay={tooltip("Tree of abstraction")}
        >
          <Button
            onClick={() => handleTree(selection)}
            className="button-right tree"
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
