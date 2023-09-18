import React, { useEffect, useState } from "react";
import { Button, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaLink, FaPlus, FaQuestion, FaTimes, FaTree } from "react-icons/fa";
import "./SelectionCard.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchNode, saveNode, setMarkdownContent } from "../store/graphSlice";
import { AppDispatch } from "../store/store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LinkingModal from "./LinkingModal";
import QuestionModal from "./QuestionModal";
import NewModal from "./NewModal";

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
  const [showNewModal, setShowNewModal] = useState(false);

  const handleNew = async (newNodeName = null) => {
    const nodeName = newNodeName || selection;
    handleLink(nodeName);
    if (!nodeExists) {
      await dispatch(
        saveNode({
          nodeName: nodeName,
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

    await dispatch(fetchNode(nodeName));

    navigate(`/${nodeName}`);
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

  const handleEventSource = (eventSource, createNew, fromCursor) => {
    let lastCursor = fromCursor;
    let isFirstChunk = true;

    eventSource.onmessage = function (event) {
      if (event.data === "__complete__") {
        eventSource.close();
        if (createNew) {
          dispatch(
            saveNode({
              nodeName: selection,
              content: codeMirrorInstance.getValue(),
            }),
          );
        }
        return;
      }

      let newChunk = event.data.replace(/<br>/g, "\n");

      if (createNew && isFirstChunk) {
        newChunk = `\n\n${newChunk}`;
        isFirstChunk = false; // Reset the flag
      }

      // Calculate how many new lines are there in the new text
      const newLines = newChunk.split("\n").length - 1;
      const lastLineLength = newChunk.split("\n").pop().length;

      // Calculate the ending cursor position after the new text is added
      const toCursor = {
        line: lastCursor.line + newLines,
        ch: newLines ? lastLineLength : lastCursor.ch + newChunk.length,
      };

      // Insert new content without specifying an ending cursor to avoid overwriting
      if (createNew) {
        codeMirrorInstance.replaceRange(newChunk, lastCursor, toCursor);
      } else {
        codeMirrorInstance.replaceRange(newChunk, lastCursor);
      }

      // Update the last cursor position for the next round
      lastCursor = toCursor;
    };

    eventSource.onerror = function (error) {
      console.error("EventSource failed:", error);
      eventSource.close();
    };
  };

  const handleQuestion = async (question, createNew = false) => {
    let fromCursor;

    if (createNew) {
      await handleNew();

      // Move cursor to the end of the new file
      const line = codeMirrorInstance.lineCount() - 1;
      const ch = codeMirrorInstance.getLine(line).length;
      fromCursor = { line, ch };
      codeMirrorInstance.setCursor(fromCursor);
    } else {
      fromCursor = codeMirrorInstance.getCursor(false);
    }
    axios
      .post(`${server}/generate_answer`, {
        topic: selection,
        question: question,
      })
      .then((response) => {
        const eventSource = new EventSource(
          `${server}/request_sse?session_id=${response.data.session_id}`,
        );
        handleEventSource(eventSource, createNew, fromCursor);
      });
  };

  const handleLink = (selectedNode, linkAll = false) => {
    if (codeMirrorInstance) {
      if (linkAll) {
        const lineCount = codeMirrorInstance.lineCount();
        for (let i = 0; i < lineCount; i++) {
          const line = codeMirrorInstance.getLine(i);
          const keywords = [selectedNode, selection];

          keywords.forEach((keyword) => {
            // Identify index ranges for already linked instances
            const alreadyLinkedRegex = new RegExp(
              `\\[.*?${keyword}.*?\\]\\(<node:.*?>\\)`,
              "gi",
            );
            let match;
            const alreadyLinkedRanges = [];

            while ((match = alreadyLinkedRegex.exec(line)) !== null) {
              const startIndex = match.index;
              const endIndex = match.index + match[0].length;
              alreadyLinkedRanges.push([startIndex, endIndex]);
            }

            // Iterate through the line and identify standalone instances to replace
            let newLine = "";
            let lastIndex = 0;

            const replacePattern = new RegExp(`\\b${keyword}\\b`, "gi");
            while ((match = replacePattern.exec(line)) !== null) {
              let shouldReplace = true;
              const matchStart = match.index;
              const matchEnd = match.index + match[0].length;

              // Check if this match is inside any already linked range
              for (const [start, end] of alreadyLinkedRanges) {
                if (matchStart >= start && matchEnd <= end) {
                  shouldReplace = false;
                  break;
                }
              }

              newLine += line.substring(lastIndex, match.index); // append text before match
              if (shouldReplace) {
                newLine += `[${match[0]}](<node:${selectedNode}>)`; // append replaced text
              } else {
                newLine += match[0]; // append original text
              }
              lastIndex = match.index + match[0].length;
            }

            newLine += line.substring(lastIndex); // append text after last match

            // Update the line in CodeMirror
            codeMirrorInstance.replaceRange(
              newLine,
              { line: i, ch: 0 },
              { line: i, ch: line.length },
            );
          });
        }
      } else {
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
    }
  };

  const handleRemoveLinks = () => {
    if (codeMirrorInstance) {
      const selection = codeMirrorInstance.getSelection();
      const replacedText = selection.replace(/\[(.*?)\]\(<node:.*?>\)/g, "$1");
      codeMirrorInstance.replaceSelection(replacedText);
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
  const handleOpenNewModal = () => {
    setShowNewModal(true);
  };
  const handleCloseNewModal = () => {
    setShowNewModal(false);
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
          <Button onClick={handleOpenNewModal} className="button-left new">
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
        <OverlayTrigger
          placement="bottom"
          overlay={tooltip("Remove node links")}
        >
          <Button
            onClick={() => handleRemoveLinks()}
            className="button-inbetween remove"
          >
            <FaTimes />
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
      <NewModal
        show={showNewModal}
        handleClose={handleCloseNewModal}
        handleSubmit={handleNew}
        selection={selection}
      />
    </Card>
  );
}
