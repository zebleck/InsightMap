import MarkdownIt from "markdown-it";
import React, { useCallback, useMemo, useRef, useState } from "react";
import SimpleMDE from "react-simplemde-editor";
import mk from "markdown-it-katex";
import "katex/dist/katex.min.css";
import { Button } from "react-bootstrap";

const NewButton: React.FC<{
  selection: string;
  position: { left: number; top: number } | null;
  handleNew: (fileName?: string) => void;
}> = ({ selection, position, handleNew }) => {
  return (
    <Button
      variant="warning"
      onClick={() => handleNew(selection)}
      style={{
        position: "absolute",
        left: `${position ? position.left : 0}px`,
        top: `${position ? position.top : 0}px`,
      }}
    >
      New
    </Button>
  );
};

type MarkdownEditorProps = {
  markdownContent: string;
  setMarkdownContent: (value: string) => void;
  handleNew: (fileName?: string) => void;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownContent,
  setMarkdownContent,
  handleNew,
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
          const coordinates = cm.cursorCoords(false, "window"); // 'false' gives the end position
          setSelection(selectedText);
          setPosition({ left: coordinates.left, top: coordinates.top + 20 }); // +20 to place it below

          setShowButton(false);
          setTimeout(() => {
            setShowButton(true);
          }, 1000);
        } else {
          setSelection(null);
          setPosition(null);
        }
      },
      mousedown: (cm: any) => {
        cm.on("mouseup", () => {
          console.log("HI");
        });
      },
    };
  }, []);

  return (
    <>
      <SimpleMDE
        ref={simpleMDERef}
        value={markdownContent}
        onChange={onChange}
        options={options}
        events={events}
      />
      {showButton && selection && (
        <NewButton
          selection={selection}
          position={position}
          handleNew={handleNew}
        />
      )}
    </>
  );
};

export default MarkdownEditor;
