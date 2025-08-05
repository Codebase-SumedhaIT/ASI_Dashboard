import React, { useState, useEffect } from 'react';
import './ProjectManagement.css';
import ProjectSelectionModal from './ProjectSelectionModal';
import DVPlannedWorkForm from './DVPlannedWorkForm';

const ProjectManagement = () => {
  const [domains, setDomains] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [domainFormData, setDomainFormData] = useState({
    short_code: '',
    full_name: '',
    description: ''
  });
  const [projectFormData, setProjectFormData] = useState({
    project_name: '',
    description: '',
    status: 'active',
    start_date: ''
  });
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showDVPlannedWork, setShowDVPlannedWork] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDomains();
    fetchProjects();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/domains', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }

      const data = await response.json();
      setDomains(data.domains);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message);
    }
  };

  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingDomain 
        ? `http://localhost:5000/api/admin/domains/${editingDomain.id}`
        : 'http://localhost:5000/api/admin/domains';
      
      const method = editingDomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(domainFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      await fetchDomains();
      resetDomainForm();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingProject 
        ? `http://localhost:5000/api/admin/projects/${editingProject.id}`
        : 'http://localhost:5000/api/admin/projects';
      
      const method = editingProject ? 'PUT' : 'POST';

      // Remove domain_id and selectedDomainIds from body
      const { project_name, description, status, start_date } = projectFormData;
      const body = { project_name, description, status, start_date };
      // No domain_ids sent

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      await fetchProjects();
      resetProjectForm();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDomainForm = () => {
    setDomainFormData({
      short_code: '',
      full_name: '',
      description: ''
    });
    setEditingDomain(null);
    setShowDomainForm(false);
  };

  const resetProjectForm = () => {
    setProjectFormData({
      project_name: '',
      description: '',
      status: 'active',
      start_date: ''
    });
    setEditingProject(null);
    setShowProjectForm(false);
  };

  const handleEditDomain = (domain) => {
    setEditingDomain(domain);
    setDomainFormData({
      short_code: domain.short_code,
      full_name: domain.full_name,
      description: domain.description || ''
    });
    setShowDomainForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectFormData({
      project_name: project.project_name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date ? project.start_date.split('T')[0] : ''
    });
    setShowProjectForm(true);
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to delete this domain? This will also delete all associated projects.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/domains/${domainId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete domain');
      }

      await fetchDomains();
      await fetchProjects();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project');
      }

      // Show success message
      setError(''); // Clear any previous errors
      alert(data.message || 'Project deleted successfully');
      
      await fetchProjects();
    } catch (error) {
      setError(error.message);
    }
  };



  if (loading && domains.length === 0 && projects.length === 0) {
    return (
      <div className="project-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading project management...</p>
      </div>
    );
  }

  // If DV Planned Work is active, show only that
  if (showDVPlannedWork) {
    return (
      <DVPlannedWorkForm 
        isOpen={showDVPlannedWork}
        onClose={() => setShowDVPlannedWork(false)}
        selectedProject={selectedProject}
        selectedDomain={selectedDomain}
      />
    );
  }

  return (
    <div className="project-management">
      <div className="management-header">
        <h2>Project & Domain Management</h2>
        <div className="header-actions">
          <button 
            className="add-project-btn"
            onClick={() => {
              setEditingProject(null);
              setProjectFormData({
                project_name: '',
                description: '',
                status: 'active'
              });
              setShowProjectForm(true);
            }}
          >
            + Add Project
          </button>
          <button
            className="define-project-plan-btn"
            onClick={() => {
              if (projects.length === 0) {
                setError('Please create a project first');
                return;
              }
              if (domains.length === 0) {
                setError('Please create domains first');
                return;
              }
              setShowSelectionModal(true);
            }}
          >
            📋 Project Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Domain Form */}
      {showDomainForm && (
        <div className="form-overlay">
          <div className="form-card">
            <div className="form-header">
              <h3>{editingDomain ? 'Edit Domain' : 'Add New Domain'} <span role="img" aria-label="domain">🏷️</span></h3>
              <button className="close-btn" onClick={resetDomainForm} title="Close">×</button>
            </div>
            <form onSubmit={handleDomainSubmit} className="domain-form">
              <div className="form-group">
                <label htmlFor="short_code">Short Code</label>
                <input
                  type="text"
                  id="short_code"
                  name="short_code"
                  value={domainFormData.short_code}
                  onChange={(e) => setDomainFormData({...domainFormData, short_code: e.target.value})}
                  required
                  maxLength="10"
                  placeholder="e.g., PD, RTL, DV"
                />
              </div>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={domainFormData.full_name}
                  onChange={(e) => setDomainFormData({...domainFormData, full_name: e.target.value})}
                  required
                  placeholder="e.g., Physical Design"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={domainFormData.description}
                  onChange={(e) => setDomainFormData({...domainFormData, description: e.target.value})}
                  placeholder="Domain description..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetDomainForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingDomain ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Form */}
      {showProjectForm && (
        <div className="form-overlay">
          <div className="form-card">
            <div className="form-header">
              <h3>{editingProject ? 'Edit Project' : 'Add New Project'} <span role="img" aria-label="project">📁</span></h3>
              <button className="close-btn" onClick={resetProjectForm} title="Close">×</button>
            </div>
            <form onSubmit={handleProjectSubmit} className="project-form">
              <div className="form-group">
                <label htmlFor="project_name">Project Name</label>
                <input
                  type="text"
                  id="project_name"
                  name="project_name"
                  value={projectFormData.project_name}
                  onChange={(e) => setProjectFormData({...projectFormData, project_name: e.target.value})}
                  required
                  placeholder="e.g., Project Alpha"
                />
              </div>
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={projectFormData.start_date}
                  onChange={(e) => setProjectFormData({...projectFormData, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                  placeholder="Project description..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={projectFormData.status}
                  onChange={(e) => setProjectFormData({...projectFormData, status: e.target.value})}
                  required
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetProjectForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingProject ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      <div className="management-content">
        {/* Projects Section - Full Width */}
        <div className="projects-section full-width">
          <h3>Projects</h3>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <h4>No Projects Created</h4>
              <p>Create your first project to start organizing your data.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => {
                return (
                  <div key={project.id} className="project-card">
                    <div className="project-card-header">
                      <h4 className="project-name">{project.project_name}</h4>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-card-content">
                      <div className="project-info">
                        <div className="info-item">
                          <span className="info-label">Description:</span>
                          <span className="info-value">{project.description || 'No description'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Start Date:</span>
                          <span className="info-value">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created:</span>
                          <span className="info-value">{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="project-card-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditProject(project)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Domains Section - Full Width, Read-Only */}
        <div className="domains-section full-width">
          <h3>Domains</h3>
          {domains.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <h4>No Domains</h4>
            </div>
          ) : (
            <div className="domains-table">
              <table>
                <thead>
                  <tr>
                    <th>Short Code</th>
                    <th>Full Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map(domain => (
                    <tr key={domain.id}>
                      <td><span className="domain-code">{domain.short_code}</span></td>
                      <td>{domain.full_name}</td>
                      <td>{domain.description || '-'}</td>
                      <td>
                        <span className={`status-badge ${domain.is_active ? 'active' : 'inactive'}`}>
                          {domain.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Project Selection Modal */}
      {showSelectionModal && (
        <ProjectSelectionModal
          isOpen={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          projects={projects}
          domains={domains}
          onConfirm={(projectId, domainId) => {
            setSelectedProject(projectId);
            setSelectedDomain(domainId);
            setShowSelectionModal(false);
            setShowDVPlannedWork(true);
          }}
        />
      )}


    </div>
  );
};

export default ProjectManagement; 