import React, { useEffect, useState } from "react";
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import MarkdownEditor from "../components/MarkdownEditor";
import { Button, Form, FormGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import "./Main.css";

const sanitizeFilename = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9_ -]/g, "");
};

const Main: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [savedFiles, setSavedFiles] = useState<string[]>([]);

  useEffect(() => {
    // Fetch saved files when the component mounts
    axios
      .get("http://localhost:5000/files")
      .then((response) => setSavedFiles(response.data));
  }, []);

  const handleSave = () => {
    axios
      .post(`http://localhost:5000/save/${currentFile}`, {
        content: markdownContent,
      })
      .then(() => {
        // Refresh saved files after saving
        axios
          .get("http://localhost:5000/files")
          .then((response) => setSavedFiles(response.data));
        toast.success("Saved!");
      });
  };

  const handleNew = (fileName?: string) => {
    if (fileName) {
      axios
        .post(`http://localhost:5000/save/${currentFile}`, {
          content: markdownContent,
        })
        .then(() => {
          axios
            .get("http://localhost:5000/files")
            .then((response) => setSavedFiles(response.data));
          setCurrentFile(sanitizeFilename(fileName) + ".md");
          setMarkdownContent("");
        });
    } else {
      setCurrentFile("");
      setMarkdownContent("");
    }
  };

  const handleTree = (selection) => {
    let generatedText = "";

    axios
      .post(`http://localhost:5000/save/${currentFile}`, {
        content: markdownContent,
      })
      .then(() => {
        axios
          .get("http://localhost:5000/files")
          .then((response) => setSavedFiles(response.data));
        setCurrentFile(sanitizeFilename(selection) + ".md");
        setMarkdownContent("");
      });

    axios
      .post("http://localhost:5000/generate_tree", { selection: selection })
      .then((response) => {
        // Initialize the EventSource with the correct URL for SSE (Server-Sent Events)
        const eventSource = new EventSource(
          `http://localhost:5000/generate_tree_sse?session_id=${response.data.session_id}`,
        );

        console.log("EventSource", eventSource);

        eventSource.onmessage = function (event) {
          if (event.data === "__complete__") {
            // Handle your completion logic here.
            eventSource.close();
            axios
              .post(`/save/${selection}.md`, { content: generatedText })
              .then(() => {
                axios
                  .get("/files")
                  .then((response) => setSavedFiles(response.data));
              });
            return;
          }

          generatedText += event.data.replace(/<br>/g, "\n");
          console.log("EventSource message", event.data);
          setMarkdownContent(generatedText);
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

    axios.delete(`http://localhost:5000/files/${currentFile}`).then(() => {
      setCurrentFile("");
      setMarkdownContent("");
      axios
        .get("http://localhost:5000/files")
        .then((response) => setSavedFiles(response.data));
    });
  };

  const loadFile = (filename: string) => {
    axios.get(`http://localhost:5000/files/${filename}`).then((response) => {
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
              handleTree={handleTree}
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

export default Main;
