import React from "react";
import { Button, Form, FormGroup, Spinner } from "react-bootstrap";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { removeStream } from "../store/streamSlice";
import { setCurrentNode } from "../store/graphSlice";

const RightSideButtons = ({ handleNew, handleSave, handleDelete }) => {
  const { currentStreams } = useSelector((state: any) => state.stream);
  const { currentNode } = useSelector((state: any) => state.graph);
  const dispatch: AppDispatch = useDispatch();

  const handleStopStream = (streamId: string) => {
    dispatch(removeStream(streamId));
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
