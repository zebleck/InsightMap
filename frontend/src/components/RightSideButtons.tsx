import React from "react";
import { Button, Form, FormGroup, Spinner } from "react-bootstrap";
import { FaFilePdf, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { removeStream } from "../store/streamSlice";
import { fetchNodeContent, setCurrentNode } from "../store/graphSlice";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import htmlToPdfmake from "html-to-pdfmake";
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

const RightSideButtons = ({ md, handleNew, handleSave, handleDelete }) => {
  const { currentStreams } = useSelector((state: any) => state.stream);
  const { currentNode, markdownContent } = useSelector(
    (state: any) => state.graph,
  );
  const dispatch: AppDispatch = useDispatch();

  const handleStopStream = (streamId: string) => {
    dispatch(removeStream(streamId));
  };

  const exportToPdf = async () => {
    // Find and expand the node links that are also headings
    const headingNodeRegex = /## \[(.*?)\]\(<node:(.*?)>\)/g;
    let headingNodeMatch;
    let expandedMarkdownContent = markdownContent;

    while (
      (headingNodeMatch = headingNodeRegex.exec(markdownContent)) !== null
    ) {
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
    while ((match = imageRegex.exec(markdownContent)) !== null) {
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

  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendationSessionId, setRecommendationSessionId] = useState(null);

  const handleFetchRecommendations = async () => {
    const sessionId = await dispatch(fetchRecommendations(currentNode)).unwrap(); 
    setRecommendationSessionId(sessionId);
    setShowRecommendationModal(true);
  };

  return (
    <div className="d-flex flex-column">
      <FormGroup className="mb-3">
        <Form.Label>nodeName</Form.Label>
        <Form.Control
          type="nodeName"
          placeholder="Enter nodeName"
          value={currentNode}
          onChange={(e) => dispatch(setCurrentNode(e.target.value))}
        />
      </FormGroup>
      <Button variant="warning" onClick={handleNew} className="mb-3">
        <FaPlus />
      </Button>
      <Button variant="danger" onClick={handleDelete} className="mb-3">
        <FaTrash />
      </Button>
      <Button variant="primary" onClick={handleSave} className="mb-3">
        <FaSave />
      </Button>
      <Button variant="danger" onClick={exportToPdf} className="mb-3">
        <FaFilePdf />
      </Button>
      <Button variant="info" onClick={handleFetchRecommendations} className="mb-3">
    Generate Recommendations
  </Button>;

  // Recommendation Modal
  showRecommendationModal && (
    <RecommendationModal
      show={showRecommendationModal}
      session_id={recommendationSessionId}
      onHide={() => setShowRecommendationModal(false)}
    />
  )
      {Object.keys(currentStreams).map((streamId, index) => (
        <Button
          variant="info"
          onClick={() => handleStopStream(streamId)}
          className="mb-3"
          key={streamId}
        >
          <Spinner animation="border" size="sm" className="mr-2" /> Stop Stream{" "}
          {index + 1}
        </Button>
      ))}
    </div>
  );
};

export default RightSideButtons;
