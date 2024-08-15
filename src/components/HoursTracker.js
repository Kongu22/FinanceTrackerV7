// src/components/HoursTracker.js
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import dayjs from 'dayjs';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useLanguage } from './LanguageContext';
import { useTheme } from '@mui/material/styles';

const HoursTracker = () => {
  const { currentTranslations } = useLanguage();
  const theme = useTheme();

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakTime, setBreakTime] = useState(0); // Break time in minutes
  const [hourlyRate, setHourlyRate] = useState(60); // Default hourly rate
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [monthlySummaryOpen, setMonthlySummaryOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    const savedEntries = localStorage.getItem('hoursEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('hoursEntries', JSON.stringify(entries));
    }
  }, [entries]);

  const calculateHoursWorked = (start, end, breakTime) => {
    const startTime = dayjs(start);
    const endTime = dayjs(end);
    const diffInHours = endTime.diff(startTime, 'hour', true);
    const breakInHours = breakTime / 60;
    const totalHoursWorked = diffInHours - breakInHours;
    return totalHoursWorked > 0 ? totalHoursWorked : 0;
  };

  const calculateSalary = (hoursWorked, hourlyRate) => {
    let regularHours = Math.min(hoursWorked, 8); // 8 hours at 100%
    let overtimeHours = Math.max(0, hoursWorked - 8); // After 8 hours
    let overtimeRate = 1.25; // Next 2 hours at 125%
    let extraOvertimeRate = 1.5; // Next 2 hours at 150%

    // Overtime for first 2 hours at 125%, next 2 at 150%
    let overtime1 = Math.min(overtimeHours, 2); // First 2 overtime hours
    let overtime2 = Math.max(0, Math.min(overtimeHours - 2, 2)); // Next 2 hours at 150%
    let remainingOvertime = Math.max(0, overtimeHours - 4); // Remaining overtime after 4 hours

    // Salary calculation
    const regularSalary = regularHours * hourlyRate;
    const overtimeSalary1 = overtime1 * hourlyRate * overtimeRate;
    const overtimeSalary2 = overtime2 * hourlyRate * extraOvertimeRate;
    const extraOvertimeSalary = remainingOvertime * hourlyRate * extraOvertimeRate;

    return regularSalary + overtimeSalary1 + overtimeSalary2 + extraOvertimeSalary;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!startTime || !endTime) {
      toast.error(currentTranslations.pleaseFillRequiredFields);
      return;
    }

    const hoursWorked = calculateHoursWorked(`${dayjs().format('YYYY-MM-DD')}T${startTime}`, `${dayjs().format('YYYY-MM-DD')}T${endTime}`, breakTime);
    if (hoursWorked <= 0) {
      toast.error(currentTranslations.invalidHours);
      return;
    }

    const totalSalary = calculateSalary(hoursWorked, hourlyRate);

    if (editingId !== null) {
      const updatedEntries = entries.map((entry) =>
        entry.id === editingId
          ? { id: editingId, date: dayjs().format('YYYY-MM-DD'), startTime, endTime, breakTime, hoursWorked, totalSalary, hourlyRate }
          : entry
      );
      setEntries(updatedEntries);
      toast.success(currentTranslations.entryUpdated);
    } else {
      const newEntry = {
        id: entries.length + 1,
        date: dayjs().format('YYYY-MM-DD'), // Automatically set the date when adding an entry
        startTime,
        endTime,
        breakTime,
        hoursWorked,
        totalSalary,
        hourlyRate,
      };
      setEntries([...entries, newEntry]);
      toast.success(currentTranslations.entryAdded);
    }

    // Reset form fields
    setStartTime('');
    setEndTime('');
    setBreakTime(0); // Reset break time
    setHourlyRate(60); // Reset to default hourly rate
    setEditingId(null);
  };

  const handleEdit = (entry) => {
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setBreakTime(entry.breakTime);
    setHourlyRate(entry.hourlyRate);
    setEditingId(entry.id);
  };

  const handleDelete = (id) => {
    if (window.confirm(currentTranslations.deleteEntryConfirmation)) {
      const updatedEntries = entries.filter((entry) => entry.id !== id);
      setEntries(updatedEntries);
      toast.info(currentTranslations.entryDeleted);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setStartTime('');
    setEndTime('');
    setBreakTime(0); // Reset break time
    setHourlyRate(60); // Reset to default hourly rate
  };

  const handleOpenClearDialog = () => {
    setClearDialogOpen(true);
  };

  const handleCloseClearDialog = () => {
    setClearDialogOpen(false);
  };

  const handleClearAllData = () => {
    setEntries([]);
    localStorage.removeItem('hoursEntries');
    toast.info(currentTranslations.allDataCleared);
    handleCloseClearDialog();
  };

  const getMonthlySummary = () => {
    const summary = {};

    for (let month = 0; month < 12; month++) {
      const monthKey = dayjs().month(month).format('MMMM');
      summary[monthKey] = { hoursWorked: 0, totalSalary: 0 };
    }

    entries.forEach((entry) => {
      const month = dayjs(entry.date).format('MMMM');
      if (summary[month]) {
        summary[month].hoursWorked += entry.hoursWorked;
        summary[month].totalSalary += entry.totalSalary;
      }
    });

    return summary;
  };

  const monthlySummary = getMonthlySummary();

  const handleOpenMonthlySummary = () => {
    setMonthlySummaryOpen(true);
  };

  const handleCloseMonthlySummary = () => {
    setMonthlySummaryOpen(false);
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {currentTranslations.hoursTracker}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label={currentTranslations.startTime}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label={currentTranslations.endTime}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label={currentTranslations.breakTime}
                type="number"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText={currentTranslations.breakTimeHelperText} // Helper text (e.g., in minutes)
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label={currentTranslations.hourlyRate}
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color={editingId !== null ? 'secondary' : 'primary'}
                type="submit"
                fullWidth
              >
                {editingId !== null ? currentTranslations.updateEntry : currentTranslations.addEntry}
              </Button>
              {editingId !== null && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancelEdit}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {currentTranslations.cancelEdit}
                </Button>
              )}
            </Grid>
          </Grid>
        </form>

        {/* Scrollable Work Hours Summary */}
        <Box mt={4}>
          <Typography variant="h6">{currentTranslations.workHoursSummary}</Typography>
          {entries.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 300, // Limit height to 300px
                overflowY: 'auto', // Enable vertical scrolling
                boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)', // Add some box shadow for styling
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>{currentTranslations.date}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.startTime}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.endTime}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.breakTime}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.hoursWorked}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.totalSalary}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.actions}</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.startTime}</TableCell>
                      <TableCell>{entry.endTime}</TableCell>
                      <TableCell>{entry.breakTime} min</TableCell>
                      <TableCell>{entry.hoursWorked.toFixed(2)}</TableCell>
                      <TableCell>₪{entry.totalSalary.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleEdit(entry)}>
                          <FaEdit />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(entry.id)}>
                          <FaTrash />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>{currentTranslations.noHoursTracked}</Typography>
          )}
        </Box>

        <Box mt={4}>
          <Button
            variant="outlined"
            sx={{
              color: theme.palette.text.primary,
              minWidth: 150,
              fontSize: '1rem',
              borderColor: theme.palette.divider,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.text.secondary,
              },
              boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={handleOpenMonthlySummary}
          >
            {currentTranslations.viewMonthlySummary}
          </Button>
        </Box>

        <Box mt={2}>
          <Button
            variant="contained"
            color="error"
            sx={{
              color: '#fff',
              minWidth: 150,
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
              },
              boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={handleOpenClearDialog}
          >
            {currentTranslations.removeAllData}
          </Button>
        </Box>

        <Dialog open={monthlySummaryOpen} onClose={handleCloseMonthlySummary}>
          <DialogTitle>{currentTranslations.monthlySummary}</DialogTitle>
          <DialogContent dividers>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>{currentTranslations.month}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.totalHoursWorked}</strong></TableCell>
                    <TableCell><strong>{currentTranslations.totalSalary}</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(monthlySummary).map(([month, data]) => (
                    <TableRow key={month}>
                      <TableCell>{month}</TableCell>
                      <TableCell>{data.hoursWorked.toFixed(2)}</TableCell>
                      <TableCell>₪ {data.totalSalary.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMonthlySummary} color="primary">
              {currentTranslations.close}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={clearDialogOpen} onClose={handleCloseClearDialog}>
          <DialogTitle>{currentTranslations.removeAllData}</DialogTitle>
          <DialogContent dividers>
            <Typography>
              {currentTranslations.deleteEntryConfirmation}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseClearDialog} color="primary">
              {currentTranslations.cancelEdit}
            </Button>
            <Button onClick={handleClearAllData} color="error">
              {currentTranslations.removeAllData}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default HoursTracker;
