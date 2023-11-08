import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  nodeWithLabelExists,
  removeTagFromNode,
  selectAllTags,
  selectTagsByNode,
  tagNode,
} from "../store/graphSlice";
import "./Tag.css";
import CreateableSelect from "react-select/creatable";

const TagSection = () => {
  const dispatch: AppDispatch = useDispatch();
  const { currentNode } = useSelector((state: any) => state.graph);

  const allTags = useSelector(selectAllTags);
  const tags = useSelector(selectTagsByNode(currentNode));

  if (!useSelector(nodeWithLabelExists(currentNode))) return null;

  const tagOptions = allTags?.map((tag) => ({ label: tag, value: tag }));
  const selectedTags = tags?.map((tag) => ({ label: tag, value: tag }));

  const handleChange = (newSelectedTags, actionMeta) => {
    if (
      actionMeta.action === "create-option" ||
      actionMeta.action === "select-option"
    ) {
      const newTags = newSelectedTags.map((tagObj) => tagObj.value);
      // Call your action to add the tags here
      dispatch(tagNode({ nodeName: currentNode, tags: newTags }));
    } else if (actionMeta.action === "remove-value") {
      // Call your action to remove the tag here
      dispatch(
        removeTagFromNode({
          nodeName: currentNode,
          tag: actionMeta.removedValue.value,
        }),
      );
    }
  };

  return (
    <div className="tags">
      <CreateableSelect
        isMulti
        name="tags"
        options={tagOptions || []}
        value={selectedTags || []}
        onChange={handleChange}
        className="basic-multi-select"
        classNamePrefix="select"
        placeholder="Add tags..."
        isClearable={false}
        isSearchable={true}
        closeMenuOnSelect={true}
        onCreateOption={(inputValue) => {
          const newOption = { label: inputValue, value: inputValue };
          handleChange([...selectedTags, newOption], {
            action: "create-option",
          });
        }}
      />
    </div>
  );
};

export default TagSection;
