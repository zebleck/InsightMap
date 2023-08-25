import React, { useEffect, useState } from "react";
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import MarkdownEditor from "./MarkdownEditor";
//import "katex/dist/katex.min.css";

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

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-3">
          <h4>Saved Files</h4>
          {savedFiles.map((filename) => (
            <div key={filename}>
              <a href="#!" onClick={() => loadFile(filename)}>
                {filename}
              </a>
            </div>
          ))}
        </div>
        <div className="col-md-9">
          <h4>{currentFile}</h4>
          <MarkdownEditor
            markdownContent={markdownContent}
            setMarkdownContent={setMarkdownContent}
            handleSave={handleSave}
          />
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <label htmlFor="fileNameInput" className="form-label me-2">
                File name
              </label>
              <input
                type="text" // Change this to "text" since it's a file name input
                className="form-control"
                id="fileNameInput"
                placeholder=""
                value={currentFile}
                onChange={(e) => setCurrentFile(e.target.value)}
              />
            </div>
            <button onClick={handleSave} className="btn btn-primary mt-2 me-2">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
