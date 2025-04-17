import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../utils/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
}));

const ComparisonSlider = styled(Slider)(({ theme }) => ({
  width: '90%',
  margin: '0 auto',
  '& .MuiSlider-markLabel': {
    fontSize: '0.75rem'
  }
}));

const steps = ['Define Criteria', 'Add Locations', 'Compare Criteria', 'View Results', 'Detail Result'];

const Home = () => {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [criteria, setCriteria] = useState([]);
  const [locations, setLocations] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [weights, setWeights] = useState([]);
  const [results, setResults] = useState([]);
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [loading, setLoading] = useState(false);
  const [ahpDetails, setAhpDetails] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const getAhpDetails = async (evalId) => {
    setLoading(true);
    try {
      const details = await api.evaluation.getEvaluationDetails(evalId);
      setAhpDetails(details.ahp_details);
      showSnackbar('AHP details loaded successfully');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  // Form states
  const [newCriterion, setNewCriterion] = useState({ name: '', description: '' });
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    scores: {}
  });

  // UI states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [dialog, setDialog] = useState({
    addCriterion: false,
    addLocation: false
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [criteriaRes, locationsRes] = await Promise.all([
          api.criteria.fetchAll(),
          api.locations.fetchAll()
        ]);

        setCriteria(criteriaRes);
        setLocations(locationsRes);

        // Initialize scores for new location
        const initialScores = {};
        criteriaRes.forEach(c => {
          initialScores[c._id] = 5; // Default score 5/10
        });
        setNewLocation(prev => ({ ...prev, scores: initialScores }));

      } catch (error) {
        showSnackbar(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Initialize comparisons when criteria changes
  useEffect(() => {
    if (criteria.length > 1) {
      const newComparisons = [];
      for (let i = 0; i < criteria.length; i++) {
        for (let j = i + 1; j < criteria.length; j++) {
          newComparisons.push({
            criterion_a: criteria[i]._id,
            criterion_b: criteria[j]._id,
            value: 1 // Equal importance by default
          });
        }
      }
      setComparisons(newComparisons);
    }
  }, [criteria]);

  // Helper functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Criteria handlers
  const handleAddCriterion = async () => {
    if (!newCriterion.name.trim()) {
      showSnackbar('Criterion name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const createdCriterion = await api.criteria.create(newCriterion);
      setCriteria([...criteria, createdCriterion]);

      // Update new location scores with new criterion
      setNewLocation(prev => ({
        ...prev,
        scores: { ...prev.scores, [createdCriterion._id]: 5 }
      }));

      setNewCriterion({ name: '', description: '' });
      setDialog({ ...dialog, addCriterion: false });
      showSnackbar('Criterion added successfully');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Location handlers
  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      showSnackbar('Location name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const createdLocation = await api.locations.create(newLocation);
      setLocations([...locations, createdLocation]);

      // Reset form but keep scores structure
      setNewLocation({
        name: '',
        address: '',
        scores: Object.fromEntries(
          Object.keys(newLocation.scores).map(id => [id, 5])
        ) // <-- Thêm dấu đóng ngoặc ở đây
      });


      setDialog({ ...dialog, addLocation: false });
      showSnackbar('Location added successfully');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Comparison handlers
  const handleComparisonChange = (index, value) => {
    const newComparisons = [...comparisons];
    newComparisons[index].value = value;
    setComparisons(newComparisons);
  };

  const handleSubmitComparisons = async () => {
    setLoading(true);
    try {
      const result = await api.pairwise.submit({
        user_id: userId,
        criteria_ids: criteria.map(c => c._id),
        comparisons
      });

      setWeights(result.weights);
      showSnackbar('Comparisons submitted successfully');
      handleNext();
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Evaluation handler
  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const result = await api.evaluation.evaluate({
        user_id: userId,
        criteria_ids: criteria.map(c => c._id),
        location_ids: locations.map(l => l._id),
        weights
      });

      setResults(result.results);
      setEvaluationId(result._id); // Lưu evaluationId để dùng cho step 5
      showSnackbar('Evaluation completed successfully');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Score update handler for location dialog
  const handleScoreChange = (criterionId, value) => {
    setNewLocation(prev => ({
      ...prev,
      scores: { ...prev.scores, [criterionId]: value }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Store Location Decision System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Analytic Hierarchy Process (AHP) based decision support tool
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Step 1: Define Criteria */}
      {activeStep === 0 && !loading && (
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Evaluation Criteria
              </Typography>
              <Button
                variant="contained"
                onClick={() => setDialog({ ...dialog, addCriterion: true })}
                color="primary"
              >
                Add Criterion
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
              Define the criteria that will be used to evaluate potential store locations.
              Common criteria include location accessibility, rental costs, and customer demographics.
            </Typography>

            {criteria.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criteria.map((criterion) => (
                      <TableRow key={criterion._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={criterion.name}
                              size="small"
                              sx={{ mr: 1, fontWeight: 'medium' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{criterion.description || 'No description'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{
                p: 4,
                border: '1px dashed #ddd',
                borderRadius: 1,
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <Typography color="text.secondary">
                  No criteria defined yet. Add your first criterion to get started.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={criteria.length === 0}
                sx={{ px: 4 }}
              >
                Continue
              </Button>
            </Box>
          </CardContent>
        </StyledCard>
      )}

      {/* Step 2: Add Locations */}
      {activeStep === 1 && !loading && (
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Potential Locations
              </Typography>
              <Button
                variant="contained"
                onClick={() => setDialog({ ...dialog, addLocation: true })}
                color="primary"
              >
                Add Location
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
              Add all potential locations you're considering for your new store.
              You'll score each location against the defined criteria in the next steps.
            </Typography>

            {locations.length > 0 ? (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {locations.map((location) => (
                  <Grid item xs={12} sm={6} md={4} key={location._id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {location.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {location.address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Scores: {Object.values(location.scores).filter(s => s > 0).length}/{criteria.length} criteria
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{
                p: 4,
                border: '1px dashed #ddd',
                borderRadius: 1,
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <Typography color="text.secondary">
                  No locations added yet. Add your first potential location.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={locations.length === 0}
                sx={{ px: 4 }}
              >
                Continue
              </Button>
            </Box>
          </CardContent>
        </StyledCard>
      )}

      {/* Step 3: Pairwise Comparisons */}
      {activeStep === 2 && !loading && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 3 }}>
              Criteria Importance Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Compare each pair of criteria to determine their relative importance.
              Use the sliders to indicate how much more important one criterion is compared to another.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {comparisons.map((comparison, index) => {
                const criterionA = criteria.find(c => c._id === comparison.criterion_a);
                const criterionB = criteria.find(c => c._id === comparison.criterion_b);

                return (
                  <Grid item xs={12} key={`${comparison.criterion_a}-${comparison.criterion_b}`}>
                    <Box sx={{
                      p: 2,
                      border: '1px solid #eee',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9'
                    }}>
                      <Typography gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
                        <strong>{criterionA?.name}</strong> compared to <strong>{criterionB?.name}</strong>
                      </Typography>
                      <ComparisonSlider
                        value={comparison.value}
                        onChange={(e, newValue) => handleComparisonChange(index, newValue)}
                        min={1 / 9}
                        max={9}
                        step={1}
                        marks={[
                          { value: 1 / 9, label: '1/9 (Extremely less important)' },
                          { value: 1 / 3, label: '1/3' },
                          { value: 1, label: '1 (Equal)' },
                          { value: 3, label: '3' },
                          { value: 9, label: '9 (Extremely more important)' },
                        ]}
                        valueLabelDisplay="auto"
                        scale={(x) => x}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitComparisons}
                sx={{ px: 4 }}
              >
                Calculate Weights
              </Button>
            </Box>
          </CardContent>
        </StyledCard>
      )}

      {/* Step 4: Evaluation Results */}
      {activeStep === 3 && !loading && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 3 }}>
              Evaluation Results
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                onClick={handleEvaluate}
                sx={{ mr: 2 }}
              >
                Run Evaluation
              </Button>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Start New Evaluation
              </Button>

              {/* Nút chuyển qua Step 5 */}
              <Button
                variant="contained"
                onClick={() => setActiveStep(4)}  // Chuyển qua Step 5 (index 4)
                sx={{ ml: 2 }}
              >
                Go to Step 5
              </Button>
            </Box>

            {results.length > 0 ? (
              <>
                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                  Based on your criteria weights and location scores, here are the recommended locations:
                </Typography>

                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Score</TableCell>
                        {criteria.map(criterion => (
                          <TableCell key={criterion._id} align="right" sx={{ fontWeight: 'bold' }}>
                            {criterion.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow
                          key={result.location_id}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                            ...(index === 0 && { backgroundColor: '#e8f5e9 !important' })
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={`#${index + 1}`}
                              color={index === 0 ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="medium">{result.location_name}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              {result.total_score.toFixed(2)}
                            </Typography>
                          </TableCell>
                          {criteria.map(criterion => {
                            const score = result.scores.find(s => s.criterion_id === criterion._id);
                            return (
                              <TableCell key={criterion._id} align="right">
                                {score ? score.weighted_score.toFixed(2) : '0.00'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box sx={{
                p: 4,
                border: '1px dashed #ddd',
                borderRadius: 1,
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <Typography color="text.secondary">
                  No evaluation results yet. Click "Run Evaluation" to analyze your locations.
                </Typography>
              </Box>
            )}
          </CardContent>
        </StyledCard>
      )}

      {/* Step 5: AHP Details */}
      {activeStep === 4 && !loading && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 3 }}>
              AHP Analysis Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ mr: 2 }}
              >
                Back to Results
              </Button>
              <Button
                variant="contained"
                onClick={() => getAhpDetails(evaluationId)}
              >
                Refresh AHP Data
              </Button>
            </Box>

            {ahpDetails ? (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Consistency Analysis
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Consistency Index (CI)
                      </Typography>
                      <Typography variant="h6">
                        {ahpDetails.consistency_index?.toFixed(4) || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Consistency Ratio (CR)
                      </Typography>
                      <Typography
                        variant="h6"
                        color={ahpDetails.is_consistent ? 'success.main' : 'error.main'}
                      >
                        {ahpDetails.consistency_ratio?.toFixed(4) || 'N/A'}
                        {ahpDetails.is_consistent !== undefined &&
                          ` (${ahpDetails.is_consistent ? 'Consistent' : 'Inconsistent'})`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Lambda Max
                      </Typography>
                      <Typography variant="h6">
                        {ahpDetails.lambda_max?.toFixed(4) || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Pairwise Comparison Matrix
                </Typography>
                {ahpDetails.pairwise_matrix && (
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Criteria</TableCell>
                          {criteria.map(c => (
                            <TableCell key={c._id} align="center" sx={{ fontWeight: 'bold' }}>
                              {c.name}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ahpDetails.pairwise_matrix.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {criteria[i]?.name || `Criterion ${i + 1}`}
                            </TableCell>
                            {row.map((value, j) => (
                              <TableCell key={j} align="center">
                                {value.toFixed(2)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Normalized Matrix
                </Typography>
                {ahpDetails.normalized_matrix && (
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Criteria</TableCell>
                          {criteria.map(c => (
                            <TableCell key={c._id} align="center" sx={{ fontWeight: 'bold' }}>
                              {c.name}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ahpDetails.normalized_matrix.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {criteria[i]?.name || `Criterion ${i + 1}`}
                            </TableCell>
                            {row.map((value, j) => (
                              <TableCell key={j} align="center">
                                {value.toFixed(4)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Final Weights
                </Typography>
                {ahpDetails.weights && (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Criteria</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Weight</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ahpDetails.weights.map((weight, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {criteria[i]?.name || `Criterion ${i + 1}`}
                            </TableCell>
                            <TableCell align="right">
                              {weight.toFixed(4)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            ) : (
              <Box sx={{
                p: 4,
                border: '1px dashed #ddd',
                borderRadius: 1,
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <Typography color="text.secondary">
                  No AHP details loaded yet. Click "Refresh AHP Data" to load analysis details.
                </Typography>
              </Box>
            )}
          </CardContent>
        </StyledCard>
      )}
      {/* Add Criterion Dialog */}
      <Dialog
        open={dialog.addCriterion}
        onClose={() => setDialog({ ...dialog, addCriterion: false })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Criterion</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Criterion Name"
            fullWidth
            variant="outlined"
            value={newCriterion.name}
            onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newCriterion.description}
            onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, addCriterion: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleAddCriterion}
            disabled={!newCriterion.name.trim()}
            variant="contained"
          >
            Add Criterion
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog
        open={dialog.addLocation}
        onClose={() => setDialog({ ...dialog, addLocation: false })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Location Name"
            fullWidth
            variant="outlined"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            variant="outlined"
            value={newLocation.address}
            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle1" gutterBottom>
            Criteria Scores (1-10)
          </Typography>

          {criteria.map(criterion => (
            <Box key={criterion._id} sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {criterion.name}
              </Typography>
              <Slider
                value={newLocation.scores[criterion._id] || 0}
                onChange={(e, newValue) => handleScoreChange(criterion._id, newValue)}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, addLocation: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleAddLocation}
            disabled={!newLocation.name.trim()}
            variant="contained"
          >
            Add Location
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;