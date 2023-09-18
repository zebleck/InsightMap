import MarkdownIt from "markdown-it";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SimpleMDE from "react-simplemde-editor";
import mk from "markdown-it-katex";
import SelectionCard from "./SelectionCard";
import "./MarkdownEditor.css";
import { setMarkdownContent } from "../store/graphSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";

const MarkdownEditor = () => {
  const dispatch: AppDispatch = useDispatch();
  const simpleMDERef = useRef<any>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [areNodeLinksHighlighted, setAreNodeLinksHighlighted] = useState(true);

  const { markdownContent } = useSelector((state: any) => state.graph);

  const onChange = useCallback((value: string) => {
    dispatch(setMarkdownContent(value));
    if (codemirrorInstance) {
      codemirrorInstance.refresh();
    }
  }, []);

  const md = new MarkdownIt();
  md.use(mk);

  const setMarkdownRenderer = (highlightLinks) => {
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const hrefIndex = tokens[idx].attrIndex("href");
      if (hrefIndex >= 0) {
        const hrefAttr = tokens[idx].attrs[hrefIndex];
        if (hrefAttr && hrefAttr[1].startsWith("node:")) {
          if (highlightLinks) {
            tokens[idx].attrPush(["class", "knowledge-node-link"]);
          } else tokens[idx].attrPush(["class", "knowledge-node-link-hidden"]);
        }
      }
      return self.renderToken(tokens, idx, options);
    };

    // Add a new inline rule parsing <color:hex>text</color> to colorize text
    md.inline.ruler.after("text", "color", function (state, silent) {
      const src = state.src.slice(state.pos);

      const colorMatch = src.match(/<color:(.+?)>(.*?)<\/color>/);
      if (!colorMatch) return false;

      if (!silent) {
        const token = state.push("color_inline", "", 0);
        token.meta = { color: colorMatch[1], text: colorMatch[2] };
        state.pos += colorMatch[0].length;
      }
      return true;
    });

    // Render function for new color_inline tokens
    md.renderer.rules.color_inline = function (tokens, idx) {
      const token = tokens[idx];
      const { color, text } = token.meta;
      return `<span style="color: ${color}">${text}</span>`;
    };
  };

  setMarkdownRenderer(areNodeLinksHighlighted);

  const renderMarkdown = useRef<(text: string) => string>((text: string) => {
    return md.render(text);
  });

  useEffect(() => {
    renderMarkdown.current = (text: string) => {
      return md.render(text);
    };
  }, [areNodeLinksHighlighted]);

  const toggleNodeLinksRef = useRef<() => void>(() => {});

  const [codemirrorInstance, setCodemirrorInstance] = useState(null);
  const getCmInstanceCallback = useCallback((editor) => {
    setCodemirrorInstance(editor);
  }, []);

  useEffect(() => {
    toggleNodeLinksRef.current = () => {
      setAreNodeLinksHighlighted((prevValue) => {
        const newValue = !prevValue;

        const toolbarButton = document.querySelector(".toggleNodeHighlights");

        if (toolbarButton) {
          if (newValue) {
            toolbarButton.classList.add("on"); // Highlight when active
          } else {
            toolbarButton.classList.remove("on"); // Reset to default when not active
          }
        }

        const newContent = markdownContent + " ";
        dispatch(setMarkdownContent(newContent));
        setTimeout(() => {
          dispatch(setMarkdownContent(markdownContent.trim()));
        }, 10);

        if (codemirrorInstance) {
          codemirrorInstance.refresh();
        }

        return newValue;
      });
    };
  }, [markdownContent]);

  const options = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
      previewRender: (text) => {
        return renderMarkdown.current(text);
      },
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        "image",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        {
          name: "toggleNodeHighlights",
          action: () => {
            toggleNodeLinksRef.current();
          },
          className: "fa fa-sitemap no-disable on",
          title: "Toggle Node Highlights",
        } as any,
        "|",
        "guide",
      ],
    };
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
          });

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
      <div className="editor-container">
        <SimpleMDE
          ref={simpleMDERef}
          value={markdownContent}
          onChange={onChange}
          options={options}
          events={events}
          className="markdown-editor"
          getCodemirrorInstance={getCmInstanceCallback}
        />
      </div>
      <SelectionCard
        selection={selection}
        position={position}
        codeMirrorInstance={codemirrorInstance}
      />
    </>
  );
};

export default MarkdownEditor;
