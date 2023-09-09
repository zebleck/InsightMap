import React, { useEffect, useState } from "react";
import { Button, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaLink, FaPlus, FaQuestion, FaTree } from "react-icons/fa";
import "./SelectionCard.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchNode, saveNode, setMarkdownContent } from "../store/graphSlice";
import { AppDispatch } from "../store/store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LinkingModal from "./LinkingModal";
import QuestionModal from "./QuestionModal";

const tooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

const server = "http://localhost:5000";

export default function SelectionCard({
  selection,
  position,
  codeMirrorInstance,
}) {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { currentNode, nodes } = useSelector((state: any) => state.graph);
  const nodeExists = nodes.some((node) => node.label === selection);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const handleNew = async () => {
    handleLink(selection);
    if (!nodeExists) {
      await dispatch(
        saveNode({
          nodeName: selection,
          content: `[${currentNode}](<node:${currentNode}>)`,
        }),
      );

      await dispatch(
        saveNode({
          nodeName: currentNode,
          content: codeMirrorInstance.getValue(),
        }),
      );
    } else {
      await dispatch(
        saveNode({
          nodeName: currentNode,
          content: codeMirrorInstance.getValue(),
        }),
      );
    }

    await dispatch(fetchNode(selection));

    navigate(`/${selection}`);
  };

  const handleTree = async (selection) => {
    let generatedText = "";

    await handleNew();

    const previousContent = codeMirrorInstance.getValue();

    axios
      .post(`${server}/generate_tree`, { selection: selection })
      .then((response) => {
        // Initialize the EventSource with the correct URL for SSE (Server-Sent Events)
        const eventSource = new EventSource(
          `${server}/request_sse?session_id=${response.data.session_id}`,
        );

        console.log("EventSource", eventSource);

        eventSource.onmessage = function (event) {
          if (event.data === "__complete__") {
            eventSource.close();
            dispatch(
              saveNode({
                nodeName: selection,
                content: codeMirrorInstance.getValue(),
              }),
            );
            return;
          }

          generatedText += event.data.replace(/<br>/g, "\n");
          console.log("EventSource message", event.data);
          const totalText = `${previousContent}\n\n${generatedText}`;
          dispatch(setMarkdownContent(totalText));
        };

        eventSource.onerror = function (error) {
          console.error("EventSource failed:", error);
          eventSource.close();
        };
      })
      .catch((error) => {
        console.error("Error initializing tree generation:", error);
      });
  };

  const handleQuestion = async (question) => {
    let generatedText = "";

    await handleNew();

    const previousContent = codeMirrorInstance.getValue();

    axios
      .post(`${server}/generate_answer`, {
        topic: selection,
        question: question,
      })
      .then((response) => {
        // Initialize the EventSource with the correct URL for SSE (Server-Sent Events)
        const eventSource = new EventSource(
          `${server}/request_sse?session_id=${response.data.session_id}`,
        );

        console.log("EventSource", eventSource);

        eventSource.onmessage = function (event) {
          if (event.data === "__complete__") {
            eventSource.close();
            dispatch(
              saveNode({
                nodeName: selection,
                content: codeMirrorInstance.getValue(),
              }),
            );
            return;
          }

          generatedText += event.data.replace(/<br>/g, "\n");
          console.log("EventSource message", event.data);
          const totalText = `${previousContent}\n\n${generatedText}`;
          dispatch(setMarkdownContent(totalText));
        };

        eventSource.onerror = function (error) {
          console.error("EventSource failed:", error);
          eventSource.close();
        };
      })
      .catch((error) => {
        console.error("Error initializing tree generation:", error);
      });
  };

  const handleLink = (selectedNode) => {
    if (codeMirrorInstance) {
      const cursor = codeMirrorInstance.getCursor();
      const line = codeMirrorInstance.getLine(cursor.line);
      const regex = /\[.*?\]\(<node:.*?>\)/g;

      let match;
      let alreadyLinked = false;

      while ((match = regex.exec(line)) !== null) {
        const startIndex = match.index;
        const endIndex = regex.lastIndex;

        if (cursor.ch >= startIndex && cursor.ch <= endIndex) {
          alreadyLinked = true;
          break;
        }
      }

      if (alreadyLinked) {
        return;
      }

      const linkedNode = `[${selection}](<node:${selectedNode}>)`;
      codeMirrorInstance.replaceSelection(linkedNode);
    }
  };

  const handleOpenLinkModal = () => {
    setShowLinkModal(true);
  };
  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
  };
  const handleOpenQuestionModal = () => {
    setShowQuestionModal(true);
  };
  const handleCloseQuestionModal = () => {
    setShowQuestionModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
          case "l":
            event.preventDefault();
            handleOpenLinkModal();
            break;
          case "q":
            event.preventDefault();
            handleOpenQuestionModal();
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
  }, [handleOpenLinkModal]);

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
        <OverlayTrigger placement="bottom" overlay={tooltip("New node")}>
          <Button onClick={() => handleNew()} className="button-left new">
            <FaPlus />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={tooltip("Link node")}>
          <Button
            onClick={handleOpenLinkModal}
            className="button-inbetween link"
          >
            <FaLink />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={tooltip("Ask a question")}>
          <Button
            onClick={handleOpenQuestionModal}
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
      <LinkingModal
        show={showLinkModal}
        handleClose={handleCloseLinkModal}
        handleSubmit={handleLink}
      />
      <QuestionModal
        show={showQuestionModal}
        handleClose={handleCloseQuestionModal}
        handleSubmit={handleQuestion}
        topic={selection}
      />
    </Card>
  );
}
