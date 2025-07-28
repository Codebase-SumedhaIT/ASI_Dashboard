import React, { useState, useEffect } from 'react';
import './CLEngineerView.css';

const CLEngineerView = ({ filters = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [showOnlySelectedRow, setShowOnlySelectedRow] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem('token');

  // CL-specific columns with all fields
  const columns = [
    { key: 'project_name', label: 'Project', sortable: true },
    { key: 'phase', label: 'Phase', sortable: true },
    { key: 'user_name', label: 'User', sortable: true },
    { key: 'block_name', label: 'Block', sortable: true },
    { key: 'floor_plan', label: 'Floor Plan', sortable: false },
    { key: 'routing', label: 'Routing', sortable: false },
    { key: 'area_um2', label: 'Area (um²)', sortable: true },
    { key: 'pv_drc', label: 'PV - DRC', sortable: false },
    { key: 'pv_lvs_erc', label: 'PV - LVS/ERC', sortable: false },
    { key: 'pv_perc', label: 'PV - PERC', sortable: false },
    { key: 'ir_static', label: 'IR (Static)', sortable: false },
    { key: 'ir_dynamic', label: 'IR (Dynamic)', sortable: false },
    { key: 'em_power_signal', label: 'EM Iavg', sortable: false },
    { key: 'em_rms_power_signal', label: 'EM Irms', sortable: false },
    { key: 'runtime_seconds', label: 'Runtime', sortable: true },
    { key: 'run_end_time', label: 'Run End Time', sortable: true },
    { key: 'run_status', label: 'Status', sortable: true },
    { key: 'logs_errors_warnings', label: 'Logs', sortable: false },
    { key: 'ai_summary', label: 'AI Summary', sortable: false },
    { key: 'run_directory', label: 'Run Directory', sortable: false }
  ];

  useEffect(() => {
    fetchCurrentUser();
    fetchCLData();
  }, []);

  useEffect(() => {
    fetchCLData();
  }, [filters, currentPage]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchCLData = async () => {
    try {
      setLoading(true);
      
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v && v !== '' && v !== null && v !== undefined)
      );
      
      const queryParams = new URLSearchParams({
        ...filterParams,
        limit: 50,
        offset: (currentPage - 1) * 50
      });
      
      const response = await fetch(`http://localhost:5000/api/data/cl-data?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setData(data);
        setTotalPages(Math.ceil(data.length / 50));
      }
    } catch (error) {
      console.error('Error fetching CL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      // Handle numeric values
      if (sortConfig.key === 'area_um2' || sortConfig.key === 'runtime_seconds') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const formatRuntime = (seconds) => {
    if (!seconds || isNaN(parseFloat(seconds))) return 'N/A';
    const numSeconds = parseFloat(seconds);
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'success';
      case 'fail': return 'danger';
      case 'continue_with_error': return 'warning';
      default: return 'info';
    }
  };

  const handleRowClick = (row, index) => {
    if (showOnlySelectedRow) {
      setShowOnlySelectedRow(false);
      setSelectedRow(null);
    } else {
      setShowOnlySelectedRow(true);
      setSelectedRow(index);
    }
  };

  const handleDeleteRecord = async (recordId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/data/cl-data/${recordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          fetchCLData(); // Refresh data
        } else {
          console.error('Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderSortableHeader = (key, label) => (
    <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
      {label} {getSortIcon(key)}
    </th>
  );

  const getCellValue = (row, field) => {
    let value = row[field] || 'N/A';
    
    // Format specific fields
    if (field === 'runtime_seconds') {
      value = formatRuntime(value);
    } else if (field === 'run_end_time') {
      value = value !== 'N/A' ? new Date(value).toLocaleDateString() : 'N/A';
    } else if (field === 'area_um2' && value !== 'N/A') {
      value = parseFloat(value).toFixed(2);
    }
    
    return value;
  };

  const filteredData = showOnlySelectedRow && selectedRow !== null 
    ? [getSortedData()[selectedRow]] 
    : getSortedData();

  return (
    <div className="cl-engineer-view">
      <div className="view-header">
        <h2>Custom Layout - Engineer View</h2>
        <div className="view-actions">
          {showOnlySelectedRow && (
            <button 
              className="back-to-all-btn"
              onClick={() => {
                setShowOnlySelectedRow(false);
                setSelectedRow(null);
              }}
            >
              ← Back to All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading CL data...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="cl-data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  col.sortable ? 
                    renderSortableHeader(col.key, col.label) : 
                    <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="no-data">
                    No CL data found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr 
                    key={row.id || index}
                    className={`data-row ${selectedRow === index ? 'selected-row' : ''} ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}
                    onClick={() => handleRowClick(row, index)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={`${col.key}-cell`}>
                        {col.key === 'run_status' ? (
                          <span className={`status-badge ${getStatusColor(row.run_status)}`}>
                            {getCellValue(row, col.key)}
                          </span>
                        ) : col.key === 'runtime_seconds' ? (
                          <span className="runtime-display">
                            {getCellValue(row, col.key)}
                          </span>
                        ) : col.key === 'ai_summary' ? (
                          <div className="summary-content" title={getCellValue(row, col.key)}>
                            {getCellValue(row, col.key)}
                          </div>
                        ) : col.key === 'area_um2' ? (
                          <span className="numeric-value">
                            {getCellValue(row, col.key)}
                          </span>
                        ) : col.key === 'logs_errors_warnings' ? (
                          <div className="logs-content" title={getCellValue(row, col.key)}>
                            {getCellValue(row, col.key)}
                          </div>
                        ) : (
                          getCellValue(row, col.key)
                        )}
                      </td>
                    ))}
                    <td className="actions-cell">
                      {currentUser && (
                        (currentUser.role_name === 'Admin') || 
                        (currentUser.name === row.user_name)
                      ) ? (
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDeleteRecord(row.id, e)}
                          title="Delete this record"
                        >
                          🗑️
                        </button>
                      ) : (
                        <span className="no-action">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!showOnlySelectedRow && data.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CLEngineerView; 