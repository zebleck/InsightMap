import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  nodeWithLabelExists,
  removeTagFromNode,
  selectTagsByNode,
  tagNode,
} from "../store/graphSlice";
import { Badge } from "react-bootstrap";
import "./Tag.css";

const TagSection = () => {
  const dispatch: AppDispatch = useDispatch();
  const { currentNode } = useSelector((state: any) => state.graph);

  const [showTagInput, setShowTagInput] = useState(false);
  const tags = useSelector(selectTagsByNode(currentNode));

  if (!useSelector(nodeWithLabelExists(currentNode))) return null;

  const toggleTagInput = () => {
    setShowTagInput(!showTagInput);
  };

  const addTag = (event) => {
    // Validate and add the tag.
    const tag = event.target.value;

    // Dispatch your async thunk here, then close the input
    dispatch(tagNode({ nodeName: currentNode, tags: [tag] }));

    setShowTagInput(false);
  };

  const removeTag = (tagToRemove) => {
    // Dispatch another action to remove the tag
    dispatch(removeTagFromNode({ nodeName: currentNode, tag: tagToRemove }));
  };

  return (
    <>
      <div className="tags">
        {tags &&
          tags.map((tag) => (
            <Badge
              key={tag}
              data-toggle="tooltip"
              data-placement="top"
              title="Remove tag"
              className="badge-hover badge-hover-red bg-secondary"
              onClick={() => removeTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        <Badge
          className="badge-hover bg-light text-secondary"
          onClick={toggleTagInput}
        >
          + Add Tag
        </Badge>
      </div>
      {showTagInput && (
        <input
          type="text"
          onBlur={addTag}
          placeholder="Enter tag..."
          className="tag-input"
        />
      )}
    </>
  );
};

export default TagSection;
