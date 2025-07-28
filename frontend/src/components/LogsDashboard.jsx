import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import io from 'socket.io-client';

// Placeholder for chart library (e.g., Chart.js or Recharts)
// import { Bar, Pie, Line } from 'react-chartjs-2';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { TextField, Button, Box, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Add a palette for theme colors
const chartColors = ['#3b82f6', '#10b981', '#a21caf', '#f59e42', '#f43f5e'];

const LogsDashboard = ({ user }) => {
  // State for log stats and logs
  const [stats, setStats] = useState({
    totalLogs: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    files: [],
    recentActivity: []
  });
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef(null);
  const socketRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  // Remove selectedMonth

  // Helper: Parse timestamps from log lines and group by minute and level, filtered by date if selected and by level if filtered
  const getLogsOverTimeMultiSeries = (levelFilter = 'all') => {
    const timeRegex = /^\[(.*?)\]/;
    const now = dayjs();
    const lastN = 30;
    // Initialize counts for each minute and level
    let counts = {};
    for (let i = lastN - 1; i >= 0; i--) {
      const minute = now.subtract(i, 'minute').format('YYYY-MM-DD HH:mm');
      counts[minute] = { error: 0, warning: 0, info: 0, total: 0 };
    }
    // Filter logs by date if needed
    let filteredLogs = logs;
    if (selectedDate) {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      filteredLogs = logs.filter(log => {
        const match = log.match(timeRegex);
        if (!match) return false;
        return dayjs(match[1]).format('YYYY-MM-DD') === dateStr;
      });
    }
    // Count logs per minute and level
    filteredLogs.forEach(log => {
      const match = log.match(timeRegex);
      if (match) {
        const minute = dayjs(match[1]).format('YYYY-MM-DD HH:mm');
        let level = 'info';
        if (/error|exception|fail/i.test(log)) level = 'error';
        else if (/warn/i.test(log)) level = 'warning';
        counts[minute] = counts[minute] || { error: 0, warning: 0, info: 0, total: 0 };
        counts[minute][level]++;
        counts[minute].total++;
      }
    });
    // Prepare data arrays
    const labels = Object.keys(counts);
    return {
      labels: labels.map(l => dayjs(l).format('HH:mm')),
      error: labels.map(minute => counts[minute].error),
      warning: labels.map(minute => counts[minute].warning),
      info: labels.map(minute => counts[minute].info),
      total: labels.map(minute => counts[minute].total),
    };
  };
  // Use the filter for the chart
  const logsOverTime = getLogsOverTimeMultiSeries(levelFilter);

  // Helper to get error reasons for a given minute (robust to seconds in log timestamp)
  const getErrorReasonsForMinute = (minuteLabel) => {
    const timeRegex = /^\[(.*?)\]/;
    // Find logs for the selected minute and that are errors
    return logs.filter(log => {
      const match = log.match(timeRegex);
      if (!match) return false;
      // Format log's timestamp to HH:mm to match chart label
      const logMinute = dayjs(match[1]).format('HH:mm');
      return logMinute === minuteLabel && /error|exception|fail/i.test(log);
    });
  };

  // Animation state for fade-in
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(false);
    const timeout = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timeout);
  }, [
    logsOverTime.labels.join(','),
    logsOverTime.total.join(','),
    logsOverTime.error.join(','),
    logsOverTime.warning.join(','),
    logsOverTime.info.join(',')
  ]);

  // Update stats when logs change
  useEffect(() => {
    let errorCount = 0, warningCount = 0, infoCount = 0;
    logs.forEach(log => {
      if (/error|exception|fail/i.test(log)) errorCount++;
      else if (/warn/i.test(log)) warningCount++;
      else infoCount++;
    });
    setStats(stats => ({
      ...stats,
      totalLogs: logs.length,
      errorCount,
      warningCount,
      infoCount,
    }));
  }, [logs]);

  // Real-time log streaming via socket.io
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    // Fetch initial logs from backend
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/data/logs?limit=500', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        if (isMounted && data.errors) {
          setLogs(data.errors.slice(-500));
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();

    // Connect to socket.io server
    socketRef.current = io('http://localhost:5000');
    // On receiving a log line
    socketRef.current.on('log', (line) => {
      setLogs(prevLogs => [...prevLogs, line].slice(-500)); // Keep last 500 logs
      setLoading(false);
    });
    // Clean up on unmount
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-scroll to latest log
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Filter logs by level and search
  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && !log.toLowerCase().includes(levelFilter)) return false;
    if (search && !log.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Modern UI inspired by Dribbble shot
  return (
    <div className="dashboard-content" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh' }}>
      <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 24 }}>Logs & Analytics</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(59,130,246,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Total Logs</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.totalLogs}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(239,68,68,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Errors</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.errorCount}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(251,191,36,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Warnings</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.warningCount}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(16,185,129,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Info</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.infoCount}</div>
        </div>
      </div>

      {/* Filters for date (MUI DatePicker) */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, p: 2, background: '#f8fafc', borderRadius: 2, boxShadow: '0 2px 8px #e0e7ef33', maxWidth: 700, mx: 'auto' }}>
          <CalendarMonthIcon sx={{ color: '#3b82f6', fontSize: 32, mr: 1 }} />
          <Typography sx={{ fontWeight: 600, mr: 1 }}>Filter by Date:</Typography>
          <DatePicker
            value={selectedDate}
            onChange={date => setSelectedDate(date)}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            format="YYYY-MM-DD"
            disableFuture
          />
          {selectedDate && (
            <Button
              variant="outlined"
              color="primary"
              sx={{ ml: 2, fontWeight: 600, borderRadius: 2, textTransform: 'none' }}
              onClick={() => setSelectedDate(null)}
            >
              Clear
            </Button>
          )}
        </Box>
      </LocalizationProvider>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}>
          <option value="all">All Levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #d1d5db', flex: 1 }} />
        <button style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600 }}>Export CSV</button>
        <button style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600 }}>Clear Logs</button>
      </div>

      {/* Graphs (Logs Over Time) - Modern Card */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          maxWidth: 1200,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e8f0 100%)',
          borderRadius: 32,
          padding: 0,
          boxShadow: '0 8px 32px 0 rgba(59,130,246,0.18)',
          border: '2px solid #3b82f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated Gradient Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 80% 20%, #3b82f633 0%, transparent 70%), radial-gradient(circle at 20% 80%, #f59e4266 0%, transparent 70%)',
            zIndex: 0,
            pointerEvents: 'none',
            animation: 'pulseGradient 6s ease-in-out infinite',
          }} />
          {/* Title Row */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '32px 40px 0 40px',
            zIndex: 2,
          }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: '#1e293b', letterSpacing: 1 }}>Logs Over Time</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 12,
                padding: '4px 16px',
                fontSize: 16,
                boxShadow: '0 2px 8px #3b82f633',
                letterSpacing: 1,
              }}>LIVE</span>
            </div>
          </div>
          {/* Subtitle and Peak Info */}
          <div style={{
            width: '100%',
            padding: '0 40px 0 40px',
            marginBottom: 8,
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}>
            <div style={{ color: '#64748b', fontWeight: 500, fontSize: 16 }}>
              {selectedDate ? `Showing logs for ${dayjs(selectedDate).format('YYYY-MM-DD')}` : 'Last 30 minutes (live)'}
            </div>
            {/* Peak log rate summary */}
            <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 16 }}>
              Peak: {Math.max(...logsOverTime.total, 0)} logs/min
            </div>
          </div>
          {/* Chart */}
          <div style={{
            flex: 1,
            width: '100%',
            height: 'calc(100% - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            paddingBottom: 32,
          }}>
            {logsOverTime.labels.length > 0 ? (
              <div style={{
                width: '100%',
                height: '100%',
                transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                opacity: animate ? 1 : 0,
                transform: animate ? 'translateY(0)' : 'translateY(40px)'
              }}>
                <LineChart
                  xAxis={[{
                    data: logsOverTime.labels,
                    scaleType: 'point',
                    label: 'Time (minute)',
                    tickLabelStyle: { fontSize: 14, fill: '#64748b' },
                    labelStyle: { fontWeight: 700, fill: '#3b82f6' }
                  }]}
                  series={
                    levelFilter === 'all'
                      ? [
                          {
                            data: logsOverTime.total,
                            label: 'Total',
                            color: '#2563eb',
                            showMark: false,
                            area: false,
                            curve: 'monotone',
                            strokeWidth: 3,
                          },
                          {
                            data: logsOverTime.error,
                            label: 'Error',
                            color: '#ef4444',
                            showMark: false,
                            area: false,
                            curve: 'monotone',
                            strokeWidth: 3,
                          },
                          {
                            data: logsOverTime.warning,
                            label: 'Warning',
                            color: '#f59e42',
                            showMark: false,
                            area: false,
                            curve: 'monotone',
                            strokeWidth: 3,
                          },
                          {
                            data: logsOverTime.info,
                            label: 'Info',
                            color: '#10b981',
                            showMark: false,
                            area: false,
                            curve: 'monotone',
                            strokeWidth: 3,
                          },
                        ]
                      : [
                          {
                            data: logsOverTime[levelFilter],
                            label: levelFilter.charAt(0).toUpperCase() + levelFilter.slice(1),
                            color:
                              levelFilter === 'error'
                                ? '#ef4444'
                                : levelFilter === 'warning'
                                ? '#f59e42'
                                : '#10b981',
                            showMark: false,
                            area: false,
                            curve: 'monotone',
                            strokeWidth: 3,
                          },
                        ]
                  }
                  width={window.innerWidth > 1200 ? 1100 : window.innerWidth - 80}
                  height={window.innerHeight > 600 ? 420 : 280}
                  margin={{ left: 80, right: 40, top: 40, bottom: 60 }}
                  grid={{ vertical: true, horizontal: true }}
                  slotProps={{
                    legend: { hidden: false, position: 'top' },
                    tooltip: {
                      trigger: 'item',
                      formatter: (params) => {
                        if (!params || typeof params.value === 'undefined') return '';
                        const idx = params.dataIndex;
                        const minuteLabel = logsOverTime.labels[idx];
                        let tooltip = `Time: ${minuteLabel}<br/>`;
                        if (levelFilter === 'all' || levelFilter === 'error') {
                          tooltip += `<span style='color:#ef4444'>●</span> Error: ${logsOverTime.error[idx]}<br/>`;
                          // Show error reasons if hovering error point and there are errors
                          if (
                            (levelFilter === 'error' || (params.seriesLabel && params.seriesLabel.toLowerCase() === 'error')) &&
                            logsOverTime.error[idx] > 0
                          ) {
                            const reasons = getErrorReasonsForMinute(minuteLabel);
                            if (reasons.length > 0) {
                              tooltip += `<div style='margin-top:4px;'><b>Error Reasons:</b><ul style='margin:0;padding-left:16px;'>`;
                              reasons.slice(0, 5).forEach(r => {
                                tooltip += `<li style='font-size:12px;'>${r.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                              });
                              if (reasons.length > 5) tooltip += `<li>...and more</li>`;
                              tooltip += `</ul></div>`;
                            }
                          }
                        }
                        if (levelFilter === 'all' || levelFilter === 'warning')
                          tooltip += `<span style='color:#f59e42'>●</span> Warning: ${logsOverTime.warning[idx]}<br/>`;
                        if (levelFilter === 'all' || levelFilter === 'info')
                          tooltip += `<span style='color:#10b981'>●</span> Info: ${logsOverTime.info[idx]}<br/>`;
                        if (levelFilter === 'all')
                          tooltip = `<span style='color:#2563eb'>●</span> Total: ${logsOverTime.total[idx]}<br/>` + tooltip;
                        return tooltip;
                      }
                    }
                  }}
                  sx={{
                    '.MuiLineElement-root': { filter: 'drop-shadow(0 2px 8px #2563eb22)', transition: 'd 0.8s cubic-bezier(0.4,0,0.2,1)' },
                    '.MuiMarkElement-root': { transition: 'cx 0.8s, cy 0.8s' },
                  }}
                />
              </div>
            ) : (
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(248,250,252,0.8)',
                borderRadius: 4,
                boxShadow: '0 2px 8px #e0e7ef33',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2
              }}>
                <CalendarMonthIcon sx={{ color: '#f59e42', fontSize: 60, mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                  No log data for the selected date or month
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Try a different date or clear the filter.
                </Typography>
              </Box>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 32 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Recent Activity</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {stats.recentActivity.map((act, idx) => (
            <li key={idx} style={{ marginBottom: 12, color: act.level === 'error' ? '#ef4444' : act.level === 'warning' ? '#f59e42' : '#10b981' }}>
              <span style={{ fontWeight: 600 }}>{act.level.toUpperCase()}</span> - {act.message} <span style={{ color: '#64748b', fontSize: 12 }}>({act.file}, {new Date(act.timestamp).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Real-time Logs Table */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Live Logs</div>
        {loading ? <div>Loading logs...</div> : (
          <div style={{ maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 14 }}>
            {filteredLogs.map((log, idx) => {
              const isError = /error|exception|fail/i.test(log);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px solid #f1f5f9',
                    color: isError ? '#ef4444' : undefined,
                    fontWeight: isError ? 700 : undefined
                  }}
                >
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsDashboard; 