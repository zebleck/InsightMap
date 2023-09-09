import React, { useEffect } from "react";
import MarkdownEditor from "../components/MarkdownEditor";
import { Button, Form, FormGroup } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import "./Main.css";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGraph,
  fetchNode,
  newNode,
  saveNode,
  deleteNode,
  setCurrentNode,
} from "../store/graphSlice";
import { AppDispatch } from "../store/store";
import { useNavigate, useParams } from "react-router-dom";
import NodeList from "../components/NodeList";

const Main: React.FC = () => {
  const navigate = useNavigate();
  const { nodeName } = useParams();
  const dispatch: AppDispatch = useDispatch();
  const { currentNode, markdownContent } = useSelector(
    (state: any) => state.graph,
  );

  useEffect(() => {
    dispatch(fetchGraph());
  }, []);

  const handleSave = () => {
    dispatch(saveNode({ nodeName: currentNode, content: markdownContent }));
    navigate(`/${currentNode}`);
  };

  const handleNew = () => {
    dispatch(newNode(""));
    navigate("/");
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Are you sure you want to delete?");
    if (!confirmed) return;
    dispatch(deleteNode(currentNode));
    navigate("/");
  };

  useEffect(() => {
    if (nodeName) {
      dispatch(fetchNode(nodeName));
    } else {
      handleNew();
    }
  }, [nodeName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
          case "s":
            event.preventDefault();
            handleSave();
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
  }, [handleSave]);

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const el = e.target as any;
      if (el.tagName === "A") {
        const href = el.getAttribute("href");
        if (href && href.startsWith("node:")) {
          const nodeName = decodeURI(href.replace("node:", ""));
          handleLoad(e, nodeName);
        }
      }
    });
  }, []);

  const handleLoad = (e, nodeName) => {
    e.preventDefault();
    navigate(`/${nodeName}`);
    dispatch(fetchNode(nodeName));
  };

  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-2">
            <NodeList handleLoad={handleLoad} />
          </div>
          <div className="col-md-8">
            <h4>{currentNode}</h4>
            <MarkdownEditor />
          </div>
          <div className="col-md-2">
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
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-left" autoClose={2500} />
    </>
  );
};

export default Main;
