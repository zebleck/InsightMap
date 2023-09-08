import MarkdownIt from "markdown-it";
import React, { useCallback, useMemo, useRef, useState } from "react";
import SimpleMDE from "react-simplemde-editor";
import mk from "markdown-it-katex";
import SelectionCard from "./SelectionCard";
import "./MarkdownEditor.css";
import { setMarkdownContent } from "../store/fileSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";

type MarkdownEditorProps = {
  handleTree: (fileName?: string) => void;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ handleTree }) => {
  const dispatch: AppDispatch = useDispatch();
  const simpleMDERef = useRef<any>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const { markdownContent } = useSelector((state: any) => state.files);

  const onChange = useCallback((value: string) => {
    dispatch(setMarkdownContent(value));
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

  const [codemirrorInstance, setCodemirrorInstance] = useState(null);
  const getCmInstanceCallback = useCallback((editor) => {
    setCodemirrorInstance(editor);
  }, []);

  const events = useMemo(() => {
    return {
      cursorActivity: (cm: any) => {
        const selectedText = cm.getSelection();
        if (selectedText) {
          const coordinates = cm.cursorCoords(false, "page"); // 'false' gives the end position

          setPosition({
            left: coordinates.left,
            top: coordinates.top + 20,
          }); // +20 to place it below

          setTimeout(() => {
            setSelection(selectedText);
          }, 200);
        } else {
          setSelection(null);
          setPosition(null);
        }
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
        className="markdown-editor"
        getCodemirrorInstance={getCmInstanceCallback}
      />
      <SelectionCard
        selection={selection}
        position={position}
        handleTree={handleTree}
        codeMirrorInstance={codemirrorInstance}
      />
    </>
  );
};

export default MarkdownEditor;
