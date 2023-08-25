import MarkdownIt from "markdown-it";
import React, { useCallback, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import mk from "markdown-it-katex";
import "katex/dist/katex.min.css";

type MarkdownEditorProps = {
  markdownContent: string;
  setMarkdownContent: (value: string) => void;
  handleSave: () => void;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownContent,
  setMarkdownContent,
}) => {
  const onChange = useCallback((value: string) => {
    setMarkdownContent(value);
  }, []);

  const md = new MarkdownIt();
  md.use(mk);

  const renderMarkdown = (text: string) => {
    return md.render(text);
  };

  const options = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
      previewRender: renderMarkdown,
    };
  }, []);

  return (
    <>
      <SimpleMDE
        value={markdownContent}
        onChange={onChange}
        options={options}
      />
    </>
  );
};

export default MarkdownEditor;
