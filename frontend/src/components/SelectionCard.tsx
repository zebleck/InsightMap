import React from "react";
import { Button, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaPlus, FaTree } from "react-icons/fa";
import "./SelectionCard.css";

const tooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

export default function SelectionCard({
  selection,
  position,
  handleNew,
  handleTree,
}) {
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
            onClick={() => handleNew(selection)}
            className="button-left"
          >
            <FaPlus />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="bottom"
          overlay={tooltip("Tree of abstraction")}
        >
          <Button
            variant="info"
            onClick={() => handleTree(selection)}
            className="button-right"
          >
            <FaTree />
          </Button>
        </OverlayTrigger>
      </Card.Body>
    </Card>
  );
}
