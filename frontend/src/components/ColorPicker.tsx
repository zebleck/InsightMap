import React from "react";
import "./ColorPicker.css";

function ColorPicker({ colorSelected }) {
  return (
    <div className="colorPickerContainer">
      {[
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ff00ff",
        "#00ffff",
        "#ffff00",
        "#000000",
        "#808080",
        "#ffffff",
      ].map((color) => (
        <div
          key={color}
          className="colorSquare"
          style={{ backgroundColor: color }}
          onClick={() => colorSelected(color)}
        ></div>
      ))}
    </div>
  );
}

export default ColorPicker;
