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
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [viewMode, setViewMode] = useState('hours'); // 'hours' or 'minutes'
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Helper: Parse timestamps from log lines and group by minute and level, filtered by date if selected and by level if filtered
  const getLogsOverTimeMultiSeries = (levelFilter = 'all') => {
    const timeRegex = /^\[(.*?)\]/;
    
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

    // If no date is selected, show all data grouped by date
    if (!selectedDate) {
      // Group logs by date
      let counts = {};
      
      filteredLogs.forEach(log => {
        const match = log.match(timeRegex);
        if (match) {
          const date = dayjs(match[1]).format('YYYY-MM-DD');
          
          // More precise detection logic
          const hasSuccessTrue = /"success":\s*true/i.test(log);
          const hasProcessedSuccess = /processed.*success/i.test(log);
          const hasInsertedSuccess = /inserted.*success/i.test(log);
          const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
          
          // Check for actual errors (including [ERROR] logs)
          const hasErrorTrue = /"error":\s*true/i.test(log);
          const hasException = /exception|fail/i.test(log);
          const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
          const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
          const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
          
          counts[date] = counts[date] || { error: 0, success: 0, total: 0 };
          
          if (isSuccess) {
            counts[date].success++;
            counts[date].total++;
          } else if (isError) {
            counts[date].error++;
            counts[date].total++;
          }
        }
      });
      
      // Prepare data arrays for all dates
      const labels = Object.keys(counts).sort(); // Sort dates chronologically
      return {
        labels: labels.map(l => dayjs(l).format('MM/DD')),
        error: labels.map(date => counts[date].error),
        success: labels.map(date => counts[date].success),
        total: labels.map(date => counts[date].total),
      };
    } else {
      // For selected date, show hours by default, or minutes if a specific hour is selected
      let counts = {};
      
      if (viewMode === 'hours' || !selectedHour) {
        // Initialize counts for each hour of the selected date
        for (let hour = 0; hour < 24; hour++) {
          const hourStr = dayjs(selectedDate).hour(hour).format('YYYY-MM-DD HH');
          counts[hourStr] = { error: 0, success: 0, total: 0 };
        }
        
        // Count logs per hour and level (errors and success)
        filteredLogs.forEach(log => {
          const match = log.match(timeRegex);
          if (match) {
            const hour = dayjs(match[1]).format('YYYY-MM-DD HH');
            
            // More precise detection logic
            const hasSuccessTrue = /"success":\s*true/i.test(log);
            const hasProcessedSuccess = /processed.*success/i.test(log);
            const hasInsertedSuccess = /inserted.*success/i.test(log);
            const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
            
            // Check for actual errors (including [ERROR] logs)
            const hasErrorTrue = /"error":\s*true/i.test(log);
            const hasException = /exception|fail/i.test(log);
            const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
            const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
            const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
            
            counts[hour] = counts[hour] || { error: 0, success: 0, total: 0 };
            
            if (isSuccess) {
              counts[hour].success++;
              counts[hour].total++;
            } else if (isError) {
              counts[hour].error++;
              counts[hour].total++;
            }
          }
        });
        
        // Prepare data arrays for selected date (hours)
        const labels = Object.keys(counts);
        return {
          labels: labels.map(l => dayjs(l).format('HH:00')),
          error: labels.map(hour => counts[hour].error),
          success: labels.map(hour => counts[hour].success),
          total: labels.map(hour => counts[hour].total),
        };
      } else {
        // Show minutes for the selected hour
        const selectedHourStr = dayjs(selectedDate).hour(selectedHour).format('YYYY-MM-DD HH');
        
        // Initialize counts for each minute of the selected hour
        for (let minute = 0; minute < 60; minute++) {
          const minuteStr = dayjs(selectedDate).hour(selectedHour).minute(minute).format('YYYY-MM-DD HH:mm');
          counts[minuteStr] = { error: 0, success: 0, total: 0 };
        }
        
        // Count logs per minute and level for the selected hour
        filteredLogs.forEach(log => {
          const match = log.match(timeRegex);
          if (match) {
            const logHour = dayjs(match[1]).format('YYYY-MM-DD HH');
            if (logHour === selectedHourStr) {
              const minute = dayjs(match[1]).format('YYYY-MM-DD HH:mm');
              
              // More precise detection logic
              const hasSuccessTrue = /"success":\s*true/i.test(log);
              const hasProcessedSuccess = /processed.*success/i.test(log);
              const hasInsertedSuccess = /inserted.*success/i.test(log);
              const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
              
              // Check for actual errors (including [ERROR] logs)
              const hasErrorTrue = /"error":\s*true/i.test(log);
              const hasException = /exception|fail/i.test(log);
              const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
              const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
              const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
              
              counts[minute] = counts[minute] || { error: 0, success: 0, total: 0 };
              
              if (isSuccess) {
                counts[minute].success++;
                counts[minute].total++;
              } else if (isError) {
                counts[minute].error++;
                counts[minute].total++;
              }
            }
          }
        });
        
        // Prepare data arrays for selected hour (minutes)
        const labels = Object.keys(counts);
        return {
          labels: labels.map(l => dayjs(l).format('HH:mm')),
          error: labels.map(minute => counts[minute].error),
          success: labels.map(minute => counts[minute].success),
          total: labels.map(minute => counts[minute].total),
        };
      }
    }
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

  // Helper to get error reasons for a given date
  const getErrorReasonsForDate = (dateLabel) => {
    const timeRegex = /^\[(.*?)\]/;
    // Find logs for the selected date and that are errors
    return logs.filter(log => {
      const match = log.match(timeRegex);
      if (!match) return false;
      // Format log's timestamp to MM/DD to match chart label
      const logDate = dayjs(match[1]).format('MM/DD');
      return logDate === dateLabel && /error|exception|fail/i.test(log);
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
    logsOverTime.error.join(',')
  ]);

  // Update stats when logs change
  useEffect(() => {
    let errorCount = 0;
    logs.forEach(log => {
      // More precise detection logic
      const hasSuccessTrue = /"success":\s*true/i.test(log);
      const hasProcessedSuccess = /processed.*success/i.test(log);
      const hasInsertedSuccess = /inserted.*success/i.test(log);
      const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
      
      // Check for actual errors (including [ERROR] logs)
      const hasErrorTrue = /"error":\s*true/i.test(log);
      const hasException = /exception|fail/i.test(log);
      const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
      const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
      const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
      
      // Only count actual errors, not success messages
      if (!isSuccess && isError) {
        errorCount++;
      }
    });
    setStats(stats => ({
      ...stats,
      totalLogs: errorCount, // Only count actual errors
      errorCount,
      warningCount: 0, // Don't show warning count
      infoCount: 0, // Don't show info count
    }));
  }, [logs]);

  // Real-time log streaming via socket.io
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    // Fetch initial logs from backend (all logs when no date selected)
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        // Get all logs when no date is selected
        const res = await fetch(`http://localhost:5000/api/data/duplicates/logs?limit=10000`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        if (isMounted && data.errors) {
          setLogs(data.errors);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        // Optionally handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Fetch log statistics
    const fetchLogStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/data/duplicates/logs/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch log stats');
        const data = await res.json();
        if (isMounted) {
          setStats(prevStats => ({
            ...prevStats,
            ...data,
            recentActivity: data.recentActivity || []
          }));
          setAvailableDates(data.availableDates || []);
        }
      } catch (err) {
        console.error('Failed to fetch log stats:', err);
      }
    };

    fetchLogs();
    fetchLogStats();

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

  // Fetch logs when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchLogsForDate(selectedDate);
    }
  }, [selectedDate]);

  // Filter logs by level and search (exclude info logs by default)
  const filteredLogs = logs.filter(log => {
    // More precise detection logic
    const hasSuccessTrue = /"success":\s*true/i.test(log);
    const hasProcessedSuccess = /processed.*success/i.test(log);
    const hasInsertedSuccess = /inserted.*success/i.test(log);
    const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
    
    // Check for actual errors (including [ERROR] logs)
    const hasErrorTrue = /"error":\s*true/i.test(log);
    const hasException = /exception|fail/i.test(log);
    const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
    const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
    const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
    
    // Check for warning logs
    const isWarning = /\[warning\]/i.test(log);
    
    // Check for info logs (to exclude them)
    const isInfo = /\[info\]/i.test(log);
    
    // Show all logs except info by default, or filter by type if specified
    if (levelFilter === 'error' && !isError) return false;
    if (levelFilter === 'success' && !isSuccess) return false;
    if (levelFilter === 'warning' && !isWarning) return false;
    if (levelFilter === 'all') {
      // Show all logs except info logs
      if (isInfo) return false;
    }
    
    if (search && !log.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Clear logs function
  const clearLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/data/duplicates/logs/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to clear logs');
      
      // Clear local logs
      setLogs([]);
      setStats(prevStats => ({
        ...prevStats,
        totalLogs: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0
      }));
      
      alert('Logs cleared successfully!');
    } catch (err) {
      console.error('Failed to clear logs:', err);
      alert('Failed to clear logs');
    }
  };

  // Refresh logs function
  const refreshLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Get all logs when no date is selected
      const res = await fetch(`http://localhost:5000/api/data/duplicates/logs?limit=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      if (data.errors) {
        setLogs(data.errors);
      }
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs for specific date
  const fetchLogsForDate = async (date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const res = await fetch(`http://localhost:5000/api/data/duplicates/logs?limit=1000&date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch logs for date');
      const data = await res.json();
      if (data.errors) {
        setLogs(data.errors);
      }
    } catch (err) {
      console.error('Failed to fetch logs for date:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modern UI inspired by Dribbble shot
  return (
    <div className="dashboard-content" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      minHeight: '100vh',
      // Add CSS animation for slide-down effect
      '--slideDown': `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `
    }}>
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 24 }}>System Status Dashboard</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(59,130,246,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Total Errors</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.totalLogs}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(239,68,68,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Errors</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stats.errorCount}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(16,185,129,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Success</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{filteredLogs.filter(log => {
            const hasSuccessTrue = /"success":\s*true/i.test(log);
            const hasProcessedSuccess = /processed.*success/i.test(log);
            const hasInsertedSuccess = /inserted.*success/i.test(log);
            return hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
          }).length}</div>
        </div>
      </div>

      {/* Collapsible Date Filter Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => setShowDateFilter(!showDateFilter)}
          sx={{ 
            fontWeight: 700, 
            borderRadius: 4, 
            textTransform: 'none',
            px: 4,
            py: 2,
            fontSize: 16,
            background: selectedDate 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            '&:hover': {
              background: selectedDate 
                ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                : 'linear-gradient(135deg, #475569 0%, #374151 100%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
          }}
          startIcon={<CalendarMonthIcon sx={{ fontSize: 24 }} />}
          endIcon={
            <span style={{ 
              fontSize: 18, 
              transition: 'transform 0.3s ease',
              transform: showDateFilter ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          }
        >
          {selectedDate 
            ? `Filtered: ${dayjs(selectedDate).format('MMM DD, YYYY')}`
            : 'Show Date Filter'
          }
        </Button>
      </Box>

      {/* Collapsible Date Filter Content */}
      {showDateFilter && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 4,
            border: '2px solid #e2e8f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
            animation: 'slideDown 0.3s ease-out'
          }}>
            {/* Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <CalendarMonthIcon sx={{ color: '#fff', fontSize: 28 }} />
              <Typography sx={{ 
                fontWeight: 800, 
                fontSize: 20, 
                color: '#fff',
                letterSpacing: 0.5
              }}>
                Date Filter
              </Typography>
              <Box sx={{ 
                ml: 'auto',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 2,
                py: 0.5
              }}>
                <Typography sx={{ 
                  fontSize: 14, 
                  color: '#fff', 
                  fontWeight: 600 
                }}>
                  {selectedDate ? 'Filtered' : 'All Data'}
                </Typography>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                alignItems: 'center', 
                flexWrap: 'wrap',
                mb: 3
              }}>
                {/* Date Picker */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    fontSize: 16, 
                    color: '#374151',
                    minWidth: 120
                  }}>
                    Select Date:
                  </Typography>
                  <DatePicker
                    value={selectedDate}
                    onChange={date => setSelectedDate(date)}
                    slotProps={{ 
                      textField: { 
                        size: 'medium',
                        sx: { 
                          minWidth: 200,
                          backgroundColor: '#fff',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(59,130,246,0.1)',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 16px rgba(59,130,246,0.3)'
                            }
                          }
                        },
                        placeholder: 'Choose a date to filter...'
                      } 
                    }}
                    format="YYYY-MM-DD"
                    disableFuture
                  />
                </Box>

                {/* Clear Button */}
                {selectedDate && (
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ 
                      fontWeight: 600, 
                      borderRadius: 3, 
                      textTransform: 'none',
                      px: 3,
                      py: 1.5,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        background: 'rgba(239,68,68,0.1)'
                      }
                    }}
                    onClick={() => setSelectedDate(null)}
                    startIcon={<span style={{ fontSize: 18 }}>✕</span>}
                  >
                    Clear Filter
                  </Button>
                )}

                {/* Show All Data Button */}
                {!selectedDate && (
                  <Button
                    variant="contained"
                    sx={{ 
                      fontWeight: 600, 
                      borderRadius: 3, 
                      textTransform: 'none',
                      px: 3,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 6px 16px rgba(16,185,129,0.4)'
                      }
                    }}
                    startIcon={<span style={{ fontSize: 18 }}>📊</span>}
                  >
                    Showing All Data
                  </Button>
                )}
              </Box>

              {/* Available Dates */}
              {availableDates.length > 0 && (
                <Box sx={{ 
                  mt: 3,
                  p: 3,
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: 3,
                  border: '1px solid #e2e8f0'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: 2
                  }}>
                    <Typography sx={{ 
                      fontSize: 16, 
                      color: '#374151', 
                      fontWeight: 600 
                    }}>
                      Quick Select:
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: 2,
                      px: 2,
                      py: 0.5
                    }}>
                      <Typography sx={{ 
                        fontSize: 14, 
                        color: '#3b82f6', 
                        fontWeight: 600 
                      }}>
                        {availableDates.length} dates available
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    maxWidth: '100%'
                  }}>
                    {availableDates.slice(0, 8).map((date, idx) => (
                      <Button
                        key={date}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontSize: 12,
                          fontWeight: 600,
                          borderColor: '#d1d5db',
                          color: '#475569',
                          textTransform: 'none',
                          minWidth: 'auto',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderColor: '#3b82f6',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                          }
                        }}
                        onClick={() => setSelectedDate(dayjs(date))}
                      >
                        {dayjs(date).format('MMM DD')}
                      </Button>
                    ))}
                    {availableDates.length > 8 && (
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          fontSize: 12,
                          color: '#64748b',
                          textTransform: 'none',
                          '&:hover': {
                            color: '#3b82f6'
                          }
                        }}
                      >
                        +{availableDates.length - 8} more
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </LocalizationProvider>
      )}



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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {viewMode === 'minutes' && selectedHour !== null && (
                <button
                  onClick={() => {
                    setViewMode('hours');
                    setSelectedHour(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  ← Back to Hours
                </button>
              )}
              <div style={{ fontWeight: 800, fontSize: 28, color: '#1e293b', letterSpacing: 1 }}>
                Errors & Success Over Time
                {viewMode === 'minutes' && selectedHour !== null && (
                  <span style={{ fontSize: 20, color: '#64748b', marginLeft: 12 }}>
                    - Hour {selectedHour}:00
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Log Level Filter */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ 
                  fontWeight: 600, 
                  fontSize: 14, 
                  color: '#374151'
                }}>
                  Filter:
                </Typography>
                <select 
                  value={levelFilter} 
                  onChange={e => setLevelFilter(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: '2px solid #d1d5db',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: '#fff',
                    minWidth: 140,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 4px 8px rgba(59,130,246,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <option value="all">All Logs</option>
                  <option value="error">Error Only</option>
                  <option value="success">Success Only</option>
                  <option value="warning">Warning Only</option>
                </select>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={refreshLogs}
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 2, 
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    fontSize: 12,
                    borderWidth: 1.5,
                    borderColor: '#10b981',
                    color: '#10b981',
                    '&:hover': {
                      borderWidth: 1.5,
                      background: 'rgba(16,185,129,0.1)'
                    }
                  }}
                  startIcon={<span style={{ fontSize: 14 }}>🔄</span>}
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={clearLogs}
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 2, 
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    fontSize: 12,
                    borderWidth: 1.5,
                    '&:hover': {
                      borderWidth: 1.5,
                      background: 'rgba(239,68,68,0.1)'
                    }
                  }}
                  startIcon={<span style={{ fontSize: 14 }}>🗑️</span>}
                >
                  Clear
                </Button>
              </Box>

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
                {selectedDate 
                  ? viewMode === 'minutes' && selectedHour !== null
                    ? `Showing minute details for ${dayjs(selectedDate).format('YYYY-MM-DD')} Hour ${selectedHour}:00 (${filteredLogs.length} items)`
                    : `Showing errors & success for ${dayjs(selectedDate).format('YYYY-MM-DD')} (${filteredLogs.length} items) - Click on any hour to see minute details`
                  : `All data from all dates (${filteredLogs.length} total logs) - Select a date to filter`
                }
              </div>
            {/* Peak log rate summary */}
            <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 16 }}>
              {selectedDate 
                ? viewMode === 'minutes' && selectedHour !== null
                  ? `Peak: ${Math.max(...logsOverTime.total, 0)} logs/min`
                  : `Peak: ${Math.max(...logsOverTime.total, 0)} logs/hour`
                : `Peak: ${Math.max(...logsOverTime.total, 0)} logs/day`
              }
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
            {logsOverTime.labels.length > 0 && (logsOverTime.total.some(val => val > 0) || logsOverTime.error.some(val => val > 0) || logsOverTime.success.some(val => val > 0)) ? (
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
                    label: selectedDate 
                      ? (viewMode === 'minutes' ? 'Time (minute)' : 'Time (hour)')
                      : 'Date',
                    tickLabelStyle: { fontSize: 14, fill: '#64748b' },
                    labelStyle: { fontWeight: 700, fill: '#3b82f6' }
                  }]}
                  onAxisClick={(event, data) => {
                    if (selectedDate && viewMode === 'hours' && data && data.value !== undefined) {
                      const hourIndex = data.value;
                      const hour = parseInt(logsOverTime.labels[hourIndex].split(':')[0]);
                      setSelectedHour(hour);
                      setViewMode('minutes');
                    } else if (!selectedDate && data && data.value !== undefined) {
                      // When no date is selected, clicking on a date should select that date
                      const dateIndex = data.value;
                      const dateStr = logsOverTime.labels[dateIndex];
                      const selectedDateObj = dayjs(dateStr, 'MM/DD').year(dayjs().year());
                      setSelectedDate(selectedDateObj);
                    }
                  }}
                                    series={
                    levelFilter === 'all'
                      ? [
                          {
                            data: logsOverTime.success,
                            label: 'Success',
                            color: '#10b981',
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
                        ]
                      : [
                          {
                            data: logsOverTime[levelFilter] || logsOverTime.error || logsOverTime.success || [],
                            label: levelFilter.charAt(0).toUpperCase() + levelFilter.slice(1),
                            color:
                              levelFilter === 'error'
                                ? '#ef4444'
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
                        const label = logsOverTime.labels[idx];
                        let tooltip = selectedDate 
                          ? `Time: ${label}<br/>`
                          : `Date: ${label}<br/>`;
                        
                        if (levelFilter === 'all') {
                          tooltip += `<span style='color:#10b981'>●</span> Success: ${logsOverTime.success[idx]}<br/>`;
                          tooltip += `<span style='color:#ef4444'>●</span> Error: ${logsOverTime.error[idx]}<br/>`;
                        } else if (levelFilter === 'error') {
                          tooltip += `<span style='color:#ef4444'>●</span> Error: ${logsOverTime.error[idx]}<br/>`;
                          // Show error reasons if hovering error point and there are errors
                          if (logsOverTime.error[idx] > 0) {
                            const reasons = selectedDate 
                              ? getErrorReasonsForMinute(label)
                              : getErrorReasonsForDate(label);
                            if (reasons.length > 0) {
                              tooltip += `<div style='margin-top:4px;'><b>Error Reasons:</b><ul style='margin:0;padding-left:16px;'>`;
                              reasons.slice(0, 5).forEach(r => {
                                tooltip += `<li style='font-size:12px;'>${r.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                              });
                              if (reasons.length > 5) tooltip += `<li>...and more</li>`;
                              tooltip += `</ul></div>`;
                            }
                          }
                        } else if (levelFilter === 'success') {
                          tooltip += `<span style='color:#10b981'>●</span> Success: ${logsOverTime.success[idx]}<br/>`;
                        }
                        
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
                  No log data available
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {selectedDate 
                    ? `No logs found for ${dayjs(selectedDate).format('YYYY-MM-DD')}. Try a different date.`
                    : 'No log data available. Logs will appear here when system activity is detected.'
                  }
                </Typography>
              </Box>
            )}
          </div>
        </div>
      </div>



      {/* Real-time Logs Table */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <div style={{ fontWeight: 600, fontSize: 18 }}>Live System Activity</div>
          
          {/* Search Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              fontSize: 14, 
              color: '#374151'
            }}>
              Search:
            </Typography>
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: 6, 
                border: '2px solid #d1d5db',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: '#fff',
                minWidth: 200,
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 4px 8px rgba(59,130,246,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            />
          </Box>
        </div>
        {loading ? <div>Loading logs...</div> : (
          <div style={{ maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 14 }}>
            {filteredLogs.map((log, idx) => {
              // More precise detection logic
              const hasSuccessTrue = /"success":\s*true/i.test(log);
              const hasProcessedSuccess = /processed.*success/i.test(log);
              const hasInsertedSuccess = /inserted.*success/i.test(log);
              const isSuccess = hasSuccessTrue || hasProcessedSuccess || hasInsertedSuccess;
              
              // Check for actual errors (including [ERROR] logs)
              const hasErrorTrue = /"error":\s*true/i.test(log);
              const hasException = /exception|fail/i.test(log);
              const hasErrorCount = /"errors":\s*[1-9]/i.test(log); // errors > 0
              const hasErrorTag = /\[error\]/i.test(log); // Check for [ERROR] tag
              const isError = hasErrorTrue || hasException || hasErrorCount || hasErrorTag;
              
              // Check for info and warning logs
              const isInfo = /\[info\]/i.test(log);
              const isWarning = /\[warning\]/i.test(log);
              
              let textColor = '#374151'; // default color
              let fontWeight = 'normal';
              
              if (isSuccess) {
                textColor = '#10b981'; // green for success
                fontWeight = 'bold';
              } else if (isError) {
                textColor = '#ef4444'; // red for errors
                fontWeight = 'bold';
              } else if (isWarning) {
                textColor = '#f59e0b'; // orange for warnings
                fontWeight = 'bold';
              } else if (isInfo) {
                textColor = '#3b82f6'; // blue for info
                fontWeight = 'normal';
              }
              
              return (
                <div
                  key={idx}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px solid #f1f5f9',
                    color: textColor,
                    fontWeight: fontWeight
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