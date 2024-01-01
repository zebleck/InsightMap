import React, { useState } from "react";
import {
  Button,
  Form,
  FormGroup,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import {
  FaFilePdf,
  FaLightbulb,
  FaLink,
  FaPlus,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  initiateRecommendationsStream,
  removeStream,
} from "../store/streamSlice";
import { fetchNodeContent, setCurrentNode } from "../store/graphSlice";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import htmlToPdfmake from "html-to-pdfmake";
import RenameButton from "./RenameButton";
import classNames from "classnames";
import "./RightSideButtons.css";
import RecommendationModal from "./RecommendationsModal";
import { toast } from "react-toastify";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const fetchImageAsDataURL = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const exportToPdf = async (currentNode, content, md) => {
  // Find and expand the node links that are also headings
  const headingNodeRegex = /## \[(.*?)\]\(<node:(.*?)>\)/g;
  let headingNodeMatch;
  let expandedMarkdownContent = content;

  while ((headingNodeMatch = headingNodeRegex.exec(content)) !== null) {
    const [, linkText, nodeName] = headingNodeMatch;
    const nodeContent = await fetchNodeContent(nodeName);
    const expandedContent = `## ${linkText}\n\n${nodeContent}`;
    expandedMarkdownContent = expandedMarkdownContent.replace(
      headingNodeMatch[0],
      expandedContent,
    );
  }

  // Fetch and convert images to data URL
  const imageRegex = /!\[.*\]\(img:(.+?)\)/g;
  let match;
  let markdownContentWithDataURLs = expandedMarkdownContent;

  // Replace image links with data URLs
  while ((match = imageRegex.exec(content)) !== null) {
    const [, imageHash] = match;
    const url = `http://localhost:5000/uploaded_images/${imageHash}`;
    const dataURL = await fetchImageAsDataURL(url);
    markdownContentWithDataURLs = markdownContentWithDataURLs.replace(
      match[0],
      `![](${dataURL})`,
    );
  }

  // Replace node links back to their original form
  const nodeRegex = /\[(.*?)\]\(<node:(.*?)>\)/g;
  const markdownContentWithNodes = markdownContentWithDataURLs.replace(
    nodeRegex,
    (match, text) => {
      return text; // Replace with the text only, removing the node link
    },
  );

  const htmlContent = md.render(markdownContentWithNodes);
  const pdfMakeContent = htmlToPdfmake(htmlContent);
  const documentDefinition = {
    content: pdfMakeContent,
  };

  pdfMake.createPdf(documentDefinition).download(`${currentNode}.pdf`);
};

const RightSideButtons = ({ md, handleNew, handleSave, handleDelete }) => {
  const { currentStreams } = useSelector((state: any) => state.stream);
  const { currentNode, markdownContent } = useSelector(
    (state: any) => state.graph,
  );
  const dispatch: AppDispatch = useDispatch();

  const handleStopStream = (streamId: string) => {
    dispatch(removeStream(streamId));
  };

  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendations, setRecommendations] = useState("");
  const [recommandationsStreamId, setRecommendationsStreamId] = useState("");

  const handleRecommendations = async (nodeName, nodeContent) => {
    const onError = (error) => {
      console.error("EventSource failed:", error);
    };

    let response = "";

    const onMessage = (event) => {
      // Stream the output into the modal
      setShowRecommendationModal(true);

      const newChunk = event.data.replace(/<br>/g, "\n");
      response += newChunk;
      setRecommendations(response);
    };

    setShowRecommendationModal(true);
    const action = await dispatch(
      initiateRecommendationsStream({
        nodeName,
        nodeContent,
        onMessage,
        onError,
      }),
    );
    setRecommendationsStreamId(action.payload as string);
  };

  const handleStopRecommendations = () => {
    setShowRecommendationModal(false);
    setRecommendations("");
    if (recommandationsStreamId) {
      dispatch(removeStream(recommandationsStreamId));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const baseButtonStyle =
    "d-inline-flex justify-content-center align-items-center";
  const circleButtonSize = "50px"; // this should be equal to maintain the circle shape

  // Inline styles for circular buttons
  const circularButtonStyle = {
    width: circleButtonSize,
    height: circleButtonSize,
    borderRadius: "50%", // this makes the button a circle
    fontSize: "1.5rem", // adjust font size as necessary
    padding: "0", // reset padding to maintain the circle shape
  };

  return (
    <div className="d-flex flex-wrap my-4">
      <div className="d-flex flex-column">
        <FormGroup className="mb-3">
          <Form.Label className="font-weight-bold">Node Name</Form.Label>
          <Form.Control
            className="py-2"
            type="text"
            placeholder="Enter node name"
            value={currentNode}
            onChange={(e) => dispatch(setCurrentNode(e.target.value))}
          />
        </FormGroup>
        <div className="mb-3">
          <p className="mb-2 text-center text-muted">
            <strong>Node Operations</strong>
          </p>
          <div className="d-flex flex-row justify-content-center">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>New Node</Tooltip>}
            >
              <Button
                onClick={handleNew}
                className={classNames("new-node", "me-2", baseButtonStyle)}
                style={circularButtonStyle}
              >
                <FaPlus />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>Delete Node</Tooltip>}
            >
              <Button
                onClick={handleDelete}
                className={classNames("delete-node", "me-2", baseButtonStyle)}
                style={circularButtonStyle}
              >
                <FaTrash />
              </Button>
            </OverlayTrigger>
            <RenameButton
              className={classNames("rename-node", "me-2", baseButtonStyle)}
              style={circularButtonStyle}
            />
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>Save Node</Tooltip>}
            >
              <Button
                onClick={handleSave}
                className={classNames("save-node", "me-2", baseButtonStyle)}
                style={circularButtonStyle}
              >
                <FaSave />
              </Button>
            </OverlayTrigger>
          </div>
        </div>
        <div className="mb-3">
          <p className="mb-2 text-center text-muted">
            <strong>Additional</strong>
          </p>
          <div className="d-flex flex-row justify-content-center">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>Copy Link</Tooltip>}
            >
              <Button
                onClick={copyLink}
                className={classNames("copy-link", "me-2", baseButtonStyle)}
                style={circularButtonStyle}
              >
                <FaLink />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>Export to PDF</Tooltip>}
            >
              <Button
                onClick={() => exportToPdf(currentNode, markdownContent, md)}
                className={classNames("export-pdf", "me-2", baseButtonStyle)}
                style={circularButtonStyle}
              >
                <FaFilePdf />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`tooltip-top`}>Generate Recommendations</Tooltip>
              }
            >
              <Button
                onClick={() =>
                  handleRecommendations(currentNode, markdownContent)
                }
                className={classNames(
                  "generate-recommendations",
                  "me-2",
                  baseButtonStyle,
                )}
                style={circularButtonStyle}
              >
                <FaLightbulb />
              </Button>
            </OverlayTrigger>
          </div>
        </div>
        {Object.keys(currentStreams).map((streamId, index) => (
          <div key={streamId}>
            <p className="mb-2 text-center text-muted">
              <strong>AI Streams</strong>
            </p>
            <div className="d-flex flex-row justify-content-center">
              <Button
                variant="info"
                onClick={() => handleStopStream(streamId)}
                className="mb-3"
              >
                <Spinner animation="border" size="sm" className="mr-2" /> Stop
                Stream {index + 1}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <RecommendationModal
        show={showRecommendationModal}
        text={recommendations}
        onHide={() => handleStopRecommendations()}
      />
    </div>
  );
};

export default RightSideButtons;
