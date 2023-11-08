import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { MentionsInput, Mention } from "react-mentions";
import { useSelector } from "react-redux";
import "./QuestionModal.css";
import { fetchNodeContent } from "../store/graphSlice";

const defaultStyle = {
  control: {
    backgroundColor: "#fff",
    fontSize: 14,
    fontWeight: "normal",
  },

  "&multiLine": {
    control: {
      fontFamily: "monospace",
      minHeight: 63,
    },
    highlighter: {
      padding: 9,
      border: "1px solid transparent",
    },
    input: {
      padding: 9,
      border: "1px solid silver",
    },
  },

  "&singleLine": {
    display: "inline-block",
    width: 180,
  },

  suggestions: {
    list: {
      backgroundColor: "white",
      border: "1px solid rgba(0,0,0,0.15)",
      fontSize: 14,
    },
    item: {
      padding: "5px 15px",
      borderBottom: "1px solid rgba(0,0,0,0.15)",
      "&focused": {
        backgroundColor: "#cee4e5",
      },
    },
  },
};

const QuestionModal = ({ show, handleClose, handleSubmit, context }) => {
  const [question, setQuestion] = useState("");
  const inputRef = useRef(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [createLink, setCreateLink] = useState(false);
  const nodes = useSelector((state: any) => state.graph.nodes);

  useEffect(() => {
    if (show && inputRef.current) {
      if (context) {
        setQuestion(`"${context}"\n\n`);
      }
      inputRef.current.focus();
    }
    if (!show) {
      setCreateNew(false);
      setCreateLink(false);
      setNewNodeName("");
      setQuestion("");
    }
  }, [show]);

  const handleAddMention = (id) => {
    // Fetch the content of the node with the given id
    const node = nodes.find((node) => node.id === id);
    console.log(node);
    if (node) {
      fetchNodeContent(node.label).then((content) => {
        setQuestion((question) =>
          question.replace(`@[${node.label}]`, content),
        );
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleFormSubmit(e);
    }
  };

  const handleInputChange = (_, newValue, __, ___) => {
    setQuestion(newValue);
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
            <MentionsInput
              value={question}
              onChange={handleInputChange}
              inputRef={inputRef}
              onKeyDown={handleKeyDown}
              style={defaultStyle}
            >
              <Mention
                trigger="@"
                data={nodes.map((node) => ({
                  id: node.id,
                  display: node.label,
                }))}
                onAdd={handleAddMention}
                markup="@[__display__]"
              />
            </MentionsInput>
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
