import React, { useEffect } from "react";
import axios from "axios";
import MarkdownEditor from "../components/MarkdownEditor";
import { Button, Form, FormGroup } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import "./Main.css";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFiles,
  fetchFile,
  newFile,
  saveFile,
  deleteFile,
  setCurrentFile,
  setMarkdownContent,
} from "../store/fileSlice";
import { AppDispatch } from "../store/store";
import { useNavigate, useParams } from "react-router-dom";

const server = "http://localhost:5000";

const Main: React.FC = () => {
  const navigate = useNavigate();
  const { filename } = useParams();
  const dispatch: AppDispatch = useDispatch();
  const { currentFile, markdownContent, savedFiles } = useSelector(
    (state: any) => state.files,
  );

  useEffect(() => {
    dispatch(fetchFiles());
  }, []);

  const handleSave = () => {
    dispatch(saveFile({ fileName: currentFile, content: markdownContent }));
  };

  const handleNew = () => {
    dispatch(newFile(""));
    navigate("/");
  };

  const handleTree = (selection) => {
    let generatedText = "";

    dispatch(newFile(selection));

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
            // Handle your completion logic here.
            eventSource.close();
            dispatch(setMarkdownContent(generatedText));
            return;
          }

          generatedText += event.data.replace(/<br>/g, "\n");
          console.log("EventSource message", event.data);
          dispatch(setMarkdownContent(generatedText));
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

  const handleDelete = () => {
    const confirmed = window.confirm("Are you sure you want to delete?");
    if (!confirmed) return;
    dispatch(deleteFile(currentFile));
  };

  useEffect(() => {
    if (filename) {
      dispatch(fetchFile(filename));
    } else {
      handleNew();
    }
  }, [filename]);

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
          const filename = decodeURI(href.replace("node:", ""));
          handleLoad(e, filename);
        }
      }
    });
  }, []);

  const handleLoad = (e, filename) => {
    e.preventDefault();
    navigate(`/${filename}`);
  };

  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-2">
            <h4>Saved Files</h4>
            {savedFiles.map((filename) => (
              <ul key={filename}>
                <li>
                  <a href="" onClick={(e) => handleLoad(e, filename)}>
                    {filename}
                  </a>
                </li>
              </ul>
            ))}
          </div>
          <div className="col-md-8">
            <h4>{currentFile}</h4>
            <MarkdownEditor handleTree={handleTree} />
          </div>
          <div className="col-md-2">
            <div className="d-flex flex-column">
              <FormGroup className="mb-3">
                <Form.Label>Filename</Form.Label>
                <Form.Control
                  type="filename"
                  placeholder="Enter filename"
                  value={currentFile}
                  onChange={(e) => dispatch(setCurrentFile(e.target.value))}
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
