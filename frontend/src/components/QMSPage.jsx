import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import './QMSPage.css';

// Animation component that uses the JSON data
const AnimationDisplay = () => {
  const [animationData, setAnimationData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Load the JSON animation data
    fetch('/selection list clients.json')
      .then(response => response.json())
      .then(data => {
        setAnimationData(data);
      })
      .catch(error => {
        console.error('Error loading animation data:', error);
      });
  }, []);

  useEffect(() => {
    if (animationData) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % (animationData.op || 137));
      }, 1000 / (animationData.fr || 30)); // Use frame rate from JSON

      return () => clearInterval(interval);
    }
  }, [animationData]);

  if (!animationData) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white'
      }}>
        Loading animation...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated elements based on the JSON data */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Circle animation */}
        <div style={{
          width: '150px',
          height: '150px',
          border: '3px solid #f5a623',
          borderRadius: '50%',
          borderTop: '3px solid transparent',
          animation: 'spin 2s linear infinite',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {Math.floor((currentFrame / (animationData.op || 137)) * 100)}%
          </div>
        </div>
      </div>
      
      {/* Animation info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '12px',
        opacity: '0.8'
      }}>
        Frame: {currentFrame} / {animationData.op || 137}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const QMSPage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    project_id: '',
    domain_id: '',
    project_phase: '',
    block_name: ''
  });
  const [activeTab, setActiveTab] = useState('checklists'); // Only 'checklists' now
  const [showHandoffOptions, setShowHandoffOptions] = useState(false);
  const [showSignoffOptions, setShowSignoffOptions] = useState(false);
  const [currentView, setCurrentView] = useState('qms'); // 'qms' or 'synqms'
  const [animationData, setAnimationData] = useState(null);

  const token = localStorage.getItem('token');

  // Project phases options
  const projectPhases = [
    { id: 'silver', name: 'Silver' },
    { id: 'bronze', name: 'Bronze' },
    { id: 'gold', name: 'Gold' }
  ];

  // Block options
  const blocks = [
    { id: 'block1', name: 'Block 1' },
    { id: 'block2', name: 'Block 2' },
    { id: 'block3', name: 'Block 3' }
  ];

  // Handoff checklist options
  const handoffOptions = [
    { id: 'syn-qms', name: 'SYN QMS', path: '/handoff/syn-qms' },
    { id: 'dft-qms', name: 'DFT QMS', path: '/handoff/dft-qms' },
    { id: 'pnr-qms', name: 'PNR QMS', path: '/handoff/pnr-qms' }
  ];

  // Signoff checklist options
  const signoffOptions = [
    { id: 'sta-signoff', name: 'STA signoff QMS', path: '/signoff/sta-signoff' },
    { id: 'pv-signoff', name: 'PV signoff QMS', path: '/signoff/pv-signoff' },
    { id: 'em-ir-signoff', name: 'EM & IR signoff QMS', path: '/signoff/em-ir-signoff' },
    { id: 'lec-signoff', name: 'LEC signoff checklist', path: '/signoff/lec-signoff' },
    { id: 'clp-signoff', name: 'CLP Signoff checklist (applicable to low power designs)', path: '/signoff/clp-signoff' }
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/data/filter-options', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }

        const data = await response.json();
        
        // Map the API response fields to the expected format
        setProjects(data.projects || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  // Fetch domains when project changes
  useEffect(() => {
    const fetchDomains = async () => {
      if (!selectedFilters.project_id) {
        setDomains([]);
        return;
      }

      try {
        const response = await fetch(`/api/data/filter-options?project_id=${selectedFilters.project_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch domains');
        }

        const data = await response.json();
        setDomains(data.domains || []);
      } catch (err) {
        console.error('Error fetching domains:', err);
        setError(err.message);
      }
    };

    fetchDomains();
  }, [selectedFilters.project_id, token]);

  // Load animation data
  useEffect(() => {
    const loadAnimationData = async () => {
      try {
        // Use the renamed filename without spaces
        const response = await fetch('/selection-list-clients.json');
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
          console.log('Animation data loaded successfully');
        } else {
          console.error('Failed to load animation data:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading animation data:', error);
      }
    };

    loadAnimationData();
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...selectedFilters };
    if (filterType === 'project_id') {
      newFilters.project_id = value;
      newFilters.domain_id = '';
      newFilters.project_phase = '';
      newFilters.block_name = '';
    } else if (filterType === 'domain_id') {
      newFilters.domain_id = value;
      newFilters.project_phase = '';
      newFilters.block_name = '';
    } else if (filterType === 'project_phase') {
      newFilters.project_phase = value;
      newFilters.block_name = '';
    } else if (filterType === 'block_name') {
      newFilters.block_name = value;
    }
    setSelectedFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedFilters({
      project_id: '',
      domain_id: '',
      project_phase: '',
      block_name: ''
    });
  };

  const hasSelectedFilters = selectedFilters.project_id || selectedFilters.domain_id || selectedFilters.project_phase || selectedFilters.block_name;
  const allFiltersSelected = selectedFilters.project_id && selectedFilters.domain_id && selectedFilters.project_phase && selectedFilters.block_name;

  const handleHandoffClick = () => {
    setShowHandoffOptions(!showHandoffOptions);
    setShowSignoffOptions(false);
  };

  const handleSignoffClick = () => {
    setShowSignoffOptions(!showSignoffOptions);
    setShowHandoffOptions(false);
  };

  const handleChecklistClick = (type, option) => {
    console.log(`Navigating to ${type} checklist: ${option.name}`);
    
    // Handle navigation to specific checklist pages
    if (option.id === 'syn-qms') {
      setCurrentView('synqms');
    } else {
      // For other checklists, show alert for now
      alert(`${option.name} checklist will be implemented soon!`);
    }
  };

  const handleBackToQMS = () => {
    setCurrentView('qms');
  };

  if (loading) {
    return (
      <div className="qms-loading">
        <div className="loading-spinner"></div>
        <p>Loading QMS data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qms-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  // If we're viewing SYN QMS, render that component
  if (currentView === 'synqms') {
    const SYNQMS = require('./SYNQMS').default;
    return (
      <div className="synqms-wrapper">
        <button 
          onClick={handleBackToQMS}
          className="back-btn"
          style={{
            margin: '20px 24px',
            padding: '12px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          ← Back to QMS
        </button>
        <SYNQMS />
      </div>
    );
  }

  return (
    <div className="qms-container">
      <div className={`qms-filters ${hasSelectedFilters ? 'compact' : ''}`}>
        <h2>Filters</h2>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="project-select">Project</label>
            <select
              id="project-select"
              className="filter-select"
              value={selectedFilters.project_id}
              onChange={(e) => handleFilterChange('project_id', e.target.value)}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="domain-select">Domain</label>
            <select
              id="domain-select"
              className="filter-select"
              value={selectedFilters.domain_id}
              onChange={(e) => handleFilterChange('domain_id', e.target.value)}
              disabled={!selectedFilters.project_id}
            >
              <option value="">Select Domain</option>
              {selectedFilters.project_id && domains.length > 0 ? (
                domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.full_name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {!selectedFilters.project_id ? 'Select a project first' : 'No domains available for this project'}
                </option>
              )}
            </select>
          </div>

          {selectedFilters.domain_id && (
            <div className="filter-group">
              <label htmlFor="phase-select">Project Phase</label>
              <select
                id="phase-select"
                className="filter-select"
                value={selectedFilters.project_phase}
                onChange={(e) => handleFilterChange('project_phase', e.target.value)}
              >
                <option value="">Select Phase</option>
                {projectPhases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedFilters.project_phase && (
            <div className="filter-group">
              <label htmlFor="block-select">Block</label>
              <select
                id="block-select"
                className="filter-select"
                value={selectedFilters.block_name}
                onChange={(e) => handleFilterChange('block_name', e.target.value)}
              >
                <option value="">Select Block</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={!hasSelectedFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {allFiltersSelected ? (
        <div className="qms-content">
          <div className="qms-data">
            <h2>Quality Management System</h2>
            <div className="checklist-container">
              <div className="checklist-section">
                <button 
                  className="checklist-btn handoff-btn"
                  onClick={handleHandoffClick}
                >
                  <div className="checklist-btn-content">
                    <div className="checklist-icon">📋</div>
                    <div className="checklist-text">
                      <h3>Handoff Checklists</h3>
                      <p>Required stages for project handoffs</p>
                    </div>
                  </div>
                </button>
                {showHandoffOptions && (
                  <div className="checklist-options">
                    {handoffOptions.map((option) => (
                      <button
                        key={option.id}
                        className="checklist-option"
                        onClick={() => handleChecklistClick('handoff', option)}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="checklist-section">
                <button 
                  className="checklist-btn signoff-btn"
                  onClick={handleSignoffClick}
                >
                  <div className="checklist-btn-content">
                    <div className="checklist-icon">✅</div>
                    <div className="checklist-text">
                      <h3>Signoff Checklists</h3>
                      <p>Final verification and approval processes</p>
                    </div>
                  </div>
                </button>
                {showSignoffOptions && (
                  <div className="checklist-options">
                    {signoffOptions.map((option) => (
                      <button
                        key={option.id}
                        className="checklist-option"
                        onClick={() => handleChecklistClick('signoff', option)}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="qms-placeholder">
          <div className="floating-particle-1"></div>
          <div className="floating-particle-2"></div>
          <div className="placeholder-content">
                         {animationData ? (
               <div 
                 style={{
                   maxWidth: '95%',
                   width: '800px',
                   height: '600px',
                   margin: '20px auto',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   overflow: 'hidden'
                 }}
               >
                 <Lottie 
                   animationData={animationData}
                   loop={true}
                   autoplay={true}
                   style={{
                     width: '100%',
                     height: '100%'
                   }}
                 />
               </div>
             ) : (
              <div 
                style={{
                  maxWidth: '80%',
                  width: '600px',
                  height: '400px',
                  margin: '20px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333',
                  fontSize: '18px',
                  fontWeight: '500',
                  textAlign: 'center',
                  padding: '40px'
                }}
              >
                                 <div>
                   <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>
                     Loading Animation...
                   </h3>
                   <p style={{ marginBottom: '15px' }}>
                     Please wait while the animation loads
                   </p>
                   <button 
                     onClick={() => {
                                               const loadAnimationData = async () => {
                          try {
                            const response = await fetch('/selection-list-clients.json');
                            // console.log('Response status:', response.status);
                            if (response.ok) {
                              const data = await response.json();
                              setAnimationData(data);
                              // console.log('Animation data loaded successfully');
                            } else {
                              // console.error('Failed to load animation data:', response.status, response.statusText);
                            }
                          } catch (error) {
                            // console.error('Error loading animation data:', error);
                          }
                        };
                       loadAnimationData();
                     }}
                     style={{
                       padding: '10px 20px',
                       background: '#3b82f6',
                       color: 'white',
                       border: 'none',
                       borderRadius: '5px',
                       cursor: 'pointer',
                       marginTop: '10px'
                     }}
                   >
                     Retry Load Animation
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QMSPage; 