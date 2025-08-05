import React, { useState } from 'react';
import './SYNQMS.css';

const SYNQMS = () => {
  const [checklistData, setChecklistData] = useState([
    {
      id: 1,
      check: 'Synthesis Constraints Review',
      report_to_be_checked: 'synthesis_constraints.rpt',
      pass_fail: 'pass',
      engineer_comments: 'All constraints properly defined and validated',
      reviewer_comments: 'Approved - constraints are comprehensive',
      approve_status: 'approved'
    },
    {
      id: 2,
      check: 'Timing Analysis',
      report_to_be_checked: 'timing_analysis.rpt',
      pass_fail: 'pass',
      engineer_comments: 'All timing requirements met within specifications',
      reviewer_comments: 'Timing closure achieved successfully',
      approve_status: 'approved'
    },
    {
      id: 3,
      check: 'Area Utilization',
      report_to_be_checked: 'area_utilization.rpt',
      pass_fail: 'pass',
      engineer_comments: 'Area utilization within target range',
      reviewer_comments: 'Area optimization looks good',
      approve_status: 'approved'
    },
    {
      id: 4,
      check: 'Power Analysis',
      report_to_be_checked: 'power_analysis.rpt',
      pass_fail: 'fail',
      engineer_comments: 'Power consumption exceeds target by 15%',
      reviewer_comments: 'Need to optimize power consumption',
      approve_status: 'pending'
    },
    {
      id: 5,
      check: 'Design Rule Check',
      report_to_be_checked: 'drc_check.rpt',
      pass_fail: 'pass',
      engineer_comments: 'All DRC violations resolved',
      reviewer_comments: 'DRC clean - good work',
      approve_status: 'approved'
    }
  ]);

  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  const handleEdit = (row) => {
    setEditingRow(row.id);
    setEditData({ ...row });
  };

  const handleSave = () => {
    setChecklistData(prev => 
      prev.map(item => 
        item.id === editingRow ? { ...item, ...editData } : item
      )
    );
    setEditingRow(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const getPassFailColor = (status) => {
    switch (status) {
      case 'pass': return 'pass-fail-pass';
      case 'fail': return 'pass-fail-fail';
      default: return 'pass-fail-pending';
    }
  };

  return (
    <div className="synqms-container">
      <div className="synqms-header">
        <h1>Synthesis QMS Checklist</h1>
        <p>Quality Management System for Synthesis Stage</p>
      </div>

      <div className="synqms-content">
        <div className="table-container">
          <table className="synqms-table">
            <thead>
              <tr>
                <th>Check</th>
                <th>Report to be Checked</th>
                <th>Pass/Fail</th>
                <th>Engineer Comments</th>
                <th>Reviewer Comments</th>
                <th>Approve Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {checklistData.map((row) => (
                <tr key={row.id}>
                  <td>
                    {editingRow === row.id ? (
                      <input
                        type="text"
                        value={editData.check || ''}
                        onChange={(e) => handleInputChange('check', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      row.check
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <input
                        type="text"
                        value={editData.report_to_be_checked || ''}
                        onChange={(e) => handleInputChange('report_to_be_checked', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span className="report-file">{row.report_to_be_checked}</span>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <select
                        value={editData.pass_fail || ''}
                        onChange={(e) => handleInputChange('pass_fail', e.target.value)}
                        className="edit-select"
                      >
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <span className={`pass-fail-badge ${getPassFailColor(row.pass_fail)}`}>
                        {row.pass_fail.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <textarea
                        value={editData.engineer_comments || ''}
                        onChange={(e) => handleInputChange('engineer_comments', e.target.value)}
                        className="edit-textarea"
                        rows="3"
                      />
                    ) : (
                      <div className="comments-cell">
                        {row.engineer_comments}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <textarea
                        value={editData.reviewer_comments || ''}
                        onChange={(e) => handleInputChange('reviewer_comments', e.target.value)}
                        className="edit-textarea"
                        rows="3"
                      />
                    ) : (
                      <div className="comments-cell">
                        {row.reviewer_comments}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <select
                        value={editData.approve_status || ''}
                        onChange={(e) => handleInputChange('approve_status', e.target.value)}
                        className="edit-select"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(row.approve_status)}`}>
                        {row.approve_status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <div className="action-buttons">
                        <button onClick={handleSave} className="save-btn">Save</button>
                        <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(row)} className="edit-btn">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SYNQMS; 