import React, { useState } from "react";

const criteria = ["Chi phí thuê", "Mật độ dân số", "Mức độ cạnh tranh", "Khả năng tiếp cận", "Tính pháp lý"];

const AHPTable = ({ onCalculate }) => {
  const [weights, setWeights] = useState(Array(criteria.length).fill(1));

  const handleWeightChange = (index, value) => {
    const newWeights = [...weights];
    newWeights[index] = parseFloat(value);
    setWeights(newWeights);
  };

  return (
    <div className="ahp-table">
      <h3>Bảng đánh giá trọng số</h3>
      <table>
        <thead>
          <tr>
            <th>Tiêu chí</th>
            <th>Trọng số</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion, index) => (
            <tr key={index}>
              <td>{criterion}</td>
              <td>
                <input
                  type="number"
                  value={weights[index]}
                  onChange={(e) => handleWeightChange(index, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => onCalculate(weights)}>Tính toán</button>
    </div>
  );
};

export default AHPTable;