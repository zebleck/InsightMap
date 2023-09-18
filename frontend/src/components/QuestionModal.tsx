import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

const QuestionModal = ({ show, handleClose, handleSubmit, context }) => {
  const [question, setQuestion] = useState("");
  const inputRef = useRef(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [createLink, setCreateLink] = useState(false);

  useEffect(() => {
    if (show && inputRef.current) {
      setQuestion(`"${context}"\n\n`);
      const textarea = inputRef.current;
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      setTimeout(() => {
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
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

  const handleNewNodeNameChange = (e) => {
    setNewNodeName(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(question, createNew ? newNodeName : null, createLink);
    setQuestion("");
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Ask a question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="answerTextArea">
            <Form.Label>Question</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
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
          {createNew && (
            <>
              <Form.Group className="mt-3 mb-3" controlId="newNodeName">
                <Form.Label>New Node Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new node name"
                  value={newNodeName}
                  onChange={handleNewNodeNameChange}
                  required
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                label="Link to selected node"
                checked={createLink}
                onChange={(e) => setCreateLink(e.target.checked)}
              />
            </>
          )}
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
