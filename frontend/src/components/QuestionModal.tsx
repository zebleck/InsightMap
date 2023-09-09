import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

const QuestionModal = ({ show, handleClose, handleSubmit, topic }) => {
  const [question, setQuestion] = useState("");
  const inputRef = useRef(null);
  const [createNew, setCreateNew] = useState(false);

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleFormSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(question, createNew);
    setQuestion("");
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            Ask a question about <strong>{topic}</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="answerTextArea">
            <Form.Control
              as="textarea"
              rows={3}
              value={question}
              onChange={handleInputChange}
              ref={inputRef}
              onKeyDown={handleKeyDown}
            />
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Answer in new node"
            checked={createNew}
            onChange={(e) => setCreateNew(e.target.checked)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit">
            Submit Answer
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default QuestionModal;
