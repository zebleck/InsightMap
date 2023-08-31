import MarkdownIt from "markdown-it";
import React, { useCallback, useMemo, useRef, useState } from "react";
import SimpleMDE from "react-simplemde-editor";
import mk from "markdown-it-katex";
import SelectionCard from "./SelectionCard";
import "./MarkdownEditor.css";

type MarkdownEditorProps = {
  markdownContent: string;
  setMarkdownContent: (value: string) => void;
  handleNew: (fileName?: string) => void;
  handleTree: (fileName?: string) => void;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownContent,
  setMarkdownContent,
  handleNew,
  handleTree,
}) => {
  const simpleMDERef = useRef<any>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [showButton, setShowButton] = useState(false);

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

  const events = useMemo(() => {
    return {
      cursorActivity: (cm: any) => {
        const selectedText = cm.getSelection();
        if (selectedText) {
          const coordinates = cm.cursorCoords(false, "page"); // 'false' gives the end position

          setSelection(selectedText);
          setPosition({
            left: coordinates.left,
            top: coordinates.top + 20,
          }); // +20 to place it below

          setShowButton(false);
          setTimeout(() => {
            setShowButton(true);
          }, 1000);
        } else {
          setSelection(null);
          setPosition(null);
        }
      },
    };
  }, []);

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet("href");

    if (href && !href.startsWith("https://")) {
      token.attrSet("href", `local:${href}`);
    }

    return self.renderToken(tokens, idx, options);
  };

  return (
    <>
      <SimpleMDE
        ref={simpleMDERef}
        value={markdownContent}
        onChange={onChange}
        options={options}
        events={events}
        className="markdown-editor"
      />
      {showButton && selection && (
        <SelectionCard
          selection={selection}
          position={position}
          handleNew={handleNew}
          handleTree={handleTree}
        />
      )}
    </>
  );
};

export default MarkdownEditor;
