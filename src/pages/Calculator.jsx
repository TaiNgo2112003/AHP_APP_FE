import React, { useState } from 'react';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const Calculator = () => {
  const [file, setFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setResult(null);

    // Preview nội dung Excel
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });

      const previewData = {};
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        previewData[sheetName] = json;
      });
      setExcelPreview(previewData);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const res = await api.calculateExcel.calculateExcel(file);

      if (res.error) {
        setError(res.error);
        setResult(null);
        return;
      }

      setResult(res);
      setError('');

    } catch (err) {
      setResult(null);
      setError('Có lỗi xảy ra khi tính toán.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>AHP Excel Calculator</h2>
      <input type="file" accept=".xlsx" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: '10px' }}>
        Tính toán
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Review nội dung file Excel */}
      {Object.keys(excelPreview).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Xem trước file Excel</h3>
          {Object.entries(excelPreview).map(([sheetName, rows]) => (
            <div key={sheetName} style={{ marginBottom: '20px' }}>
              <h4>{sheetName}</h4>
              <table border="1" cellPadding="5">
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Kết quả AHP */}
      {result && (
        <div style={{ marginTop: '30px' }}>
          <h3>Kết quả AHP</h3>

          <h4>🌐 Vector ưu tiên tiêu chí:</h4>
          <ul>
            {Object.entries(result.criteria_priority_vector || {}).map(([crit, val]) => (
              <li key={crit}>{crit}: {val}</li>
            ))}
          </ul>

          <h4>📊 Điểm phương án cuối cùng:</h4>
          <ul>
            {Object.entries(result.alternatives || {}).map(([alt, score]) => (
              <li key={alt}>{alt}: {score}</li>
            ))}
          </ul>

          <h4>📈 Ưu tiên phương án theo từng tiêu chí:</h4>
          {result.per_criterion_alternative_priority &&
            Object.entries(result.per_criterion_alternative_priority).map(([crit, scores]) => (
              <div key={crit}>
                <strong>{crit}</strong>
                <ul>
                  {Object.entries(scores).map(([alt, val]) => (
                    <li key={alt}>{alt}: {val}</li>
                  ))}
                </ul>
              </div>
            ))}

          <h4>🧪 Kiểm tra tính nhất quán:</h4>
          <ul>
            {Object.entries(result.consistency_report || {}).map(([crit, info]) => (
              <li key={crit}>
                <strong>{crit}</strong> - CR: {info.consistency_ratio}, λmax: {info.lambda_max}, consistent: {info.is_consistent ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Calculator;
