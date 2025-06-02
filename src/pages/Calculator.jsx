import React, { useState } from 'react';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LabelList
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Calculator = () => {
  const [file, setFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError('');
    setResult(null);

    // Preview Excel content
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

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.calculateExcel.calculateExcel(file);

      if (res.error) {
        setError(res.error);
        return;
      }

      setResult(res);
    } catch (err) {
      setError('An error occurred during calculation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for data transformation
  const transformCriteriaData = () => {
    if (!result?.criteria_priority_vector) return [];
    return Object.entries(result.criteria_priority_vector).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(4))
    }));
  };

  const transformAlternativeScores = () => {
    if (!result?.alternatives) return [];
    return Object.entries(result.alternatives).map(([name, score]) => ({
      name,
      score: parseFloat(score.toFixed(4))
    }));
  };

  const transformConsistencyData = () => {
    if (!result?.consistency_report) return [];
    return Object.entries(result.consistency_report).map(([name, data]) => ({
      name,
      CR: data.consistency_ratio,
      lambdaMax: data.lambda_max,
      isConsistent: data.is_consistent ? 'Yes' : 'No'
    }));
  };

  const transformPerCriterionData = (criterion) => {
    if (!result?.per_criterion_alternative_priority?.[criterion]) return [];
    return Object.entries(result.per_criterion_alternative_priority[criterion]).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(4))
    }));
  };

  const renderComparisonMatrix = (sheetName) => {
    if (!excelPreview[sheetName]) return null;
    
    const headers = excelPreview[sheetName][0];
    const rows = excelPreview[sheetName].slice(1);
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4>{sheetName}</h4>
        <table border="1" cellPadding="5" style={{ marginBottom: '20px' }}>
          <thead>
            <tr>
              <th></th>
              {headers.map((header, i) => <th key={i}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td><strong>{headers[i+1]}</strong></td>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderNormalizedMatrix = (sheetName) => {
    if (!excelPreview[sheetName]) return null;
    
    const headers = excelPreview[sheetName][0];
    const rows = excelPreview[sheetName].slice(1);
    const numericRows = rows.map(row => row.map(cell => typeof cell === 'number' ? cell : parseFloat(cell) || 0));
    
    // Calculate column sums
    const columnSums = numericRows.reduce((sums, row) => {
      return row.map((val, i) => (sums[i] || 0) + val);
    }, []);
    
    // Normalize matrix
    const normalized = numericRows.map(row => 
      row.map((val, i) => columnSums[i] !== 0 ? (val / columnSums[i]).toFixed(4) : 0)
    );
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4>Normalized {sheetName}</h4>
        <table border="1" cellPadding="5" style={{ marginBottom: '20px' }}>
          <thead>
            <tr>
              <th></th>
              {headers.map((header, i) => <th key={i}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {normalized.map((row, i) => (
              <tr key={i}>
                <td><strong>{headers[i+1]}</strong></td>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>AHP Excel Calculator</h2>
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
          style={{ marginLeft: '10px', padding: '5px 15px' }}
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* Excel Preview Section */}
      {Object.keys(excelPreview).length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '40px' }}>
          <h3>Excel File Preview</h3>
          {Object.keys(excelPreview).map(sheetName => (
            <div key={sheetName}>
              {renderComparisonMatrix(sheetName)}
              {renderNormalizedMatrix(sheetName)}
            </div>
          ))}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div style={{ marginTop: '30px' }}>
          <h3>AHP Results</h3>

          {/* Criteria Priority Vector */}
          <div style={{ marginBottom: '40px' }}>
            <h4>🌐 Criteria Priority Vector</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
              <div style={{ width: '400px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transformCriteriaData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      <LabelList dataKey="value" position="top" formatter={(value) => value.toFixed(4)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '400px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transformCriteriaData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {transformCriteriaData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toFixed(4)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Final Alternative Scores */}
          <div style={{ marginBottom: '40px' }}>
            <h4>📊 Final Alternative Scores</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
              <div style={{ width: '500px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transformAlternativeScores()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toFixed(4)} />
                    <Legend />
                    <Bar dataKey="score" fill="#82ca9d">
                      <LabelList dataKey="score" position="top" formatter={(value) => value.toFixed(4)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '400px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={transformAlternativeScores()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value) => value.toFixed(4)} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per Criterion Alternative Priority */}
          <div style={{ marginBottom: '40px' }}>
            <h4>📈 Alternative Priority per Criterion</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
              {result.per_criterion_alternative_priority && 
                Object.keys(result.per_criterion_alternative_priority).map(criterion => (
                  <div key={criterion} style={{ marginBottom: '20px' }}>
                    <h5>{criterion}</h5>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transformPerCriterionData(criterion)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 1]} />
                          <Tooltip formatter={(value) => value.toFixed(4)} />
                          <Bar dataKey="value" fill="#ffbb28">
                            <LabelList dataKey="value" position="top" formatter={(value) => value.toFixed(4)} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Consistency Report */}
          <div style={{ marginBottom: '40px' }}>
            <h4>🧪 Consistency Report</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
              <div style={{ width: '600px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transformConsistencyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="CR" name="Consistency Ratio" fill="#8884d8">
                      <LabelList dataKey="CR" position="top" formatter={(value) => value.toFixed(4)} />
                    </Bar>
                    <Bar yAxisId="right" dataKey="lambdaMax" name="Lambda Max" fill="#82ca9d">
                      <LabelList dataKey="lambdaMax" position="top" formatter={(value) => value.toFixed(4)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '400px', height: '300px' }}>
                <h5>Consistency Status</h5>
                <table border="1" cellPadding="5" style={{ width: '100%', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>CR</th>
                      <th>Consistent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformConsistencyData().map((item, i) => (
                      <tr key={i} style={{ background: item.CR >= 0.1 ? '#ffdddd' : '#ddffdd' }}>
                        <td>{item.name}</td>
                        <td>{item.CR.toFixed(4)}</td>
                        <td>{item.isConsistent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Criteria Consistency Details */}
          <div style={{ marginBottom: '40px' }}>
            <h4>📝 Criteria Matrix Details</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h5>Priority Vector</h5>
                <table border="1" cellPadding="5" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformCriteriaData().map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.value.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h5>Consistency Metrics</h5>
                <table border="1" cellPadding="5" style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td>Consistency Ratio (CR)</td>
                      <td>{result.criteria_consistency_ratio.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td>Acceptable (CR &lt; 0.1)</td>
                      <td>{result.criteria_consistency_ratio < 0.1 ? 'Yes ✅' : 'No ❌'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;