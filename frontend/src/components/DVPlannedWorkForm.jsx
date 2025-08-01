import React, { useState, useEffect } from 'react';
import './DVPlannedWorkForm.css';

const DVPlannedWorkForm = ({ isOpen, onClose, selectedProject, selectedDomain }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [modules, setModules] = useState([]);
  const [testcases, setTestcases] = useState([]);
  const [assertions, setAssertions] = useState([]);
  const [coverpoints, setCoverpoints] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [users, setUsers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  // Filter states for overview
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('');
  const [selectedEngineerFilter, setSelectedEngineerFilter] = useState('');

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Form data states
  const [moduleForm, setModuleForm] = useState({
    module_name: '',
    module_engineer: ''
  });

  const [testcaseForm, setTestcaseForm] = useState({
    testcase_name: '',
    testcase_engineer: '',
    testcase_description: '',
    status: 'planned',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    planned_start_date: '',
    planned_end_date: ''
  });

  const [assertionForm, setAssertionForm] = useState({
    assertion_name: '',
    assertion_engineer: '',
    assertion_description: '',
    status: 'planned',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    planned_start_date: '',
    planned_end_date: ''
  });

  const [coverpointForm, setCoverpointForm] = useState({
    coverpoint_name: '',
    coverpoint_engineer: '',
    coverpoint_description: '',
    status: 'planned',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    planned_start_date: '',
    planned_end_date: ''
  });

  const [requirementForm, setRequirementForm] = useState({
    requirement_name: '',
    testcase_id: '',
    assertion_id: '',
    coverpoint_id: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    planned_start_date: '',
    planned_end_date: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchEngineers();
      fetchExistingData();
    }
  }, [isOpen, selectedProject, selectedDomain]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEngineers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/engineers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEngineers(data.engineers);
      }
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const fetchExistingData = async () => {
    if (!selectedProject || !selectedDomain) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Fetch modules for this project/domain
      const modulesResponse = await fetch(`http://localhost:5000/api/planned-work/modules/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!modulesResponse.ok) {
        console.error('Error fetching modules:', modulesResponse.status);
      } else {
        const modulesData = await modulesResponse.json();
        if (modulesData.success) {
          setModules(modulesData.modules);
        }
      }

      // Fetch testcases for this project/domain
      const testcasesResponse = await fetch(`http://localhost:5000/api/planned-work/testcases/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!testcasesResponse.ok) {
        console.error('Error fetching testcases:', testcasesResponse.status);
      } else {
        const testcasesData = await testcasesResponse.json();
        if (testcasesData.success) {
          setTestcases(testcasesData.testcases);
        }
      }

      // Fetch assertions for this project/domain
      const assertionsResponse = await fetch(`http://localhost:5000/api/planned-work/assertions/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!assertionsResponse.ok) {
        console.error('Error fetching assertions:', assertionsResponse.status);
      } else {
        const assertionsData = await assertionsResponse.json();
        if (assertionsData.success) {
          setAssertions(assertionsData.assertions);
        }
      }

      // Fetch coverpoints for this project/domain
      const coverpointsResponse = await fetch(`http://localhost:5000/api/planned-work/functional-coverage/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!coverpointsResponse.ok) {
        console.error('Error fetching coverpoints:', coverpointsResponse.status);
      } else {
        const coverpointsData = await coverpointsResponse.json();
        if (coverpointsData.success) {
          setCoverpoints(coverpointsData.functionalCoverage);
        }
      }

      // Fetch requirements for this project/domain
      const requirementsResponse = await fetch(`http://localhost:5000/api/planned-work/requirements/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!requirementsResponse.ok) {
        console.error('Error fetching requirements:', requirementsResponse.status);
      } else {
        const requirementsData = await requirementsResponse.json();
        if (requirementsData.success) {
          setRequirements(requirementsData.requirements);
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error('Cannot connect to backend server. Please ensure the server is running on localhost:5000');
      }
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ show: true, message: 'Please login again. Your session has expired.', type: 'error' });
        return;
      }

      const response = await fetch('http://localhost:5000/api/planned-work/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...moduleForm,
          project_id: selectedProject,
          domain_id: selectedDomain
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Server not found. Please check if the backend is running.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      if (data.success) {
        setModuleForm({ module_name: '', module_engineer: '' });
        fetchExistingData();
        setNotification({ show: true, message: '✅ Module created successfully!', type: 'success' });
      } else {
        setNotification({ show: true, message: '❌ Error creating module: ' + (data.message || 'Unknown error'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating module:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
      } else {
        setNotification({ show: true, message: '❌ Error creating module: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModuleDelete = async (moduleId) => {
    setConfirmModal({
      show: true,
      message: 'Are you sure you want to delete this module?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setNotification({ show: true, message: 'Please login again. Your session has expired.', type: 'error' });
            return;
          }

          const response = await fetch(`http://localhost:5000/api/planned-work/modules/${moduleId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Module not found or already deleted.');
            } else if (response.status === 500) {
              throw new Error('Server error. Please try again later.');
            } else if (response.status === 401) {
              throw new Error('Authentication failed. Please login again.');
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          }

          const data = await response.json();
          if (data.success) {
            fetchExistingData();
            setNotification({ show: true, message: '✅ Module deleted successfully!', type: 'success' });
          } else {
            setNotification({ show: true, message: '❌ Error deleting module: ' + (data.message || 'Unknown error'), type: 'error' });
          }
        } catch (error) {
          console.error('Error deleting module:', error);
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
          } else {
            setNotification({ show: true, message: '❌ Error deleting module: ' + error.message, type: 'error' });
          }
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleTestcaseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/testcases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...testcaseForm,
          project_id: selectedProject,
          domain_id: selectedDomain
        })
      });

      const data = await response.json();
      if (data.success) {
        setTestcaseForm({
          testcase_name: '',
          testcase_engineer: '',
          testcase_description: '',
          status: 'planned',
          priority: 'medium',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        setNotification({ show: true, message: '✅ Testcase created successfully!', type: 'success' });
      } else {
        setNotification({ show: true, message: '❌ Error creating testcase: ' + (data.message || 'Unknown error'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating testcase:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
      } else {
        setNotification({ show: true, message: '❌ Error creating testcase: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssertionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/assertions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...assertionForm,
          project_id: selectedProject,
          domain_id: selectedDomain
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssertionForm({
          assertion_name: '',
          assertion_engineer: '',
          assertion_description: '',
          status: 'planned',
          priority: 'medium',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        setNotification({ show: true, message: '✅ Assertion created successfully!', type: 'success' });
      } else {
        setNotification({ show: true, message: '❌ Error creating assertion: ' + (data.message || 'Unknown error'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating assertion:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
      } else {
        setNotification({ show: true, message: '❌ Error creating assertion: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCoverpointSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/functional-coverage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...coverpointForm,
          project_id: selectedProject,
          domain_id: selectedDomain
        })
      });

      const data = await response.json();
      if (data.success) {
        setCoverpointForm({
          coverpoint_name: '',
          coverpoint_engineer: '',
          coverpoint_description: '',
          status: 'planned',
          priority: 'medium',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        setNotification({ show: true, message: '✅ Coverpoint created successfully!', type: 'success' });
      } else {
        setNotification({ show: true, message: '❌ Error creating coverpoint: ' + (data.message || 'Unknown error'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating coverpoint:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
      } else {
        setNotification({ show: true, message: '❌ Error creating coverpoint: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requirementForm,
          project_id: selectedProject,
          domain_id: selectedDomain
        })
      });

      const data = await response.json();
      if (data.success) {
        setRequirementForm({
          requirement_name: '',
          testcase_id: '',
          assertion_id: '',
          coverpoint_id: '',
          description: '',
          status: 'planned',
          priority: 'medium',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        setNotification({ show: true, message: '✅ Requirement created successfully!', type: 'success' });
      } else {
        setNotification({ show: true, message: '❌ Error creating requirement: ' + (data.message || 'Unknown error'), type: 'error' });
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setNotification({ show: true, message: '❌ Cannot connect to server. Please check:\n1. Backend server is running\n2. Server is on localhost:5000\n3. No firewall blocking the connection', type: 'error' });
      } else {
        setNotification({ show: true, message: '❌ Error creating requirement: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[
        { step: 1, label: 'Modules', icon: '📦' },
        { step: 2, label: 'Test Cases', icon: '🧪' },
        { step: 3, label: 'Assertions', icon: '✅' },
        { step: 4, label: 'Coverpoints', icon: '📊' },
        { step: 5, label: 'Requirements', icon: '📋' },
        { step: 6, label: 'Overview', icon: '📋' }
      ].map(({ step, label, icon }) => (
        <div
          key={step}
          className={`step ${currentStep === step ? 'active' : ''}`}
          onClick={() => setCurrentStep(step)}
        >
          <span className="step-icon">{icon}</span>
          <span className="step-label">{label}</span>
        </div>
      ))}
    </div>
  );

  const renderModuleForm = () => (
    <div className="form-section">
      <h3>Create Module</h3>
      <form onSubmit={handleModuleSubmit}>
        <div className="form-group">
          <label>Module Name *</label>
          <input
            type="text"
            value={moduleForm.module_name}
            onChange={(e) => setModuleForm({...moduleForm, module_name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Module Engineer</label>
          <select
            value={moduleForm.module_engineer}
            onChange={(e) => setModuleForm({...moduleForm, module_engineer: e.target.value})}
          >
            <option value="">Select Engineer</option>
            {engineers.map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Module'}
          </button>
        </div>
      </form>
      
      <div className="existing-items">
        <h4>Existing Modules</h4>
        <div className="items-list">
          {modules.map(module => (
            <div key={module.id} className="item-card">
              <h5>{module.module_name}</h5>
              <p><strong>Engineer:</strong> {module.module_engineer}</p>
              <button className="delete-btn" onClick={() => handleModuleDelete(module.id)}>
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTestcaseForm = () => (
    <div className="form-section">
      <h3>Create Test Case</h3>
      <form onSubmit={handleTestcaseSubmit}>
        <div className="form-group">
          <label>Test Case Name *</label>
          <input
            type="text"
            value={testcaseForm.testcase_name}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Test Case Engineer</label>
          <select
            value={testcaseForm.testcase_engineer}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_engineer: e.target.value})}
          >
            <option value="">Select Engineer</option>
            {engineers.map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={testcaseForm.testcase_description}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_description: e.target.value})}
            rows="3"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={testcaseForm.status}
              onChange={(e) => setTestcaseForm({...testcaseForm, status: e.target.value})}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={testcaseForm.priority}
              onChange={(e) => setTestcaseForm({...testcaseForm, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              value={testcaseForm.estimated_hours}
              onChange={(e) => setTestcaseForm({...testcaseForm, estimated_hours: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned Start Date</label>
            <input
              type="date"
              value={testcaseForm.planned_start_date}
              onChange={(e) => setTestcaseForm({...testcaseForm, planned_start_date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned End Date</label>
            <input
              type="date"
              value={testcaseForm.planned_end_date}
              onChange={(e) => setTestcaseForm({...testcaseForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Test Case'}
          </button>
        </div>
      </form>
      
      <div className="existing-items">
        <h4>Existing Test Cases</h4>
        <div className="items-list">
          {testcases.map(testcase => (
            <div key={testcase.id} className="item-card">
              <h5>{testcase.testcase_name}</h5>
              <p><strong>Engineer:</strong> {testcase.testcase_engineer}</p>
              <p><strong>Status:</strong> {testcase.status}</p>
              <p><strong>Priority:</strong> {testcase.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssertionForm = () => (
    <div className="form-section">
      <h3>Create Assertion</h3>
      <form onSubmit={handleAssertionSubmit}>
        <div className="form-group">
          <label>Assertion Name *</label>
          <input
            type="text"
            value={assertionForm.assertion_name}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Assertion Engineer</label>
          <select
            value={assertionForm.assertion_engineer}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_engineer: e.target.value})}
          >
            <option value="">Select Engineer</option>
            {engineers.map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={assertionForm.assertion_description}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_description: e.target.value})}
            rows="3"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={assertionForm.status}
              onChange={(e) => setAssertionForm({...assertionForm, status: e.target.value})}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={assertionForm.priority}
              onChange={(e) => setAssertionForm({...assertionForm, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              value={assertionForm.estimated_hours}
              onChange={(e) => setAssertionForm({...assertionForm, estimated_hours: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned Start Date</label>
            <input
              type="date"
              value={assertionForm.planned_start_date}
              onChange={(e) => setAssertionForm({...assertionForm, planned_start_date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned End Date</label>
            <input
              type="date"
              value={assertionForm.planned_end_date}
              onChange={(e) => setAssertionForm({...assertionForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Assertion'}
          </button>
        </div>
      </form>
      
      <div className="existing-items">
        <h4>Existing Assertions</h4>
        <div className="items-list">
          {assertions.map(assertion => (
            <div key={assertion.id} className="item-card">
              <h5>{assertion.assertion_name}</h5>
              <p><strong>Engineer:</strong> {assertion.assertion_engineer}</p>
              <p><strong>Status:</strong> {assertion.status}</p>
              <p><strong>Priority:</strong> {assertion.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCoverpointForm = () => (
    <div className="form-section">
      <h3>Create Coverpoint</h3>
      <form onSubmit={handleCoverpointSubmit}>
        <div className="form-group">
          <label>Coverpoint Name *</label>
          <input
            type="text"
            value={coverpointForm.coverpoint_name}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Coverpoint Engineer</label>
          <select
            value={coverpointForm.coverpoint_engineer}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_engineer: e.target.value})}
          >
            <option value="">Select Engineer</option>
            {engineers.map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={coverpointForm.coverpoint_description}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_description: e.target.value})}
            rows="3"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={coverpointForm.status}
              onChange={(e) => setCoverpointForm({...coverpointForm, status: e.target.value})}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={coverpointForm.priority}
              onChange={(e) => setCoverpointForm({...coverpointForm, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              value={coverpointForm.estimated_hours}
              onChange={(e) => setCoverpointForm({...coverpointForm, estimated_hours: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned Start Date</label>
            <input
              type="date"
              value={coverpointForm.planned_start_date}
              onChange={(e) => setCoverpointForm({...coverpointForm, planned_start_date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned End Date</label>
            <input
              type="date"
              value={coverpointForm.planned_end_date}
              onChange={(e) => setCoverpointForm({...coverpointForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Coverpoint'}
          </button>
        </div>
      </form>
      
      <div className="existing-items">
        <h4>Existing Coverpoints</h4>
        <div className="items-list">
          {coverpoints.map(coverpoint => (
            <div key={coverpoint.id} className="item-card">
              <h5>{coverpoint.coverpoint_name}</h5>
              <p><strong>Engineer:</strong> {coverpoint.coverpoint_engineer}</p>
              <p><strong>Status:</strong> {coverpoint.status}</p>
              <p><strong>Priority:</strong> {coverpoint.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRequirementForm = () => (
    <div className="form-section">
      <h3>Create Requirement</h3>
      <form onSubmit={handleRequirementSubmit}>
        <div className="form-group">
          <label>Requirement Name *</label>
          <input
            type="text"
            value={requirementForm.requirement_name}
            onChange={(e) => setRequirementForm({...requirementForm, requirement_name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Test Case</label>
          <select
            value={requirementForm.testcase_id}
            onChange={(e) => setRequirementForm({...requirementForm, testcase_id: e.target.value})}
          >
            <option value="">Select Test Case</option>
            {testcases.map(tc => (
              <option key={tc.id} value={tc.id}>{tc.testcase_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Assertion</label>
          <select
            value={requirementForm.assertion_id}
            onChange={(e) => setRequirementForm({...requirementForm, assertion_id: e.target.value})}
          >
            <option value="">Select Assertion</option>
            {assertions.map(assertion => (
              <option key={assertion.id} value={assertion.id}>{assertion.assertion_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Coverpoint</label>
          <select
            value={requirementForm.coverpoint_id}
            onChange={(e) => setRequirementForm({...requirementForm, coverpoint_id: e.target.value})}
          >
            <option value="">Select Coverpoint</option>
            {coverpoints.map(coverpoint => (
              <option key={coverpoint.id} value={coverpoint.id}>{coverpoint.coverpoint_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={requirementForm.description}
            onChange={(e) => setRequirementForm({...requirementForm, description: e.target.value})}
            rows="3"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={requirementForm.status}
              onChange={(e) => setRequirementForm({...requirementForm, status: e.target.value})}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={requirementForm.priority}
              onChange={(e) => setRequirementForm({...requirementForm, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              value={requirementForm.estimated_hours}
              onChange={(e) => setRequirementForm({...requirementForm, estimated_hours: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned Start Date</label>
            <input
              type="date"
              value={requirementForm.planned_start_date}
              onChange={(e) => setRequirementForm({...requirementForm, planned_start_date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Planned End Date</label>
            <input
              type="date"
              value={requirementForm.planned_end_date}
              onChange={(e) => setRequirementForm({...requirementForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Requirement'}
          </button>
        </div>
      </form>
      
      <div className="existing-items">
        <h4>Existing Requirements</h4>
        <div className="items-list">
          {requirements.map(requirement => (
            <div key={requirement.id} className="item-card">
              <h5>{requirement.requirement_name}</h5>

              <p><strong>Status:</strong> {requirement.status}</p>
              <p><strong>Priority:</strong> {requirement.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    // Get unique modules and engineers for filters
    const uniqueModules = [...new Set(modules.map(m => m.module_name))];
    const uniqueEngineers = [...new Set([
      ...modules.map(m => m.module_engineer),
      ...testcases.map(t => t.testcase_engineer),
      ...assertions.map(a => a.assertion_engineer),
      ...coverpoints.map(c => c.coverpoint_engineer)
    ].filter(Boolean))];

    // Filter data based on selected filters
    const filteredModules = selectedModuleFilter 
      ? modules.filter(m => m.module_name === selectedModuleFilter)
      : modules;
    
    const filteredTestcases = selectedEngineerFilter
      ? testcases.filter(t => t.testcase_engineer === selectedEngineerFilter)
      : testcases;
    
    const filteredAssertions = selectedEngineerFilter
      ? assertions.filter(a => a.assertion_engineer === selectedEngineerFilter)
      : assertions;
    
    const filteredCoverpoints = selectedEngineerFilter
      ? coverpoints.filter(c => c.coverpoint_engineer === selectedEngineerFilter)
      : coverpoints;
    
    const filteredRequirements = requirements; // Requirements don't have direct module/engineer filters

    // Calculate statistics based on filtered data
    const totalItems = filteredModules.length + filteredTestcases.length + filteredAssertions.length + filteredCoverpoints.length + filteredRequirements.length;
    const totalEstimatedHours = [...filteredTestcases, ...filteredAssertions, ...filteredCoverpoints, ...filteredRequirements]
      .reduce((sum, item) => sum + (parseFloat(item.estimated_hours) || 0), 0);
    
    const statusCounts = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0
    };
    
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    [...filteredTestcases, ...filteredAssertions, ...filteredCoverpoints, ...filteredRequirements].forEach(item => {
      if (item.status) statusCounts[item.status]++;
      if (item.priority) priorityCounts[item.priority]++;
    });

    return (
      <div className="overview-section">
        <h3>📊 Project Overview</h3>
        
        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter Modules:</label>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Modules</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filter by Engineer (Test Cases, Assertions, Coverpoints):</label>
            <select
              value={selectedEngineerFilter}
              onChange={(e) => setSelectedEngineerFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Engineers</option>
              {uniqueEngineers.map(engineer => (
                <option key={engineer} value={engineer}>{engineer}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSelectedModuleFilter('');
              setSelectedEngineerFilter('');
            }}
            disabled={!selectedModuleFilter && !selectedEngineerFilter}
          >
            Clear Filters
          </button>
        </div>

        {/* Active Filters Display */}
        {(selectedModuleFilter || selectedEngineerFilter) && (
          <div className="active-filters">
            <span className="filter-label">Active Filters:</span>
            {selectedModuleFilter && (
              <span className="filter-badge">
                Module: {selectedModuleFilter}
                <button 
                  className="remove-filter-btn"
                  onClick={() => setSelectedModuleFilter('')}
                >
                  ×
                </button>
              </span>
            )}
            {selectedEngineerFilter && (
              <span className="filter-badge">
                Engineer: {selectedEngineerFilter}
                <button 
                  className="remove-filter-btn"
                  onClick={() => setSelectedEngineerFilter('')}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
        
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{filteredModules.length}</div>
              <div className="stat-label">Modules</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🧪</div>
            <div className="stat-content">
              <div className="stat-number">{filteredTestcases.length}</div>
              <div className="stat-label">Test Cases</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{filteredAssertions.length}</div>
              <div className="stat-label">Assertions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{filteredCoverpoints.length}</div>
              <div className="stat-label">Coverpoints</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{filteredRequirements.length}</div>
              <div className="stat-label">Requirements</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">{totalEstimatedHours.toFixed(1)}h</div>
              <div className="stat-label">Total Hours</div>
            </div>
          </div>
        </div>

        {/* Status and Priority Charts */}
        <div className="charts-grid">
          <div className="chart-section">
            <h4>📈 Status Distribution</h4>
            <div className="status-bars">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="status-bar">
                  <div className="status-label">{status.replace('_', ' ').toUpperCase()}</div>
                  <div className="status-bar-container">
                    <div 
                      className={`status-bar-fill ${status}`}
                      style={{ width: `${totalItems > 0 ? (count / totalItems) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-count">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h4>🎯 Priority Distribution</h4>
            <div className="priority-bars">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <div key={priority} className="priority-bar">
                  <div className="priority-label">{priority.toUpperCase()}</div>
                  <div className="priority-bar-container">
                    <div 
                      className={`priority-bar-fill ${priority}`}
                      style={{ width: `${totalItems > 0 ? (count / totalItems) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="priority-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Items List */}
        <div className="all-items-section">
          <h4>📋 All Planned Items {totalItems > 0 && `(${totalItems})`}</h4>
          
          {/* Modules Section */}
          {filteredModules.length > 0 && (
            <div className="items-category">
              <h5>📦 Modules ({filteredModules.length})</h5>
              <div className="items-grid">
                {filteredModules.map(module => (
                  <div key={module.id} className="overview-item-card module">
                    <div className="item-header">
                      <span className="item-type">Module</span>
                      <span className="item-name">{module.module_name}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Engineer:</strong> {module.module_engineer || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases Section */}
          {filteredTestcases.length > 0 && (
            <div className="items-category">
              <h5>🧪 Test Cases ({filteredTestcases.length})</h5>
              <div className="items-grid">
                {filteredTestcases.map(testcase => (
                  <div key={testcase.id} className="overview-item-card testcase">
                    <div className="item-header">
                      <span className="item-type">Test Case</span>
                      <span className={`item-status ${testcase.status}`}>{testcase.status}</span>
                    </div>
                    <div className="item-name">{testcase.testcase_name}</div>
                    <div className="item-details">
                      <p><strong>Engineer:</strong> {testcase.testcase_engineer || 'Not assigned'}</p>
                      <p><strong>Priority:</strong> <span className={`priority-badge ${testcase.priority}`}>{testcase.priority}</span></p>
                      {testcase.estimated_hours && <p><strong>Hours:</strong> {testcase.estimated_hours}h</p>}
                      {testcase.planned_start_date && <p><strong>Start:</strong> {testcase.planned_start_date}</p>}
                      {testcase.planned_end_date && <p><strong>End:</strong> {testcase.planned_end_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assertions Section */}
          {filteredAssertions.length > 0 && (
            <div className="items-category">
              <h5>✅ Assertions ({filteredAssertions.length})</h5>
              <div className="items-grid">
                {filteredAssertions.map(assertion => (
                  <div key={assertion.id} className="overview-item-card assertion">
                    <div className="item-header">
                      <span className="item-type">Assertion</span>
                      <span className={`item-status ${assertion.status}`}>{assertion.status}</span>
                    </div>
                    <div className="item-name">{assertion.assertion_name}</div>
                    <div className="item-details">
                      <p><strong>Engineer:</strong> {assertion.assertion_engineer || 'Not assigned'}</p>
                      <p><strong>Priority:</strong> <span className={`priority-badge ${assertion.priority}`}>{assertion.priority}</span></p>
                      {assertion.estimated_hours && <p><strong>Hours:</strong> {assertion.estimated_hours}h</p>}
                      {assertion.planned_start_date && <p><strong>Start:</strong> {assertion.planned_start_date}</p>}
                      {assertion.planned_end_date && <p><strong>End:</strong> {assertion.planned_end_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coverpoints Section */}
          {filteredCoverpoints.length > 0 && (
            <div className="items-category">
              <h5>📊 Coverpoints ({filteredCoverpoints.length})</h5>
              <div className="items-grid">
                {filteredCoverpoints.map(coverpoint => (
                  <div key={coverpoint.id} className="overview-item-card coverpoint">
                    <div className="item-header">
                      <span className="item-type">Coverpoint</span>
                      <span className={`item-status ${coverpoint.status}`}>{coverpoint.status}</span>
                    </div>
                    <div className="item-name">{coverpoint.coverpoint_name}</div>
                    <div className="item-details">
                      <p><strong>Engineer:</strong> {coverpoint.coverpoint_engineer || 'Not assigned'}</p>
                      <p><strong>Priority:</strong> <span className={`priority-badge ${coverpoint.priority}`}>{coverpoint.priority}</span></p>
                      {coverpoint.estimated_hours && <p><strong>Hours:</strong> {coverpoint.estimated_hours}h</p>}
                      {coverpoint.planned_start_date && <p><strong>Start:</strong> {coverpoint.planned_start_date}</p>}
                      {coverpoint.planned_end_date && <p><strong>End:</strong> {coverpoint.planned_end_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements Section */}
          {filteredRequirements.length > 0 && (
            <div className="items-category">
              <h5>📋 Requirements ({filteredRequirements.length})</h5>
              <div className="items-grid">
                {filteredRequirements.map(requirement => (
                  <div key={requirement.id} className="overview-item-card requirement">
                    <div className="item-header">
                      <span className="item-type">Requirement</span>
                      <span className={`item-status ${requirement.status}`}>{requirement.status}</span>
                    </div>
                    <div className="item-name">{requirement.requirement_name}</div>
                    <div className="item-details">
                      <p><strong>Priority:</strong> <span className={`priority-badge ${requirement.priority}`}>{requirement.priority}</span></p>
                      {requirement.estimated_hours && <p><strong>Hours:</strong> {requirement.estimated_hours}h</p>}
                      {requirement.planned_start_date && <p><strong>Start:</strong> {requirement.planned_start_date}</p>}
                      {requirement.planned_end_date && <p><strong>End:</strong> {requirement.planned_end_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h5>No items found</h5>
              <p>
                {selectedModuleFilter || selectedEngineerFilter 
                  ? 'No items match the current filters. Try adjusting your filter criteria.'
                  : 'Start by creating modules, test cases, assertions, coverpoints, or requirements in the previous tabs.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotification = () => {
    if (!notification.show) return null;

    return (
      <div className={`notification ${notification.type}`}>
        <div className="notification-content">
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close" 
            onClick={() => setNotification({ show: false, message: '', type: 'success' })}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmModal.show) return null;

    return (
      <div className="confirm-modal-overlay">
        <div className="confirm-modal">
          <div className="confirm-modal-header">
            <h3>Confirm Action</h3>
            <button 
              className="confirm-modal-close" 
              onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            >
              ×
            </button>
          </div>
          <div className="confirm-modal-body">
            <p>{confirmModal.message}</p>
          </div>
          <div className="confirm-modal-footer">
            <button 
              className="confirm-modal-btn cancel-btn"
              onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            >
              Cancel
            </button>
            <button 
              className="confirm-modal-btn confirm-btn"
              onClick={async () => {
                setConfirmModal({ show: false, message: '', onConfirm: null });
                setLoading(true);
                await confirmModal.onConfirm();
              }}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="dv-planned-work-container">
      <div className="dv-planned-work-content">
        <div className="content-header">
          <h2>DV Planned Work - {selectedProject && selectedDomain ? `Project ${selectedProject}, Domain ${selectedDomain}` : ''}</h2>
          <button className="close-btn" onClick={onClose}>
            <span>Close</span>
            <span className="close-icon">×</span>
          </button>
        </div>
        
        {renderStepIndicator()}
        
        <div className="content-body">
          {currentStep === 1 && renderModuleForm()}
          {currentStep === 2 && renderTestcaseForm()}
          {currentStep === 3 && renderAssertionForm()}
          {currentStep === 4 && renderCoverpointForm()}
          {currentStep === 5 && renderRequirementForm()}
          {currentStep === 6 && renderOverview()}
        </div>
        
        <div className="content-footer">
          <button 
            className="nav-btn prev-btn" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </button>
          <div className="footer-actions">
            <button 
              className="nav-btn next-btn" 
              onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
              disabled={currentStep === 6}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {renderNotification()}
      {renderConfirmModal()}
    </div>
  );
};

export default DVPlannedWorkForm; 