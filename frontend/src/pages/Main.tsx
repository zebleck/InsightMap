import React, { useEffect } from "react";
import MarkdownEditor from "../components/MarkdownEditor";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGraph,
  fetchNode,
  newNode,
  saveNode,
  deleteNode,
} from "../store/graphSlice";
import { AppDispatch } from "../store/store";
import { useNavigate, useParams } from "react-router-dom";
import NodeList from "../components/NodeList";
import RightSideButtons from "../components/RightSideButtons";
import "./Main.css";
import MarkdownIt from "markdown-it";
import TagSection from "../components/TagSection";

const Main: React.FC = () => {
  const navigate = useNavigate();
  const { nodeName } = useParams();
  const dispatch: AppDispatch = useDispatch();
  const { currentNode, markdownContent } = useSelector(
    (state: any) => state.graph,
  );

  useEffect(() => {
    dispatch(fetchGraph());
  }, []);

  const handleSave = () => {
    dispatch(saveNode({ nodeName: currentNode, content: markdownContent }));
    navigate(`/${currentNode}`);
  };

  const handleNew = () => {
    dispatch(newNode(""));
    navigate("/");
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Are you sure you want to delete?");
    if (!confirmed) return;
    dispatch(deleteNode(currentNode));
    navigate("/");
  };

  useEffect(() => {
    if (nodeName) {
      dispatch(fetchNode(nodeName));
    } else {
      handleNew();
    }
  }, [nodeName]);

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
    const handleClick = (e) => {
      const el = e.target as any;
      if (el.tagName === "A") {
        const href = el.getAttribute("href");
        if (href && href.startsWith("node:")) {
          const nodeName = decodeURI(href.replace("node:", ""));

          if (e.ctrlKey || e.shiftKey || e.button === 1) {
            e.preventDefault();
            window.open(`/${nodeName}`, "_blank");
          } else {
            e.preventDefault();
            handleLoad(e, nodeName);
          }
        }
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("auxclick", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("auxclick", handleClick);
    };
  }, []);

  const handleLoad = (e, nodeName) => {
    e.preventDefault();
    navigate(`/${nodeName}`);
    dispatch(fetchNode(nodeName));
  };

  const md = new MarkdownIt();

  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-2">
            <NodeList handleLoad={handleLoad} />
          </div>
          <div className="col-md-8">
            <h4>{currentNode}</h4>
            <TagSection />
            <MarkdownEditor md={md} />
          </div>
          <div className="col-md-2">
            <RightSideButtons
              md={md}
              handleNew={handleNew}
              handleSave={handleSave}
              handleDelete={handleDelete}
            />
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-left" autoClose={2500} />
    </>
  );
};

export default Main;
