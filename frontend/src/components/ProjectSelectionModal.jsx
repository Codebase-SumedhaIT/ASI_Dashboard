import React, { useState } from 'react';
import './ProjectSelectionModal.css';

const ProjectSelectionModal = ({ isOpen, onClose, projects, domains, onConfirm }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProject && selectedDomain) {
      onConfirm(selectedProject, selectedDomain);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-selection-modal-overlay">
      <div className="project-selection-modal">
        <div className="modal-header">
          <h3>Select Project and Domain</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="selection-form">
          <div className="form-group">
            <label htmlFor="project">Project</label>
            <select
              id="project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="domain">Domain</label>
            <select
              id="domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              required
            >
              <option value="">Select a domain</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  {domain.short_code} - {domain.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="confirm-btn" disabled={!selectedProject || !selectedDomain}>
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSelectionModal; 