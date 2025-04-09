import React, { useState, useEffect } from 'react';
import { 
  fetchCriteria, 
  createCriterion, 
  fetchLocations, 
  createLocation,
  submitPairwiseComparisons,
  evaluateLocations
} from '../utils/api';
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
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
}));

const ComparisonSlider = styled(Slider)(({ theme }) => ({
  width: '80%',
  margin: '0 auto',
}));

const steps = ['Define Criteria', 'Add Locations', 'Pairwise Comparisons', 'Evaluate Results'];

const Home = () => {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [criteria, setCriteria] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newCriterion, setNewCriterion] = useState({ name: '', description: '' });
  const [newLocation, setNewLocation] = useState({ 
    name: '', 
    address: '', 
    coordinates: { lat: 0, lng: 0 },
    scores: {} 
  });
  const [comparisons, setComparisons] = useState([]);
  const [weights, setWeights] = useState([]);
  const [results, setResults] = useState([]);
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openAddCriterionDialog, setOpenAddCriterionDialog] = useState(false);
  const [openAddLocationDialog, setOpenAddLocationDialog] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const criteriaData = await fetchCriteria();
        setCriteria(criteriaData);
        
        const locationsData = await fetchLocations();
        setLocations(locationsData);
      } catch (error) {
        showSnackbar('Failed to load data', 'error');
      }
    };
    
    loadData();
  }, []);

  // Helper functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Criteria handlers
  const handleAddCriterion = async () => {
    try {
      const createdCriterion = await createCriterion(newCriterion);
      setCriteria([...criteria, createdCriterion]);
      setNewCriterion({ name: '', description: '' });
      setOpenAddCriterionDialog(false);
      showSnackbar('Criterion added successfully');
    } catch (error) {
      showSnackbar('Failed to add criterion', 'error');
    }
  };

  // Location handlers
  const handleAddLocation = async () => {
    try {
      // Initialize scores for all criteria
      const scores = {};
      criteria.forEach(criterion => {
        scores[criterion._id] = 0; // Default score of 0
      });

      const locationToAdd = {
        ...newLocation,
        scores
      };

      const createdLocation = await createLocation(locationToAdd);
      setLocations([...locations, createdLocation]);
      setNewLocation({ 
        name: '', 
        address: '', 
        coordinates: { lat: 0, lng: 0 },
        scores: {} 
      });
      setOpenAddLocationDialog(false);
      showSnackbar('Location added successfully');
    } catch (error) {
      showSnackbar('Failed to add location', 'error');
    }
  };

  // Comparison handlers
  const handleComparisonChange = (index, value) => {
    const newComparisons = [...comparisons];
    newComparisons[index].value = value;
    setComparisons(newComparisons);
  };

  const handleSubmitComparisons = async () => {
    try {
      const comparisonData = {
        user_id: userId,
        criteria_ids: criteria.map(c => c._id),
        comparisons: comparisons
      };

      const result = await submitPairwiseComparisons(comparisonData);
      setWeights(result.weights);
      showSnackbar('Comparisons submitted successfully');
      handleNext();
    } catch (error) {
      showSnackbar('Failed to submit comparisons', 'error');
    }
  };

  // Evaluation handler
  const handleEvaluate = async () => {
    try {
      const evaluationData = {
        user_id: userId,
        criteria_ids: criteria.map(c => c._id),
        location_ids: locations.map(l => l._id),
        weights: weights
      };

      const result = await evaluateLocations(evaluationData);
      setResults(result.results);
      showSnackbar('Evaluation completed successfully');
    } catch (error) {
      showSnackbar('Failed to evaluate locations', 'error');
    }
  };

  // Initialize comparisons when criteria changes
  useEffect(() => {
    if (criteria.length > 0) {
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AHP Store Location Decision Support System
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          This tool helps you decide the best location for your new store using the Analytic Hierarchy Process (AHP) method.
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step 1: Define Criteria */}
        {activeStep === 0 && (
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Define Decision Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add the criteria you'll use to evaluate potential store locations. 
                Common criteria include: Geographic Location, Rental Costs, Population Density, 
                Competition Level, Accessibility, and Legal Considerations.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={() => setOpenAddCriterionDialog(true)}
                sx={{ mb: 2 }}
              >
                Add New Criterion
              </Button>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criteria.map((criterion) => (
                      <TableRow key={criterion._id}>
                        <TableCell>{criterion.name}</TableCell>
                        <TableCell>{criterion.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={criteria.length === 0}
                >
                  Next: Add Locations
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        )}
        
        {/* Step 2: Add Locations */}
        {activeStep === 1 && (
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Potential Locations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Enter the locations you're considering for your new store. 
                After adding locations, you'll score each one against your criteria.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={() => setOpenAddLocationDialog(true)}
                sx={{ mb: 2 }}
              >
                Add New Location
              </Button>
              
              <Grid container spacing={2}>
                {locations.map((location) => (
                  <Grid item xs={12} sm={6} md={4} key={location._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{location.name}</Typography>
                        <Typography variant="body2">{location.address}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={locations.length === 0}
                >
                  Next: Pairwise Comparisons
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        )}
        
        {/* Step 3: Pairwise Comparisons */}
        {activeStep === 2 && (
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pairwise Criteria Comparisons
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Compare each pair of criteria to determine their relative importance. 
                Use the sliders to indicate how much more important one criterion is compared to another.
              </Typography>
              
              <Grid container spacing={3}>
                {comparisons.map((comparison, index) => {
                  const criterionA = criteria.find(c => c._id === comparison.criterion_a);
                  const criterionB = criteria.find(c => c._id === comparison.criterion_b);
                  
                  return (
                    <Grid item xs={12} key={`${comparison.criterion_a}-${comparison.criterion_b}`}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography gutterBottom>
                          How much more important is <strong>{criterionA?.name}</strong> compared to <strong>{criterionB?.name}</strong>?
                        </Typography>
                        <ComparisonSlider
                          value={comparison.value}
                          onChange={(e, newValue) => handleComparisonChange(index, newValue)}
                          min={1/9}
                          max={9}
                          step={1}
                          marks={[
                            { value: 1/9, label: '1/9' },
                            { value: 1/3, label: '1/3' },
                            { value: 1, label: '1' },
                            { value: 3, label: '3' },
                            { value: 9, label: '9' },
                          ]}
                          valueLabelDisplay="auto"
                          scale={(x) => x}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption">{criterionB?.name} more important</Typography>
                          <Typography variant="caption">Equal importance</Typography>
                          <Typography variant="caption">{criterionA?.name} more important</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitComparisons}
                >
                  Calculate Weights
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        )}
        
        {/* Step 4: Evaluate Results */}
        {activeStep === 3 && (
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evaluation Results
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on your criteria weights and location scores, here are the recommended locations:
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={handleEvaluate}
                sx={{ mb: 2 }}
              >
                Evaluate Locations
              </Button>
              
              {results.length > 0 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell align="right">Total Score</TableCell>
                        {criteria.map(criterion => (
                          <TableCell key={criterion._id} align="right">{criterion.name} Score</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={result.location_id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{result.location_name}</TableCell>
                          <TableCell align="right">{result.total_score.toFixed(2)}</TableCell>
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
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setActiveStep(0);
                    showSnackbar('You can start a new evaluation');
                  }}
                >
                  Start New Evaluation
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        )}
        
        {/* Add Criterion Dialog */}
        <Dialog open={openAddCriterionDialog} onClose={() => setOpenAddCriterionDialog(false)}>
          <DialogTitle>Add New Criterion</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Criterion Name"
              fullWidth
              value={newCriterion.name}
              onChange={(e) => setNewCriterion({...newCriterion, name: e.target.value})}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newCriterion.description}
              onChange={(e) => setNewCriterion({...newCriterion, description: e.target.value})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddCriterionDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCriterion} disabled={!newCriterion.name}>Add</Button>
          </DialogActions>
        </Dialog>
        
        {/* Add Location Dialog */}
        <Dialog open={openAddLocationDialog} onClose={() => setOpenAddLocationDialog(false)}>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Location Name"
              fullWidth
              value={newLocation.name}
              onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              value={newLocation.address}
              onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
            />
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Criteria Scores (0-10)
            </Typography>
            {criteria.map(criterion => (
              <Box key={criterion._id} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ width: 150 }}>{criterion.name}</Typography>
                <Slider
                  value={newLocation.scores[criterion._id] || 0}
                  onChange={(e, newValue) => {
                    setNewLocation({
                      ...newLocation,
                      scores: {
                        ...newLocation.scores,
                        [criterion._id]: newValue
                      }
                    });
                  }}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1, ml: 2 }}
                />
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddLocationDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLocation} disabled={!newLocation.name}>Add</Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert 
            onClose={() => setOpenSnackbar(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Home;