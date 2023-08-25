import React, { useCallback, useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "easymde/dist/easymde.min.css";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";

const App: React.FC = () => {
  const [savedFiles, setSavedFiles] = useState<string[]>([]);

  useEffect(() => {
    // Fetch saved files when the component mounts
    axios.get("/files").then((response) => setSavedFiles(response.data));
  }, []);

  const handleSave = () => {
    axios
      .post("/save", { content: editorRef.current.getContent() })
      .then(() => {
        // Refresh saved files after saving
        axios.get("/files").then((response) => setSavedFiles(response.data));
      });
  };

  const loadFile = (filename: string) => {
    axios.get(`/files/${filename}`).then((response) => {
      if (response.data.success) {
        editorRef.current.setContent(response.data.content);
      }
    });
  };

  const editorRef = useRef(null as any);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
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
          <h1 className="mb-4">InSightMap Editor</h1>
          <Editor
            onInit={(evt, editor) => (editorRef.current = editor)}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste code help wordcount",
                "tiny_mce_wiris",
              ],
              toolbar:
                "undo redo | formatselect | " +
                "bold italic backcolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent |" +
                "removeformat | help | tiny_mce_wiris_formulaEditor",
              content_style:
                "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
            }}
          />
          <button onClick={handleSave} className="btn btn-primary mt-2 me-2">
            Save
          </button>
          <button onClick={log} className="btn btn-secondary mt-2">
            Log editor content
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
