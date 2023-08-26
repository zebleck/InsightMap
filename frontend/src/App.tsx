import React, { useEffect, useState } from "react";
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import MarkdownEditor from "./components/MarkdownEditor";
import { Button, Form, FormGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import "./App.css";
//import "katex/dist/katex.min.css";

const sanitizeFilename = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9_ -]/g, "");
};

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [savedFiles, setSavedFiles] = useState<string[]>([]);

  useEffect(() => {
    // Fetch saved files when the component mounts
    axios.get("/files").then((response) => setSavedFiles(response.data));
  }, []);

  const handleSave = () => {
    axios
      .post(`/save/${currentFile}`, { content: markdownContent })
      .then(() => {
        // Refresh saved files after saving
        axios.get("/files").then((response) => setSavedFiles(response.data));
        toast.success("Saved!");
      });
  };

  const handleNew = (fileName?: string) => {
    if (fileName) {
      axios
        .post(`/save/${currentFile}`, { content: markdownContent })
        .then(() => {
          axios.get("/files").then((response) => setSavedFiles(response.data));
          setCurrentFile(sanitizeFilename(fileName));
          setMarkdownContent("");
        });
    } else {
      setCurrentFile("");
      setMarkdownContent("");
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Are you sure you want to delete?");
    if (!confirmed) return;

    axios.delete(`/files/${currentFile}`).then(() => {
      setCurrentFile("");
      setMarkdownContent("");
      axios.get("/files").then((response) => setSavedFiles(response.data));
    });
  };

  const loadFile = (filename: string) => {
    axios.get(`/files/${filename}`).then((response) => {
      if (response.data.success) {
        setCurrentFile(filename);
        setMarkdownContent(response.data.content);
      }
    });
  };

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
        if (href && href.startsWith("local:")) {
          e.preventDefault();
          const filename = decodeURI(href.replace("local:", ""));
          loadFile(filename);
        }
      }
    });
  }, []);

  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-2">
            <h4>Saved Files</h4>
            {savedFiles.map((filename) => (
              <ul key={filename}>
                <li>
                  <a href="#!" onClick={() => loadFile(filename)}>
                    {filename}
                  </a>
                </li>
              </ul>
            ))}
          </div>
          <div className="col-md-8">
            <h4>{currentFile}</h4>
            <MarkdownEditor
              markdownContent={markdownContent}
              setMarkdownContent={setMarkdownContent}
              handleNew={handleNew}
            />
          </div>
          <div className="col-md-2">
            <div className="d-flex flex-column">
              <FormGroup className="mb-3">
                <Form.Label>Filename</Form.Label>
                <Form.Control
                  type="filename"
                  placeholder="Enter filename"
                  value={currentFile}
                  onChange={(e) => setCurrentFile(e.target.value)}
                />
              </FormGroup>
              <Button
                variant="warning"
                onClick={() => handleNew()}
                className="mb-3"
              >
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

export default App;
