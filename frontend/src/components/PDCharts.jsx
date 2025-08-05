import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, ReferenceLine
} from 'recharts';
import './PDCharts.css';

const PDCharts = ({ projectFilters = {} }) => {
  const [pdData, setPdData] = useState([]);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('overview');
  const [filters, setFilters] = useState({
    domain_id: '',
    project_id: '',
    block_name: '',
    experiment: ''
  });
  const [chartFilters, setChartFilters] = useState({
    selectedBlock: '',
    selectedExperiment: '',
    selectedTimingType: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    blocks: [],
    experiments: [],
    timingTypes: [],
    blocksByExperiment: {}
  });

  const token = localStorage.getItem('token');

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#f59e0b',
    info: '#06b6d4',
    purple: '#8b5cf6',
    pink: '#ec4899',
    gray: '#6b7280'
  };

  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      domain_id: projectFilters?.domain_id || '',
      project_id: projectFilters?.project_id || ''
    }));
  }, [projectFilters]);

  useEffect(() => {
    fetchPDData();
  }, [filters]);

  const fetchPDData = async () => {
    try {
      setLoading(true);
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const queryParams = new URLSearchParams(filterParams);
      
      const response = await fetch(`http://localhost:5000/api/data/pd-data?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData || [];
        setPdData(data);
        processChartData(data);
      }
    } catch (error) {
      console.error('Error fetching PD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    // Process data for different chart types
    const processedData = {
      runStatus: processRunStatusData(data),
      runtimeTrends: processRuntimeTrendsData(data),
      areaUtilization: processAreaUtilizationData(data),
      blockPerformance: processBlockPerformanceData(data),
      timingAnalysis: processTimingAnalysisData(data),
      detailedTiming: processDetailedTimingData(data),
      successRateTrends: processSuccessRateTrendsData(data)
    };
    setChartData(processedData);
    
    // Process available filters
    processAvailableFilters(data);
  };

  const processRunStatusData = (data) => {
    const statusCounts = data.reduce((acc, item) => {
      const status = item.run_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const processRuntimeTrendsData = (data) => {
    return data
      .filter(item => item.run_end_time && item.runtime_seconds)
      .sort((a, b) => new Date(a.run_end_time) - new Date(b.run_end_time))
      .map(item => ({
        date: new Date(item.run_end_time).toLocaleDateString(),
        runtime: parseFloat(item.runtime_seconds) / 3600, // Convert to hours
        status: item.run_status
      }));
  };

  const processAreaUtilizationData = (data) => {
    return data
      .filter(item => item.area_um2 && item.utilization)
      .map(item => ({
        area: parseFloat(item.area_um2),
        utilization: parseFloat(item.utilization),
        block: item.block_name,
        status: item.run_status
      }));
  };

  const processBlockPerformanceData = (data) => {
    const blockStats = data.reduce((acc, item) => {
      if (!item.block_name) return acc;
      
      if (!acc[item.block_name]) {
        acc[item.block_name] = {
          total: 0,
          passed: 0,
          failed: 0,
          avgRuntime: 0,
          totalRuntime: 0
        };
      }
      
      acc[item.block_name].total++;
      if (item.run_status === 'pass') acc[item.block_name].passed++;
      if (item.run_status === 'fail') acc[item.block_name].failed++;
      
      if (item.runtime_seconds) {
        acc[item.block_name].totalRuntime += parseFloat(item.runtime_seconds);
      }
      
      return acc;
    }, {});

    return Object.entries(blockStats).map(([block, stats]) => ({
      block,
      successRate: (stats.passed / stats.total) * 100,
      avgRuntime: stats.totalRuntime / stats.total / 3600, // Convert to hours
      totalRuns: stats.total
    }));
  };

  const processTimingAnalysisData = (data) => {
    return data
      .filter(item => item.internal_timing || item.interface_timing)
      .map(item => ({
        date: new Date(item.run_end_time).toLocaleDateString(),
        internal: parseFloat(item.internal_timing) || 0,
        interface: parseFloat(item.interface_timing) || 0,
        block: item.block_name
      }));
  };

  const processDetailedTimingData = (data) => {
    return data
      .filter(item => item.internal_timing && item.block_name && item.experiment)
      .map(item => {
        // Parse internal_timing format like "r2r: -0.312/-3.5/338" (WNS/TNS/NUM)
        const timingMatch = item.internal_timing.match(/(\w+):\s*([-\d.]+)\/([-\d.]+)\/([-\d.]+)/);
        if (timingMatch) {
          const [, timingType, wns, tns, num] = timingMatch;
          return {
            block: item.block_name,
            experiment: item.experiment,
            timingType: timingType,
            wns: parseFloat(wns) || 0,
            tns: parseFloat(tns) || 0,
            num: parseFloat(num) || 0,
            stage: item.stage || 'Unknown',
            runStatus: item.run_status
          };
        }
        return null;
      })
      .filter(item => item !== null);
  };

  const processAvailableFilters = (data) => {
    const blocks = [...new Set(data.map(item => item.block_name).filter(Boolean))];
    const experiments = [...new Set(data.map(item => item.experiment).filter(Boolean))];
    
    // Extract timing types from internal_timing data
    const timingTypes = [...new Set(
      data
        .filter(item => item.internal_timing)
        .map(item => {
          const match = item.internal_timing.match(/(\w+):/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    )];

    // Create blocks by experiment mapping
    const blocksByExperiment = {};
    data.forEach(item => {
      if (item.experiment && item.block_name) {
        if (!blocksByExperiment[item.experiment]) {
          blocksByExperiment[item.experiment] = [];
        }
        if (!blocksByExperiment[item.experiment].includes(item.block_name)) {
          blocksByExperiment[item.experiment].push(item.block_name);
        }
      }
    });

    // Sort blocks within each experiment
    Object.keys(blocksByExperiment).forEach(experiment => {
      blocksByExperiment[experiment].sort();
    });

    setAvailableFilters({
      blocks: blocks.sort(),
      experiments: experiments.sort(),
      timingTypes: timingTypes.sort(),
      blocksByExperiment
    });
  };

  const processSuccessRateTrendsData = (data) => {
    const monthlyStats = data.reduce((acc, item) => {
      if (!item.run_end_time) return acc;
      
      const month = new Date(item.run_end_time).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { total: 0, passed: 0 };
      }
      
      acc[month].total++;
      if (item.run_status === 'pass') acc[month].passed++;
      
      return acc;
    }, {});

    return Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        successRate: (stats.passed / stats.total) * 100,
        totalRuns: stats.total
      }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return COLORS.success;
      case 'fail': return COLORS.danger;
      case 'continue_with_error': return COLORS.warning;
      case 'running': return COLORS.info;
      case 'aborted': return COLORS.gray;
      default: return COLORS.gray;
    }
  };

  const handleChartFilterChange = (filterType, value) => {
    setChartFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'experiment') {
        newFilters.selectedExperiment = value;
        // Reset block when experiment changes
        newFilters.selectedBlock = '';
      } else if (filterType === 'block') {
        newFilters.selectedBlock = value;
      } else if (filterType === 'timingType') {
        newFilters.selectedTimingType = value;
      }
      
      return newFilters;
    });
  };

  const clearChartFilters = () => {
    setChartFilters({
      selectedBlock: '',
      selectedExperiment: '',
      selectedTimingType: ''
    });
  };

  const getFilteredDetailedTimingData = () => {
    let filteredData = chartData.detailedTiming || [];
    
    if (chartFilters.selectedExperiment) {
      filteredData = filteredData.filter(item => 
        item.experiment === chartFilters.selectedExperiment
      );
    }
    
    if (chartFilters.selectedBlock) {
      filteredData = filteredData.filter(item => 
        item.block === chartFilters.selectedBlock
      );
    }
    
    if (chartFilters.selectedTimingType) {
      filteredData = filteredData.filter(item => 
        item.timingType === chartFilters.selectedTimingType
      );
    }
    
    return filteredData;
  };

  const chartTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'timing', label: 'Timing Analysis', icon: '⏱️' },
    { id: 'detailed-timing', label: 'Detailed Timing', icon: '🔍' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'blocks', label: 'Block Analysis', icon: '🏗️' }
  ];

  const renderOverviewCharts = () => (
    <div className="charts-grid">
      {/* Run Status Distribution */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Run Status Distribution</h3>
          <p>Distribution of run statuses across all PD runs</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.runStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.runStatus?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Runtime Trends */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Runtime Trends</h3>
          <p>Runtime trends over time for PD runs</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.runtimeTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="runtime" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPerformanceCharts = () => (
    <div className="charts-grid">
      {/* Area vs Utilization Scatter */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Area vs Utilization</h3>
          <p>Relationship between area and utilization</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="area" name="Area (μm²)" />
            <YAxis type="number" dataKey="utilization" name="Utilization (%)" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter 
              data={chartData.areaUtilization} 
              fill={COLORS.primary}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Block Performance */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Block Performance</h3>
          <p>Success rate and average runtime by block</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData.blockPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="block" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="successRate" 
              fill={COLORS.success} 
              name="Success Rate (%)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgRuntime" 
              stroke={COLORS.warning} 
              strokeWidth={2}
              name="Avg Runtime (hrs)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTimingCharts = () => (
    <div className="charts-grid">
      {/* Timing Analysis */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Timing Analysis</h3>
          <p>Internal vs Interface timing trends</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.timingAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="internal" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              name="Internal Timing"
            />
            <Line 
              type="monotone" 
              dataKey="interface" 
              stroke={COLORS.purple} 
              strokeWidth={2}
              name="Interface Timing"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDetailedTimingCharts = () => {
    const detailedData = getFilteredDetailedTimingData();
    
    // Group data by block and experiment
    const blockExperimentData = detailedData.reduce((acc, item) => {
      const key = `${item.block}_${item.experiment}`;
      if (!acc[key]) {
        acc[key] = {
          block: item.block,
          experiment: item.experiment,
          data: []
        };
      }
      acc[key].data.push(item);
      return acc;
    }, {});

    return (
      <div className="detailed-timing-charts">
                 {/* Filter Controls */}
         <div className="chart-filters">
           <div className="filter-section">
             <h4>Filter by Experiment</h4>
             <select
               value={chartFilters.selectedExperiment}
               onChange={(e) => handleChartFilterChange('experiment', e.target.value)}
               className="filter-dropdown"
             >
               <option value="">All Experiments</option>
               {availableFilters.experiments.map(experiment => (
                 <option key={experiment} value={experiment}>
                   {experiment}
                 </option>
               ))}
             </select>
           </div>
           
           <div className="filter-section">
             <h4>Filter by Block</h4>
             <select
               value={chartFilters.selectedBlock}
               onChange={(e) => handleChartFilterChange('block', e.target.value)}
               className="filter-dropdown"
               disabled={!chartFilters.selectedExperiment}
             >
               <option value="">All Blocks</option>
               {chartFilters.selectedExperiment && availableFilters.blocksByExperiment[chartFilters.selectedExperiment]?.map(block => (
                 <option key={block} value={block}>
                   {block}
                 </option>
               ))}
             </select>
           </div>
           
           <div className="filter-section">
             <h4>Filter by Timing Type</h4>
             <select
               value={chartFilters.selectedTimingType}
               onChange={(e) => handleChartFilterChange('timingType', e.target.value)}
               className="filter-dropdown"
             >
               <option value="">All Timing Types</option>
               {availableFilters.timingTypes.map(timingType => (
                 <option key={timingType} value={timingType}>
                   {timingType}
                 </option>
               ))}
             </select>
           </div>
           
           <button className="clear-filters-btn" onClick={clearChartFilters}>
             Clear All Filters
           </button>
         </div>

        <div className="charts-grid">
          {/* WNS Comparison */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>WNS (Worst Negative Slack) Comparison</h3>
              <p>Worst Negative Slack values across blocks and experiments</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.values(blockExperimentData).map((group, index) => (
                  <Line
                    key={`wns-${group.block}-${group.experiment}`}
                    type="monotone"
                    data={group.data}
                    dataKey="wns"
                    stroke={Object.values(COLORS)[index % Object.keys(COLORS).length]}
                    strokeWidth={2}
                    name={`${group.block} - ${group.experiment}`}
                    dot={{ fill: Object.values(COLORS)[index % Object.keys(COLORS).length], strokeWidth: 2, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TNS Comparison */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>TNS (Total Negative Slack) Comparison</h3>
              <p>Total Negative Slack values across blocks and experiments</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.values(blockExperimentData).map((group, index) => (
                  <Line
                    key={`tns-${group.block}-${group.experiment}`}
                    type="monotone"
                    data={group.data}
                    dataKey="tns"
                    stroke={Object.values(COLORS)[index % Object.keys(COLORS).length]}
                    strokeWidth={2}
                    name={`${group.block} - ${group.experiment}`}
                    dot={{ fill: Object.values(COLORS)[index % Object.keys(COLORS).length], strokeWidth: 2, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* NUM Comparison */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>NUM (Number of Violations) Comparison</h3>
              <p>Number of timing violations across blocks and experiments</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.values(blockExperimentData).map((group, index) => (
                  <Line
                    key={`num-${group.block}-${group.experiment}`}
                    type="monotone"
                    data={group.data}
                    dataKey="num"
                    stroke={Object.values(COLORS)[index % Object.keys(COLORS).length]}
                    strokeWidth={2}
                    name={`${group.block} - ${group.experiment}`}
                    dot={{ fill: Object.values(COLORS)[index % Object.keys(COLORS).length], strokeWidth: 2, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Combined Timing Metrics */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Combined Timing Metrics</h3>
              <p>TNS, WNS, and NUM for selected block/experiment</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detailedData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tns"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="TNS"
                />
                <Line
                  type="monotone"
                  dataKey="wns"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  name="WNS"
                />
                <Line
                  type="monotone"
                  dataKey="num"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  name="NUM"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsCharts = () => (
    <div className="charts-grid">
      {/* Success Rate Trends */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Success Rate Trends</h3>
          <p>Monthly success rate trends</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.successRateTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="successRate" 
              stroke={COLORS.success} 
              fill={COLORS.success}
              fillOpacity={0.3}
            />
            <ReferenceLine y={80} stroke={COLORS.warning} strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBlockCharts = () => (
    <div className="charts-grid">
      {/* Block Comparison */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Block Comparison</h3>
          <p>Total runs and success rates by block</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.blockPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="block" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalRuns" fill={COLORS.info} name="Total Runs" />
            <Bar dataKey="successRate" fill={COLORS.success} name="Success Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pd-charts-loading">
        <div className="loading-spinner"></div>
        <p>Loading PD charts...</p>
      </div>
    );
  }

  return (
    <div className="pd-charts">
      <div className="charts-header">
        <h2>PD Data Analytics</h2>
        <p>Comprehensive analysis of Physical Design data</p>
      </div>

      {/* Chart Navigation Tabs */}
      <div className="chart-tabs">
        {chartTabs.map(tab => (
          <button
            key={tab.id}
            className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
            onClick={() => setActiveChart(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {activeChart === 'overview' && renderOverviewCharts()}
        {activeChart === 'performance' && renderPerformanceCharts()}
        {activeChart === 'timing' && renderTimingCharts()}
        {activeChart === 'detailed-timing' && renderDetailedTimingCharts()}
        {activeChart === 'trends' && renderTrendsCharts()}
        {activeChart === 'blocks' && renderBlockCharts()}
      </div>

      {/* Data Summary */}
      <div className="data-summary">
        <div className="summary-card">
          <h4>Total Runs</h4>
          <span className="summary-value">{pdData.length}</span>
        </div>
        <div className="summary-card">
          <h4>Success Rate</h4>
          <span className="summary-value">
            {pdData.length > 0 
              ? Math.round((pdData.filter(item => item.run_status === 'pass').length / pdData.length) * 100)
              : 0}%
          </span>
        </div>
        <div className="summary-card">
          <h4>Avg Runtime</h4>
          <span className="summary-value">
            {pdData.length > 0 
              ? (pdData.reduce((sum, item) => sum + (parseFloat(item.runtime_seconds) || 0), 0) / pdData.length / 3600).toFixed(2)
              : 0} hrs
          </span>
        </div>
        <div className="summary-card">
          <h4>Unique Blocks</h4>
          <span className="summary-value">
            {new Set(pdData.map(item => item.block_name).filter(Boolean)).size}
          </span>
        </div>
        <div className="summary-card">
          <h4>Timing Data</h4>
          <span className="summary-value">
            {(chartData.detailedTiming || []).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PDCharts; 