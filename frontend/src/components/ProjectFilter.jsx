import React, { useState, useEffect } from 'react';
import './ProjectFilter.css';

const ProjectFilter = ({ onFilterChange, selectedFilters, activeView, onViewChange, isCustomer, getTabViews }) => {
  const [projects, setProjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clickedButton, setClickedButton] = useState(null);
  const [viewSelected, setViewSelected] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedFilters.project_id) {
      fetchDomains(selectedFilters.project_id);
    } else {
      setDomains([]);
    }
  }, [selectedFilters.project_id]);

  // Track when a view is selected
  useEffect(() => {
    setViewSelected(activeView !== null && activeView !== 'admin');
  }, [activeView]);

  // Ensure main filter page is shown when Dashboard is selected
  useEffect(() => {
    if (activeView === null || activeView === 'dashboard') {
      setViewSelected(false);
    }
  }, [activeView]);

  const fetchProjects = async () => {
    try {
      // Determine data type based on active view
      let dataType = 'pd'; // default to PD data
      if (activeView && activeView.includes('dv')) {
        dataType = 'dv';
      } else if (activeView && activeView.includes('cl')) {
        dataType = 'cl';
      }
      
      const response = await fetch(`http://localhost:5000/api/data/filter-options?data_type=${dataType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async (projectId) => {
    try {
      // Determine data type based on active view
      let dataType = 'pd'; // default to PD data
      if (activeView && activeView.includes('dv')) {
        dataType = 'dv';
      } else if (activeView && activeView.includes('cl')) {
        dataType = 'cl';
      }
      
      const response = await fetch(`http://localhost:5000/api/data/filter-options?project_id=${projectId}&data_type=${dataType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch domains');
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...selectedFilters };
    if (filterType === 'project_id') {
      newFilters.project_id = value;
      newFilters.domain_id = '';
    } else if (filterType === 'domain_id') {
      newFilters.domain_id = value;
    }
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({
      project_id: '',
      domain_id: ''
    });
  };

  const handleViewChange = (viewId) => {
    setClickedButton(viewId);
    onViewChange(viewId);
    
    // Reset the clicked state after animation
    setTimeout(() => {
      setClickedButton(null);
    }, 300);
  };

  const getProjectTypeIcon = (projectName) => {
    if (projectName?.toLowerCase().includes('dv')) return '📊';
    if (projectName?.toLowerCase().includes('cl')) return '⚙️';
    return '📋';
  };

  const getDomainTypeIcon = (domainName) => {
    if (domainName?.toLowerCase().includes('dv')) return '📈';
    if (domainName?.toLowerCase().includes('cl')) return '🔧';
    return '📁';
  };

  if (loading) {
    return (
      <div className="project-filter-loading">
        <div className="loading-spinner"></div>
        <p>Loading filter options...</p>
      </div>
    );
  }

  return (
    <div className={`project-filter-container ${selectedFilters.project_id || selectedFilters.domain_id ? 'filters-active' : ''} ${viewSelected ? 'view-selected' : ''}`}>
      {viewSelected ? (
        // Show compact view button when a view is selected
        <div className="view-button-container">
          <div className="view-button-info">
            <div className="view-button-main">
              <span className="view-button-icon">
                {getProjectTypeIcon(projects.find(p => p.id === parseInt(selectedFilters.project_id))?.project_name)}
              </span>
              <span className="view-button-project">
                {projects.find(p => p.id === parseInt(selectedFilters.project_id))?.project_name || 'Project'}
              </span>
            </div>
            {selectedFilters.domain_id && (
              <div className="view-button-sub">
                <span className="view-button-domain-icon">
                  {getDomainTypeIcon(domains.find(d => d.id === parseInt(selectedFilters.domain_id))?.full_name)}
                </span>
                <span className="view-button-domain">
                  {domains.find(d => d.id === parseInt(selectedFilters.domain_id))?.full_name || 'Domain'}
                </span>
              </div>
            )}
          </div>
          <div className="view-button-actions">
            <button
              className="view-button-change"
              onClick={() => setViewSelected(false)}
            >
              <span className="action-icon">⚙️</span>
              Change Filters
            </button>
            <button
              className="view-button-clear"
              onClick={clearFilters}
            >
              <span className="action-icon">🗑️</span>
              Clear
            </button>
          </div>
        </div>
      ) : (
        // Show full filter controls when no view is selected
        <>
          <div className="filter-controls">
            {/* Always show project dropdown */}
            <div className="filter-group">
              <label htmlFor="project-select">
                <span className="label-icon">📋</span>
                Project:
              </label>
              <select
                id="project-select"
                value={selectedFilters.project_id || ''}
                onChange={(e) => handleFilterChange('project_id', e.target.value)}
                className="filter-select"
              >
                <option value="" disabled>Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {getProjectTypeIcon(project.project_name)} {project.project_name}
                  </option>
                ))}
              </select>
            </div>
            {selectedFilters.project_id && domains.length > 0 && (
              <div className="filter-group">
                <label htmlFor="domain-select">
                  <span className="label-icon">📁</span>
                  Domain:
                </label>
                <select
                  id="domain-select"
                  value={selectedFilters.domain_id || ''}
                  onChange={(e) => handleFilterChange('domain_id', e.target.value)}
                  className="filter-select"
                >
                  <option value="" disabled>Select Domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {getDomainTypeIcon(domain.full_name)} {domain.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={clearFilters}
              className="clear-filters-btn"
              disabled={!selectedFilters.project_id && !selectedFilters.domain_id}
            >
              <span className="clear-icon">🗑️</span>
              Clear Filters
            </button>
          </div>
          
          {/* View Navigation Tabs - Only show for non-customers when domain is selected */}
          {!isCustomer && getTabViews().length > 0 && (
            <div className="view-nav">
              <div className="view-nav-header">
                <span className="view-nav-title">
                  <span className="view-nav-title-icon">👁️</span>
                  Available Views
                </span>
              </div>
              <div className="view-nav-buttons">
                {getTabViews().map(view => (
                  <button
                    key={view.id}
                    className={`view-nav-btn${activeView === view.id ? ' active' : ''}${clickedButton === view.id ? ' clicked' : ''}`}
                    onClick={() => handleViewChange(view.id)}
                  >
                    <span className="view-nav-icon">{view.icon}</span>
                    <span className="view-nav-label">{view.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {error && (
        <div className="filter-error">
          <span className="error-icon">⚠️</span>
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectFilter; 