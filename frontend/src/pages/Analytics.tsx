import React, { useState, useEffect } from 'react';
import { 
    Container, Row, Col, Card, Alert, Button, Spinner, 
    Table, Badge, Form, Tabs, Tab 
} from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    getSummary, getAnomalies, getLatestData, predictAnomaly,
    getAnalysisStatus, getAvailableModels, performAdvancedAnalysis,
    getAnalysisResults, getAvailablePlots, getPlotUrl
} from '../services/apiService';
import { 
    ProductionSummary, AnomalyData, TimeSeriesItem, ProductionData,
    AnalysisApiStatus, ModelList, ModelInfo, AdvancedAnomalyResult,
    AnalysisResults, PlotInfo
} from '../services/types';

const Analytics: React.FC = () => {
    // Basic analytics state
    const [summary, setSummary] = useState<ProductionSummary | null>(null);
    const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Advanced analytics state
    const [apiStatus, setApiStatus] = useState<AnalysisApiStatus | null>(null);
    const [modelList, setModelList] = useState<ModelList | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('basic');
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [plots, setPlots] = useState<PlotInfo[]>([]);
    const [advancedAnalysisResult, setAdvancedAnalysisResult] = useState<AdvancedAnomalyResult | null>(null);
    const [advancedLoading, setAdvancedLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('basic');

    // Fetch basic analytics data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryData, anomalyData, latestData] = await Promise.all([
                    getSummary(),
                    getAnomalies(),
                    getLatestData()
                ]);
                setSummary(summaryData);
                setAnomalies(anomalyData.anomalies);
                setTimeSeriesData(latestData.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load analytics data. Please try again later.');
                setLoading(false);
                console.error('Error fetching analytics data:', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch advanced analytics data
    useEffect(() => {
        const fetchAdvancedData = async () => {
            try {
                const status = await getAnalysisStatus();
                setApiStatus(status);
                
                if (status.advanced_analysis_available) {
                    const models = await getAvailableModels();
                    setModelList(models);
                    
                    // Set default model
                    setSelectedModel(models.default_model);
                    
                    // Get available plots
                    const plotsData = await getAvailablePlots();
                    setPlots(plotsData.plots);
                    
                    // Get results for the default model
                    const results = await getAnalysisResults(models.default_model);
                    setAnalysisResults(results);
                }
            } catch (err) {
                console.error('Error fetching advanced analytics data:', err);
            }
        };
        
        fetchAdvancedData();
    }, []);
    
    // Handle model change
    const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const model = event.target.value;
        setSelectedModel(model);
        
        try {
            setAdvancedLoading(true);
            const results = await getAnalysisResults(model);
            setAnalysisResults(results);
            setAdvancedLoading(false);
        } catch (err) {
            console.error('Error fetching results for model:', err);
            setAdvancedLoading(false);
        }
    };
    
    // Generate test sample for advanced analysis
    const generateRandomSample = (): ProductionData => {
        // Generate a production data sample with reasonable values
        return {
            temperature: Math.random() * 30 + 40, // 40-70°C
            pressure: Math.random() * 50 + 80,    // 80-130 PSI
            speed: Math.random() * 40 + 50,       // 50-90 RPM
            vibration: Math.random() * 15 + 15,   // 15-30 units
            timestamp: new Date().toISOString()
        };
    };
    
    // Run advanced analysis
    const runAdvancedAnalysis = async () => {
        const sample = generateRandomSample();
        
        try {
            setAdvancedLoading(true);
            const result = await performAdvancedAnalysis(sample, selectedModel);
            setAdvancedAnalysisResult(result);
            setAdvancedLoading(false);
        } catch (err) {
            console.error('Error performing advanced analysis:', err);
            setAdvancedLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4">
            <h2>Production Line Analytics</h2>
            
            <Tabs 
                activeKey={activeTab} 
                onSelect={(k) => setActiveTab(k || 'basic')}
                className="mb-4"
            >
                <Tab eventKey="basic" title="Basic Analytics">
                    <Row className="mt-4">
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header>Production Summary</Card.Header>
                                <Card.Body>
                                    {summary && (
                                        <Table striped bordered hover>
                                            <tbody>
                                                <tr>
                                                    <td>Total Readings</td>
                                                    <td>{summary.total_readings}</td>
                                                </tr>
                                                <tr>
                                                    <td>Anomalies Detected</td>
                                                    <td>
                                                        <Badge bg={summary && summary.anomaly_percentage > 5 ? "danger" : "warning"}>
                                                            {summary?.anomalies_detected || 0} ({summary?.anomaly_percentage?.toFixed(2) || '0.00'}%)
                                                        </Badge>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Average Temperature</td>
                                                    <td>{summary?.avg_temperature?.toFixed(2) || '0.00'} °C</td>
                                                </tr>
                                                <tr>
                                                    <td>Average Pressure</td>
                                                    <td>{summary?.avg_pressure?.toFixed(2) || '0.00'} PSI</td>
                                                </tr>
                                                <tr>
                                                    <td>Average Speed</td>
                                                    <td>{summary?.avg_speed?.toFixed(2) || '0.00'} RPM</td>
                                                </tr>
                                                <tr>
                                                    <td>Average Vibration</td>
                                                    <td>{summary?.avg_vibration?.toFixed(2) || '0.00'}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                            
                            <Card>
                                <Card.Header>Recent Anomalies</Card.Header>
                                <Card.Body>
                                    {anomalies.length === 0 ? (
                                        <Alert variant="success">No anomalies detected recently.</Alert>
                                    ) : (
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Timestamp</th>
                                                    <th>Score</th>
                                                    <th>Temp</th>
                                                    <th>Press</th>
                                                    <th>Speed</th>
                                                    <th>Vibr</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anomalies && anomalies.map((anomaly, index) => (
                                                    <tr key={index}>
                                                        <td>{anomaly?.timestamp ? new Date(anomaly.timestamp).toLocaleString() : 'N/A'}</td>
                                                        <td>
                                                            <Badge bg={anomaly?.anomaly_score && anomaly.anomaly_score < -0.2 ? "danger" : "warning"}>
                                                                {anomaly?.anomaly_score?.toFixed(2) || 'N/A'}
                                                            </Badge>
                                                        </td>
                                                        <td>{anomaly?.temperature?.toFixed(1) || 'N/A'}</td>
                                                        <td>{anomaly?.pressure?.toFixed(1) || 'N/A'}</td>
                                                        <td>{anomaly?.speed?.toFixed(1) || 'N/A'}</td>
                                                        <td>{anomaly?.vibration?.toFixed(1) || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header>Time Series Data</Card.Header>
                                <Card.Body>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart
                                            data={timeSeriesData || []}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="timestamp" 
                                                tickFormatter={(value) => {
                                                    if (!value) return '';
                                                    const date = new Date(value);
                                                    return `${date.getHours()}:${date.getMinutes()}`;
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip 
                                                labelFormatter={(value) => value ? new Date(value).toLocaleString() : ''}
                                                formatter={(value: number) => [value?.toFixed(2) || '0.00', '']}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
                                            <Line type="monotone" dataKey="pressure" stroke="#82ca9d" />
                                            <Line type="monotone" dataKey="speed" stroke="#ffc658" />
                                            <Line type="monotone" dataKey="vibration" stroke="#ff8042" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card.Body>
                            </Card>
                            
                            <Card>
                                <Card.Header>Anomaly Scores</Card.Header>
                                <Card.Body>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart
                                            data={timeSeriesData || []}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="timestamp" 
                                                tickFormatter={(value) => {
                                                    if (!value) return '';
                                                    const date = new Date(value);
                                                    return `${date.getHours()}:${date.getMinutes()}`;
                                                }}
                                            />
                                            <YAxis domain={[-0.5, 0.1]} />
                                            <Tooltip 
                                                labelFormatter={(value) => value ? new Date(value).toLocaleString() : ''}
                                                formatter={(value: number) => [value?.toFixed(4) || '0.0000', 'Anomaly Score']}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="anomaly_score" stroke="#ff0000" dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
                
                <Tab eventKey="advanced" title="Advanced Analytics">
                    <Row className="mt-4">
                        <Col md={12}>
                            <Card className="mb-4">
                                <Card.Header>Advanced Analysis Status</Card.Header>
                                <Card.Body>
                                    {!apiStatus ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <>
                                            <Alert variant={apiStatus.advanced_analysis_available ? "success" : "warning"}>
                                                {apiStatus.advanced_analysis_available 
                                                    ? "Advanced analysis is available" 
                                                    : "Advanced analysis is not available"}
                                            </Alert>
                                            
                                            {apiStatus.advanced_analysis_available && (
                                                <div>
                                                    <p>Available models: {apiStatus.advanced_models.join(', ')}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {apiStatus?.advanced_analysis_available && (
                        <>
                            <Row>
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Header>Model Selection</Card.Header>
                                        <Card.Body>
                                            {modelList && modelList.models && (
                                                <Form.Group>
                                                    <Form.Label>Select a Model</Form.Label>
                                                    <Form.Select 
                                                        value={selectedModel}
                                                        onChange={handleModelChange}
                                                    >
                                                        {Object.entries(modelList.models).map(([key, model]) => (
                                                            <option key={key} value={key}>{model?.name || key}</option>
                                                        ))}
                                                    </Form.Select>
                                                    
                                                    {modelList && modelList.models && modelList.models[selectedModel] && (
                                                        <div className="mt-3">
                                                            <h6>Model Description</h6>
                                                            <p>{modelList.models[selectedModel]?.description || 'No description available'}</p>
                                                            <h6>Features Used</h6>
                                                            <ul>
                                                                {modelList.models[selectedModel]?.features?.map((feature, index) => (
                                                                    <li key={index}>{feature}</li>
                                                                )) || <li>No features information available</li>}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    <Button 
                                                        variant="primary" 
                                                        className="mt-3"
                                                        onClick={runAdvancedAnalysis}
                                                        disabled={advancedLoading}
                                                    >
                                                        {advancedLoading ? (
                                                            <>
                                                                <Spinner
                                                                    as="span"
                                                                    animation="border"
                                                                    size="sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                />
                                                                {' '}Running...
                                                            </>
                                                        ) : 'Run Analysis'}
                                                    </Button>
                                                </Form.Group>
                                            )}
                                        </Card.Body>
                                    </Card>
                                    
                                    {advancedAnalysisResult && (
                                        <Card className="mb-4">
                                            <Card.Header>Analysis Result</Card.Header>
                                            <Card.Body>
                                                <Alert 
                                                    variant={advancedAnalysisResult?.is_anomaly ? "danger" : "success"}
                                                >
                                                    {advancedAnalysisResult?.is_anomaly 
                                                        ? "Anomaly Detected!" 
                                                        : "No Anomaly Detected"}
                                                </Alert>
                                                
                                                <Table striped bordered hover>
                                                    <tbody>
                                                        <tr>
                                                            <td>Model</td>
                                                            <td>{advancedAnalysisResult?.model || 'Unknown'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Anomaly Score</td>
                                                            <td>{advancedAnalysisResult?.anomaly_score?.toFixed(4) || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Recommendation</td>
                                                            <td>{advancedAnalysisResult?.recommendation || 'No recommendation available'}</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>
                                
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Header>Available Plots</Card.Header>
                                        <Card.Body>
                                            {plots.length === 0 ? (
                                                <Alert variant="info">No plots available</Alert>
                                            ) : (
                                                <Row>
                                                    {plots.map((plot, index) => (
                                                        <Col md={6} key={index} className="mb-3">
                                                            <Card>
                                                                <Card.Img 
                                                                    variant="top" 
                                                                    src={getPlotUrl(plot.name)}
                                                                    alt={plot.description}
                                                                />
                                                                <Card.Body>
                                                                    <Card.Title>{plot.description}</Card.Title>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            
                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>Analysis Results</Card.Header>
                                        <Card.Body>
                                            {advancedLoading ? (
                                                <div className="text-center">
                                                    <Spinner animation="border" />
                                                </div>
                                            ) : !analysisResults ? (
                                                <Alert variant="info">No analysis results available</Alert>
                                            ) : (
                                                <>
                                                    <h5>Model: {analysisResults.model}</h5>
                                                    
                                                    {analysisResults.metrics && (
                                                        <div className="mb-4">
                                                            <h6>Performance Metrics</h6>
                                                            <Table striped bordered hover size="sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Metric</th>
                                                                        <th>Value</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>Precision</td>
                                                                        <td>{analysisResults.metrics.precision.toFixed(4)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>Recall</td>
                                                                        <td>{analysisResults.metrics.recall.toFixed(4)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>F1 Score</td>
                                                                        <td>{analysisResults.metrics.f1.toFixed(4)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>True Positives</td>
                                                                        <td>{analysisResults.metrics.true_positives}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>False Positives</td>
                                                                        <td>{analysisResults.metrics.false_positives}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                    
                                                    <h6>Sample Results ({analysisResults.results.length} of {analysisResults.total_records} records shown)</h6>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <Table striped bordered hover responsive size="sm">
                                                            <thead>
                                                                <tr>
                                                                    {Object.keys(analysisResults.results[0]?.values || {}).map((key) => (
                                                                        <th key={key}>{key}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {analysisResults.results.map((item, index) => (
                                                                    <tr key={index}>
                                                                        {Object.entries(item.values).map(([key, value]) => (
                                                                            <td key={key}>
                                                                                {typeof value === 'number' 
                                                                                    ? Number(value).toFixed(4) 
                                                                                    : String(value)
                                                                                }
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default Analytics; 