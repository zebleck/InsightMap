import React from "react";
import "./ColorPicker.css";

function ColorPicker({ colorSelected }) {
  return (
    <div className="colorPickerContainer">
      {[
        "#FF6666", // Darker soft red
        "#66FF66", // Darker soft green
        "#6666FF", // Darker soft blue
        "#FF66FF", // Darker soft magenta
        "#66FFFF", // Darker soft cyan
        "#DAA520", // Goldenrod (subdued gold)
        "#555555", // Darker grey
        "#909090", // Medium grey
        "#E0E0E0", // Light grey, close to white but distinguishable
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
