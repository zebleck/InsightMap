import React, { useCallback, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

const App: React.FC = () => {
    const [markdownContent, setMarkdownContent] = useState<string>("");

    const onChange = useCallback((value: string) => {
      setMarkdownContent(value);
    }, []);

    const autofocusNoSpellcheckerOptions = useMemo(() => {
      return {
        autofocus: true,
        spellChecker: false,
      };
    }, []);
  

    return (
        <div className="container mt-5">
            <h1 className="mb-4">InSightMap Editor</h1>
            <SimpleMDE value={markdownContent} onChange={onChange} options={autofocusNoSpellcheckerOptions} />
        </div>
    );
}

export default App;
