import React from "react";
import { Modal } from "react-bootstrap";

const RecommendationModal = ({ show, onHide, text }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Recommendations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{text}</p>
      </Modal.Body>
    </Modal>
  );
};

export default RecommendationModal;
