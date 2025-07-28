import React, { useEffect, useState } from 'react';

const columns = [
  { key: 'project_name', label: 'Project' },
  { key: 'phase', label: 'Phase' },
  { key: 'user_name', label: 'User' },
  { key: 'block_name', label: 'Block' },
  { key: 'floor_plan', label: 'Floor Plan' },
  { key: 'routing', label: 'Routing' },
  { key: 'area_um2', label: 'Area (um²)' },
  { key: 'pv_drc', label: 'PV - DRC' },
  { key: 'pv_lvs_erc', label: 'PV - LVS/ERC' },
  { key: 'pv_perc', label: 'PV - PERC' },
  { key: 'ir_static', label: 'IR (Static)' },
  { key: 'ir_dynamic', label: 'IR (Dynamic)' },
  { key: 'em_power_signal', label: 'EM Iavg' },
  { key: 'em_rms_power_signal', label: 'EM Irms' },
  { key: 'runtime_seconds', label: 'Runtime (sec)' },
  { key: 'run_end_time', label: 'Run End Time' },
  { key: 'run_status', label: 'Status' },
  { key: 'logs_errors_warnings', label: 'Logs' },
  { key: 'ai_summary', label: 'AI Summary' },
];

function CLDataPage({ filters = {} }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockFilter, setBlockFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [phases, setPhases] = useState([]);

  // Fetch data function (shows spinner)
  const fetchCLData = () => {
    const filterParams = Object.fromEntries(
      Object.entries({ 
        ...filters, 
        block_name: blockFilter,
        user_name: userFilter,
        phase: phaseFilter 
      }).filter(([_, v]) => v)
    );
    const queryParams = new URLSearchParams(filterParams).toString();
    setLoading(true);
    fetch(`/api/cl-data${queryParams ? `?${queryParams}` : ''}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        // Extract unique values for filters
        const uniqueBlocks = Array.from(new Set(json.map(row => row.block_name).filter(Boolean)));
        const uniqueUsers = Array.from(new Set(json.map(row => row.user_name).filter(Boolean)));
        const uniquePhases = Array.from(new Set(json.map(row => row.phase).filter(Boolean)));
        setBlocks(uniqueBlocks);
        setUsers(uniqueUsers);
        setPhases(uniquePhases);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  };

  // Silent background refresh (no spinner)
  const silentRefresh = () => {
    const filterParams = Object.fromEntries(
      Object.entries({ 
        ...filters, 
        block_name: blockFilter,
        user_name: userFilter,
        phase: phaseFilter 
      }).filter(([_, v]) => v)
    );
    const queryParams = new URLSearchParams(filterParams).toString();
    fetch(`/api/cl-data${queryParams ? `?${queryParams}` : ''}`)
      .then(res => res.json())
      .then(json => {
        if (JSON.stringify(json) !== JSON.stringify(data)) {
          setData(json);
          // Extract unique values for filters
          const uniqueBlocks = Array.from(new Set(json.map(row => row.block_name).filter(Boolean)));
          const uniqueUsers = Array.from(new Set(json.map(row => row.user_name).filter(Boolean)));
          const uniquePhases = Array.from(new Set(json.map(row => row.phase).filter(Boolean)));
          setBlocks(uniqueBlocks);
          setUsers(uniqueUsers);
          setPhases(uniquePhases);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCLData(); // initial load with spinner
    const interval = setInterval(silentRefresh, 10000); // silent background refresh
    return () => clearInterval(interval);
  }, [JSON.stringify(filters), blockFilter, userFilter, phaseFilter]);

  const filteredData = data.filter(row => {
    if (blockFilter && row.block_name !== blockFilter) return false;
    if (userFilter && row.user_name !== userFilter) return false;
    if (phaseFilter && row.phase !== phaseFilter) return false;
    return true;
  });

  // Format runtime seconds to HH:MM
  const formatRuntime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{ padding: 24, overflowX: 'auto' }}>
      <h2>Custom Layout (CL) Data</h2>
      
      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <label>Block: </label>
          <select value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
            <option value=''>All</option>
            {blocks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>User: </label>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value=''>All</option>
            {users.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Phase: </label>
          <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}>
            <option value=''>All</option>
            {phases.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <table border={1} cellPadding={6} cellSpacing={0} style={{ minWidth: 1200 }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ textAlign: 'center' }}>Loading...</td></tr>
          ) : filteredData.length === 0 ? (
            <tr><td colSpan={columns.length}>No CL data found.</td></tr>
          ) : (
            filteredData.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map(col => {
                  let value = row[col.key] ?? 'N/A';
                  
                  // Format specific fields
                  if (col.key === 'runtime_seconds') {
                    value = formatRuntime(value);
                  } else if (col.key === 'run_end_time') {
                    value = formatDate(value);
                  } else if (col.key === 'area_um2' && value !== 'N/A') {
                    value = parseFloat(value).toFixed(2);
                  }
                  
                  return <td key={col.key}>{value}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CLDataPage; 