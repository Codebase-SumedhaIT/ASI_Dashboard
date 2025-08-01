import React, { useState, useEffect } from 'react';
import './DVPlannedWorkForm.css';

const DVPlannedWorkForm = ({ isOpen, onClose, selectedProject, selectedDomain }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [testcases, setTestcases] = useState([]);
  const [assertions, setAssertions] = useState([]);
  const [coverpoints, setCoverpoints] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form data states (No component dependencies)
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

  const fetchExistingData = async () => {
    if (!selectedProject || !selectedDomain) return;

    try {
      const token = localStorage.getItem('token');
      
      // Fetch testcases
      const testcasesResponse = await fetch(`http://localhost:5000/api/planned-work/testcases/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const testcasesData = await testcasesResponse.json();
      if (testcasesData.success) {
        setTestcases(testcasesData.testcases);
      }

      // Fetch assertions
      const assertionsResponse = await fetch(`http://localhost:5000/api/planned-work/assertions/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assertionsData = await assertionsResponse.json();
      if (assertionsData.success) {
        setAssertions(assertionsData.assertions);
      }

      // Fetch functional coverage
      const coverpointsResponse = await fetch(`http://localhost:5000/api/planned-work/functional-coverage/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coverpointsData = await coverpointsResponse.json();
      if (coverpointsData.success) {
        setCoverpoints(coverpointsData.functionalCoverage);
      }

      // Fetch requirements
      const requirementsResponse = await fetch(`http://localhost:5000/api/planned-work/requirements/${selectedProject}/${selectedDomain}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const requirementsData = await requirementsResponse.json();
      if (requirementsData.success) {
        setRequirements(requirementsData.requirements);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleTestcaseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/planned-work/testcases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
          assigned_to: '',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        alert('Testcase created successfully!');
      } else {
        alert('Error creating testcase: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating testcase:', error);
      alert('Error creating testcase');
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
          assigned_to: '',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        alert('Assertion created successfully!');
      } else {
        alert('Error creating assertion: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating assertion:', error);
      alert('Error creating assertion');
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
          assigned_to: '',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        alert('Functional coverage created successfully!');
      } else {
        alert('Error creating functional coverage: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating functional coverage:', error);
      alert('Error creating functional coverage');
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
          assigned_to: '',
          estimated_hours: '',
          planned_start_date: '',
          planned_end_date: ''
        });
        fetchExistingData();
        alert('Requirement created successfully!');
      } else {
        alert('Error creating requirement: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      alert('Error creating requirement');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>Testcases</div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>Assertions</div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>Functional Coverage</div>
      <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>Requirements</div>
    </div>
  );

  const renderTestcaseForm = () => (
    <div className="form-section">
      <h3>Create Testcase</h3>
      <form onSubmit={handleTestcaseSubmit}>
        <div className="form-group">
          <label>Testcase Name:</label>
          <input
            type="text"
            value={testcaseForm.testcase_name}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Engineer:</label>
          <input
            type="text"
            value={testcaseForm.testcase_engineer}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_engineer: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={testcaseForm.testcase_description}
            onChange={(e) => setTestcaseForm({...testcaseForm, testcase_description: e.target.value})}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Status:</label>
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
            <label>Priority:</label>
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
            <label>Assigned To:</label>
            <select
              value={testcaseForm.assigned_to}
              onChange={(e) => setTestcaseForm({...testcaseForm, assigned_to: e.target.value})}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Estimated Hours:</label>
            <input
              type="number"
              step="0.5"
              value={testcaseForm.estimated_hours}
              onChange={(e) => setTestcaseForm({...testcaseForm, estimated_hours: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Planned Start Date:</label>
            <input
              type="date"
              value={testcaseForm.planned_start_date}
              onChange={(e) => setTestcaseForm({...testcaseForm, planned_start_date: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Planned End Date:</label>
            <input
              type="date"
              value={testcaseForm.planned_end_date}
              onChange={(e) => setTestcaseForm({...testcaseForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}>
            Previous
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Testcase'}
          </button>
          <button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
            Next
          </button>
        </div>
      </form>
      
      <div className="existing-data">
        <h4>Existing Testcases</h4>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Engineer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {testcases.map(testcase => (
                <tr key={testcase.id}>
                  <td>{testcase.testcase_name}</td>
                  <td>{testcase.testcase_engineer}</td>
                  <td>{testcase.status}</td>
                  <td>{testcase.priority}</td>
                  <td>{testcase.assigned_to_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssertionForm = () => (
    <div className="form-section">
      <h3>Create Assertion</h3>
      <form onSubmit={handleAssertionSubmit}>
        <div className="form-group">
          <label>Assertion Name:</label>
          <input
            type="text"
            value={assertionForm.assertion_name}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Engineer:</label>
          <input
            type="text"
            value={assertionForm.assertion_engineer}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_engineer: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={assertionForm.assertion_description}
            onChange={(e) => setAssertionForm({...assertionForm, assertion_description: e.target.value})}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Status:</label>
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
            <label>Priority:</label>
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
            <label>Assigned To:</label>
            <select
              value={assertionForm.assigned_to}
              onChange={(e) => setAssertionForm({...assertionForm, assigned_to: e.target.value})}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Estimated Hours:</label>
            <input
              type="number"
              step="0.5"
              value={assertionForm.estimated_hours}
              onChange={(e) => setAssertionForm({...assertionForm, estimated_hours: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Planned Start Date:</label>
            <input
              type="date"
              value={assertionForm.planned_start_date}
              onChange={(e) => setAssertionForm({...assertionForm, planned_start_date: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Planned End Date:</label>
            <input
              type="date"
              value={assertionForm.planned_end_date}
              onChange={(e) => setAssertionForm({...assertionForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Assertion'}
          </button>
          <button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
            Next
          </button>
        </div>
      </form>
      
      <div className="existing-data">
        <h4>Existing Assertions</h4>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Engineer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {assertions.map(assertion => (
                <tr key={assertion.id}>
                  <td>{assertion.assertion_name}</td>
                  <td>{assertion.assertion_engineer}</td>
                  <td>{assertion.status}</td>
                  <td>{assertion.priority}</td>
                  <td>{assertion.assigned_to_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCoverpointForm = () => (
    <div className="form-section">
      <h3>Create Functional Coverage</h3>
      <form onSubmit={handleCoverpointSubmit}>
        <div className="form-group">
          <label>Coverpoint Name:</label>
          <input
            type="text"
            value={coverpointForm.coverpoint_name}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Engineer:</label>
          <input
            type="text"
            value={coverpointForm.coverpoint_engineer}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_engineer: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={coverpointForm.coverpoint_description}
            onChange={(e) => setCoverpointForm({...coverpointForm, coverpoint_description: e.target.value})}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Status:</label>
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
            <label>Priority:</label>
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
            <label>Assigned To:</label>
            <select
              value={coverpointForm.assigned_to}
              onChange={(e) => setCoverpointForm({...coverpointForm, assigned_to: e.target.value})}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Estimated Hours:</label>
            <input
              type="number"
              step="0.5"
              value={coverpointForm.estimated_hours}
              onChange={(e) => setCoverpointForm({...coverpointForm, estimated_hours: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Planned Start Date:</label>
            <input
              type="date"
              value={coverpointForm.planned_start_date}
              onChange={(e) => setCoverpointForm({...coverpointForm, planned_start_date: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Planned End Date:</label>
            <input
              type="date"
              value={coverpointForm.planned_end_date}
              onChange={(e) => setCoverpointForm({...coverpointForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Functional Coverage'}
          </button>
          <button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
            Next
          </button>
        </div>
      </form>
      
      <div className="existing-data">
        <h4>Existing Functional Coverage</h4>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Engineer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {coverpoints.map(coverpoint => (
                <tr key={coverpoint.id}>
                  <td>{coverpoint.coverpoint_name}</td>
                  <td>{coverpoint.coverpoint_engineer}</td>
                  <td>{coverpoint.status}</td>
                  <td>{coverpoint.priority}</td>
                  <td>{coverpoint.assigned_to_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRequirementForm = () => (
    <div className="form-section">
      <h3>Create Requirement</h3>
      <form onSubmit={handleRequirementSubmit}>
        <div className="form-group">
          <label>Requirement Name:</label>
          <input
            type="text"
            value={requirementForm.requirement_name}
            onChange={(e) => setRequirementForm({...requirementForm, requirement_name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={requirementForm.description}
            onChange={(e) => setRequirementForm({...requirementForm, description: e.target.value})}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Testcase:</label>
            <select
              value={requirementForm.testcase_id}
              onChange={(e) => setRequirementForm({...requirementForm, testcase_id: e.target.value})}
            >
              <option value="">Select Testcase</option>
              {testcases.map(testcase => (
                <option key={testcase.id} value={testcase.id}>{testcase.testcase_name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Assertion:</label>
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
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Functional Coverage:</label>
            <select
              value={requirementForm.coverpoint_id}
              onChange={(e) => setRequirementForm({...requirementForm, coverpoint_id: e.target.value})}
            >
              <option value="">Select Functional Coverage</option>
              {coverpoints.map(coverpoint => (
                <option key={coverpoint.id} value={coverpoint.id}>{coverpoint.coverpoint_name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Status:</label>
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
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Priority:</label>
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
          
          <div className="form-group">
            <label>Assigned To:</label>
            <select
              value={requirementForm.assigned_to}
              onChange={(e) => setRequirementForm({...requirementForm, assigned_to: e.target.value})}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Estimated Hours:</label>
            <input
              type="number"
              step="0.5"
              value={requirementForm.estimated_hours}
              onChange={(e) => setRequirementForm({...requirementForm, estimated_hours: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Planned Start Date:</label>
            <input
              type="date"
              value={requirementForm.planned_start_date}
              onChange={(e) => setRequirementForm({...requirementForm, planned_start_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Planned End Date:</label>
            <input
              type="date"
              value={requirementForm.planned_end_date}
              onChange={(e) => setRequirementForm({...requirementForm, planned_end_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Requirement'}
          </button>
          <button type="button" onClick={onClose}>
            Finish
          </button>
        </div>
      </form>
      
      <div className="existing-data">
        <h4>Existing Requirements</h4>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Testcase</th>
                <th>Assertion</th>
                <th>Functional Coverage</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map(requirement => (
                <tr key={requirement.id}>
                  <td>{requirement.requirement_name}</td>
                  <td>{requirement.testcase_name}</td>
                  <td>{requirement.assertion_name}</td>
                  <td>{requirement.coverpoint_name}</td>
                  <td>{requirement.status}</td>
                  <td>{requirement.priority}</td>
                  <td>{requirement.assigned_to_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="dv-planned-work-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Define Project Plans - {selectedProject && selectedDomain ? `Project ${selectedProject}, Domain ${selectedDomain}` : ''}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {renderStepIndicator()}
        
        <div className="modal-body">
          {currentStep === 1 && renderTestcaseForm()}
          {currentStep === 2 && renderAssertionForm()}
          {currentStep === 3 && renderCoverpointForm()}
          {currentStep === 4 && renderRequirementForm()}
        </div>
      </div>
    </div>
  );
};

export default DVPlannedWorkForm; 