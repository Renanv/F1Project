import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import PersonIcon from '@mui/icons-material/Person';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import NotesIcon from '@mui/icons-material/Notes';
import EventIcon from '@mui/icons-material/Event';
import PolicyIcon from '@mui/icons-material/Policy';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import axiosInstance from '../../utils/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import SubmitJudgmentForm from './SubmitJudgmentForm';
import { getJudgmentDisplay } from '../../utils/penaltyUtils'; // Import the new utility

// Helper from PenaltiesListPage for status chip - consider moving to a shared utils file
const getStatusChip = (status) => {
  let color = 'default';
  let labelId = `penalty-status-${status.toLowerCase().replace(/_/g, '-')}`;
  let fallback = status.replace(/_/g, ' ');
  let icon = <HourglassEmptyIcon />;

  switch (status) {
    case 'PENDING_REVIEW':
      color = 'warning';
      break;
    case 'UNDER_JURY_REVIEW':
      color = 'info';
      break;
    case 'AWAITING_FINAL_DECISION':
      color = 'secondary';
      icon = <GavelIcon />;
      break;
    case 'CLOSED_APPROVED':
      color = 'success';
      icon = <CheckCircleOutlineIcon />;
      break;
    case 'CLOSED_REJECTED':
      color = 'error';
      icon = <HighlightOffIcon />;
      break;
    case 'CLOSED_NO_ACTION':
      color = 'default';
      icon = <CheckCircleOutlineIcon />;
      break;
    default:
      break;
  }
  return <Chip icon={icon} label={<Localized id={labelId} fallback={fallback} />} color={color} />;
};

// Options for Admin's Final Outcome and Juror's initial Judgment Display (though jurors will use a restricted set for submission)
const baseJudgmentOptions = {
    'SP': { labelId: 'judgment-option-sp', fallback: 'Stop and Go Penalty (SP)' },
    'L': { labelId: 'judgment-option-l', fallback: 'Light Penalty (L)' },
    'M': { labelId: 'judgment-option-m', fallback: 'Medium Penalty (M)' },
    'G': { labelId: 'judgment-option-g', fallback: 'Grid Penalty (G)' },
    // 'NO_ACTION' is removed from admin final outcome choice, but kept for displaying juror votes if they had it previously.
    // And for the status 'CLOSED_NO_ACTION' which is different from a penalty type.
    // 'NO_PENALTY' can be added here if admins can select it, or just rely on getJudgmentDisplay from utils
};

// --- Final Decision Form Component ---
function FinalDecisionForm({ penaltyId, currentPenaltyStatus, onDecisionSuccess }) {
    const [newStatus, setNewStatus] = useState(currentPenaltyStatus);
    const [finalOutcome, setFinalOutcome] = useState('');
    const [finalReason, setFinalReason] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        // Pre-fill status if already closed, or default to a sensible next step
        if (currentPenaltyStatus.startsWith('CLOSED_')) {
            setNewStatus(currentPenaltyStatus);
        } else if (currentPenaltyStatus === 'UNDER_JURY_REVIEW') {
            // Suggest moving to AWAITING_FINAL_DECISION or directly to a CLOSED state
            // For simplicity, let admin choose; could pre-select AWAITING_FINAL_DECISION
        }
        // Reset outcome/reason if status changes away from a closed one
        if (!newStatus.startsWith('CLOSED_')) {
            setFinalOutcome('');
            setFinalReason('');
        }
    }, [currentPenaltyStatus, newStatus]);

    const decisionMutation = useMutation({
        mutationFn: (decisionData) => axiosInstance.put(`/api/admin/penalties/${penaltyId}/decision`, decisionData),
        onSuccess: () => {
            setFormError('');
            onDecisionSuccess(); // Callback to refetch and show feedback
        },
        onError: (error) => {
            setFormError(error.response?.data?.message || 'Failed to update penalty decision.');
        }
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        setFormError('');
        if (!newStatus) {
            setFormError('A new status must be selected.');
            return;
        }
        if (newStatus.startsWith('CLOSED_') && !finalOutcome) {
            setFormError('Final outcome is required when closing a penalty.');
            return;
        }
        decisionMutation.mutate({ 
            status: newStatus, 
            finalOutcome: newStatus.startsWith('CLOSED_') ? finalOutcome : null,
            finalReason: newStatus.startsWith('CLOSED_') ? finalReason : null 
        });
    };

    const availableStatuses = [
        // Allow setting to AWAITING_FINAL_DECISION if currently under jury review
        ...(currentPenaltyStatus === 'UNDER_JURY_REVIEW' || currentPenaltyStatus === 'PENDING_REVIEW' ? [{ value: 'AWAITING_FINAL_DECISION', labelId: 'penalty-status-awaiting-final-decision', fallback: 'Awaiting Final Decision' }] : []),
        { value: 'CLOSED_APPROVED', labelId: 'penalty-status-closed-approved', fallback: 'Close - Approved' },
        { value: 'CLOSED_REJECTED', labelId: 'penalty-status-closed-rejected', fallback: 'Close - Rejected' },
        { value: 'CLOSED_NO_ACTION', labelId: 'penalty-status-closed-no-action', fallback: 'Close - No Action' },
        // Optionally allow reverting from a closed state if business logic permits, for now, focusing on progression
    ];
    // If current status is already one of these, ensure it's in the list for selection
    if (!availableStatuses.find(s => s.value === currentPenaltyStatus) && 
        ['AWAITING_FINAL_DECISION', 'CLOSED_APPROVED', 'CLOSED_REJECTED', 'CLOSED_NO_ACTION'].includes(currentPenaltyStatus)) {
        const currentStatusOption = [
            { value: 'AWAITING_FINAL_DECISION', labelId: 'penalty-status-awaiting-final-decision', fallback: 'Awaiting Final Decision' },
            { value: 'CLOSED_APPROVED', labelId: 'penalty-status-closed-approved', fallback: 'Close - Approved' },
            { value: 'CLOSED_REJECTED', labelId: 'penalty-status-closed-rejected', fallback: 'Close - Rejected' },
            { value: 'CLOSED_NO_ACTION', labelId: 'penalty-status-closed-no-action', fallback: 'Close - No Action' },
        ].find(s => s.value === currentPenaltyStatus);
        if(currentStatusOption) availableStatuses.unshift(currentStatusOption);
    }

    const outcomeOptions = Object.keys(baseJudgmentOptions).map(key => ({
        value: key,
        labelId: baseJudgmentOptions[key].labelId,
        fallback: baseJudgmentOptions[key].fallback
    }));

    // Admins can make decisions at almost any stage, but typically after review or jury.
    // We don't strictly limit form visibility here, but rely on admin judgment.
    // The backend will enforce if a status transition is valid (e.g., jurors voted before AWAITING_FINAL_DECISION).

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom><Localized id="admin-final-decision-title" fallback="Make Final Decision" /></Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel id="new-status-select-label"><Localized id="new-penalty-status-label" fallback="New Status" /></InputLabel>
                        <Select
                            labelId="new-status-select-label"
                            value={newStatus}
                            label={<Localized id="new-penalty-status-label" fallback="New Status" />}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            {availableStatuses.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    <Localized id={opt.labelId} fallback={opt.fallback} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {newStatus.startsWith('CLOSED_') && (
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel id="final-outcome-select-label"><Localized id="final-outcome-label" fallback="Final Outcome" /></InputLabel>
                            <Select
                                labelId="final-outcome-select-label"
                                value={finalOutcome}
                                label={<Localized id="final-outcome-label" fallback="Final Outcome" />}
                                onChange={(e) => setFinalOutcome(e.target.value)}
                            >
                                {outcomeOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Localized id={opt.labelId} fallback={opt.fallback} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
                {newStatus.startsWith('CLOSED_') && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={<Localized id="final-reason-label" fallback="Final Reason (Optional)" />}
                            value={finalReason}
                            onChange={(e) => setFinalReason(e.target.value)}
                            multiline
                            rows={3}
                        />
                    </Grid>
                )}
            </Grid>

            {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
            
            <Button 
                type="submit" 
                variant="contained" 
                color="secondary" // Different color to distinguish from jury assignment
                sx={{ mt: 2 }} 
                disabled={decisionMutation.isLoading}
            >
                {decisionMutation.isLoading ? <CircularProgress size={24}/> : <Localized id="submit-decision-button" fallback="Submit Decision" />}
            </Button>
        </Box>
    );
}
// --- End Final Decision Form Component ---

// --- Jury Assignment Form Component ---
function AssignJuryForm({ penaltyId, currentStatus, onAssignmentSuccess }) {
    const [c1UserId, setC1UserId] = useState('');
    const [c2UserId, setC2UserId] = useState('');
    const [c3UserId, setC3UserId] = useState('');
    const [formError, setFormError] = useState('');

    const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
        queryKey: ['allUsersForJuryAssignment'],
        queryFn: async () => {
            const response = await axiosInstance.get('/api/users'); // Assuming /api/users lists all users {id, username, usertag}
            return response.data;
        },
    });

    const assignJuryMutation = useMutation({
        mutationFn: (juryData) => axiosInstance.post(`/api/admin/penalties/${penaltyId}/assign-jury`, juryData),
        onSuccess: () => {
            setFormError('');
            onAssignmentSuccess(); // Callback to refetch penalty details and show success message
            // Reset form
            setC1UserId('');
            setC2UserId('');
            setC3UserId('');
        },
        onError: (error) => {
            setFormError(error.response?.data?.message || 'Failed to assign jury. Ensure all jurors are distinct and valid.');
        }
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        setFormError('');
        if (!c1UserId || !c2UserId || !c3UserId) {
            setFormError('All three juror slots must be filled.');
            return;
        }
        if (new Set([c1UserId, c2UserId, c3UserId]).size !== 3) {
            setFormError('Jurors must be distinct for each slot.');
            return;
        }
        assignJuryMutation.mutate({ c1UserId, c2UserId, c3UserId });
    };

    if (!['PENDING_REVIEW', 'UNDER_JURY_REVIEW'].includes(currentStatus)) {
        return null; // Don't show form if status is not suitable
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom><Localized id="assign-jury-title" fallback="Assign Jury Panel" /></Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{mb: 1}}>
                <Localized id="assign-jury-race-wide-note" fallback="Note: Assigning a jury here will apply to all applicable penalties submitted for this race." />
            </Typography>
            {isLoadingUsers && <CircularProgress size={24} />}
            {usersError && <Alert severity="error" sx={{mb:1}}><Localized id="fetch-users-error"/></Alert>}
            
            {!isLoadingUsers && !usersError && (
                <Grid container spacing={2}>
                    {[ {value: c1UserId, setter: setC1UserId, labelId: "juror-c1-label", fallback: "Juror C1"},
                       {value: c2UserId, setter: setC2UserId, labelId: "juror-c2-label", fallback: "Juror C2"},
                       {value: c3UserId, setter: setC3UserId, labelId: "juror-c3-label", fallback: "Juror C3"}].map(jurorSlot => (
                        <Grid item xs={12} sm={4} key={jurorSlot.labelId}>
                            <FormControl fullWidth required error={formError.includes('filled') || formError.includes('distinct')}>
                                <InputLabel id={`${jurorSlot.labelId}-select`}><Localized id={jurorSlot.labelId} fallback={jurorSlot.fallback}/></InputLabel>
                                <Select
                                    labelId={`${jurorSlot.labelId}-select`}
                                    value={jurorSlot.value}
                                    label={<Localized id={jurorSlot.labelId} fallback={jurorSlot.fallback}/>}
                                    onChange={(e) => jurorSlot.setter(e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em><Localized id="select-juror-placeholder" fallback="Select a Juror" /></em>
                                    </MenuItem>
                                    {users.map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.usertag || user.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ))}
                </Grid>
            )}

            {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
            
            <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }} 
                disabled={isLoadingUsers || assignJuryMutation.isLoading || users.length === 0}
            >
                {assignJuryMutation.isLoading ? <CircularProgress size={24}/> : <Localized id="assign-jury-button" fallback="Assign/Update Jury" />}
            </Button>
        </Box>
    );
}
// --- End Jury Assignment Form Component ---

export default function PenaltyDetailPage() {
  const { penaltyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // For refetching after mutation
  const [currentUser, setCurrentUser] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' }); // For success/error messages from actions

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        setCurrentUser(jwtDecode(token));
      } catch (e) {
        console.error("Failed to decode token for user context", e);
      }
    }
  }, []);

  const {
    data: penaltyDetails,
    isLoading,
    error,
    refetch: refetchPenaltyDetails 
  } = useQuery({
    queryKey: ['penaltyDetails', penaltyId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/penalties/${penaltyId}`);
      return response.data.data;
    },
    enabled: !!penaltyId,
  });

  const handleAssignmentSuccess = () => {
    setActionFeedback({ type: 'success', message: 'Jury assigned successfully! Penalty details updated.' });
    refetchPenaltyDetails();
    queryClient.invalidateQueries(['adminPenalties']); // Invalidate admin list if it exists
    queryClient.invalidateQueries(['penalties']); // Invalidate general penalties list
    setTimeout(() => setActionFeedback({type:'', message:''}), 4000); // Clear feedback after a delay
};

  const handleDecisionSuccess = () => {
    setActionFeedback({ type: 'success', message: 'Final decision recorded! Penalty details updated.'});
    refetchPenaltyDetails();
    queryClient.invalidateQueries(['adminPenalties']);
    queryClient.invalidateQueries(['penalties']); // Also invalidate general user list
    setTimeout(() => setActionFeedback({type:'', message:''}), 4000);
  };

  const handleJudgmentSubmissionSuccess = (message) => {
    setActionFeedback({ type: 'success', message: message || 'Judgment submitted successfully! Details updated.' });
    refetchPenaltyDetails(); // Refetch to update jury assignment status and potentially judgments list
    queryClient.invalidateQueries(['penalties']); // Invalidate general penalties list
    // MyJuryTasksPage will be invalidated by the form itself (via ['assignedPenalties']).
    setTimeout(() => setActionFeedback({type:'', message:''}), 5000);
  };

  if (isLoading || !currentUser) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    let errorMessageId = 'fetch-penalty-detail-error';
    if (error.response?.status === 403) {
        errorMessageId = 'penalty-detail-forbidden';
    } else if (error.response?.status === 404) {
        errorMessageId = 'penalty-detail-not-found';
    }
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          <Localized id={errorMessageId} fallback={error.response?.data?.message || 'Error loading penalty details.'} />
        </Alert>
         <Button onClick={() => navigate('/penalties')} sx={{mt: 2}}><Localized id="back-to-list-button" fallback="Back to List"/></Button>
      </Container>
    );
  }

  if (!penaltyDetails) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info"><Localized id="penalty-detail-no-data" fallback="No details available for this penalty." /></Alert>
        <Button onClick={() => navigate('/penalties')} sx={{mt: 2}}><Localized id="back-to-list-button" fallback="Back to List"/></Button>
      </Container>
    );
  }

  const {
    championship_name,
    race_title,
    submitter_usertag,
    accused_usertag,
    video_link,
    video_timestamp,
    considerations,
    submission_timestamp,
    status,
    final_outcome,
    final_reason,
    juryAssignments = [],
    judgments = []
  } = penaltyDetails;

  const isAdmin = currentUser.isAdmin; // More direct usage
  const isUserInvolved = currentUser.userId === penaltyDetails.submitted_by_user_id || currentUser.userId === penaltyDetails.accused_user_id;
  const currentUserJuryAssignment = juryAssignments.find(ja => ja.jury_user_id === currentUser.userId);
  const isUserAnActiveJurorForThisPenalty = currentUserJuryAssignment && 
                                          currentUserJuryAssignment.judgment_status === 'PENDING_JUDGMENT' && 
                                          status === 'UNDER_JURY_REVIEW';
  
  const canViewJuryPanelList = isAdmin || !!currentUserJuryAssignment; 

  const canViewJudgments = true; // All authenticated users can now see judgments if available.

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Localized id="penalty-detail-title" vars={{ penaltyId }} fallback={`Penalty Details #${penaltyId}`} />
        </Typography>

        {actionFeedback.message && (
            <Alert severity={actionFeedback.type || 'info'} sx={{ mb: 2 }}>
                {actionFeedback.message}
            </Alert>
        )}

        {currentUser.isAdmin && (
            <Accordion sx={{ mb: 3, border: '1px solid', borderColor: 'primary.main'}} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="admin-actions-content" id="admin-actions-header">
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <AdminPanelSettingsIcon sx={{mr:1}} />
                        <Typography variant="h6"><Localized id="admin-actions-header" fallback="Admin Actions" /></Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AssignJuryForm 
                        penaltyId={penaltyId} 
                        currentStatus={status} 
                        onAssignmentSuccess={handleAssignmentSuccess} 
                    />
                    <Divider variant="middle" sx={{my:1}}><Localized id="admin-or-divider" fallback="OR" /></Divider>
                    <FinalDecisionForm 
                        penaltyId={penaltyId} 
                        currentPenaltyStatus={status}
                        onDecisionSuccess={handleDecisionSuccess}
                    />
                </AccordionDetails>
            </Accordion>
        )}

        {isUserAnActiveJurorForThisPenalty && (
          <Box sx={{ my: 3 }}>
            <SubmitJudgmentForm 
              penaltyId={penaltyId} 
              assignedSlot={currentUserJuryAssignment.jury_slot}
              currentAccusedUserTag={accused_usertag}
              onJudgmentSubmitted={handleJudgmentSubmissionSuccess}
            />
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Main Details */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom><Localized id="penalty-general-info" fallback="General Information"/></Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon><SportsScoreIcon /></ListItemIcon>
                        <ListItemText primary={<Localized id="championship-label" fallback="Championship" />} secondary={championship_name || 'N/A'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><EventIcon /></ListItemIcon>
                        <ListItemText primary={<Localized id="race-label" fallback="Race" />} secondary={race_title || 'N/A'} />
                    </ListItem>
                     <ListItem>
                        <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={<Localized id="penalty-submitted-by" fallback="Submitted By" />} secondary={submitter_usertag || 'N/A'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><PersonIcon color="error" /></ListItemIcon>
                        <ListItemText primary={<Localized id="penalty-accused-user" fallback="Accused User" />} secondary={accused_usertag || 'N/A'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><EventIcon /></ListItemIcon>
                        <ListItemText primary={<Localized id="penalty-submitted-at" fallback="Submitted At" />} secondary={(() => {
                            const date = new Date(submission_timestamp);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                          })()} />
                    </ListItem>
                </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom><Localized id="penalty-evidence" fallback="Evidence & Description"/></Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon><VideoLibraryIcon /></ListItemIcon>
                        <ListItemText 
                            primary={<Localized id="video-link-label" fallback="Video Link" />}
                            secondary={video_link ? <Link href={video_link} target="_blank" rel="noopener noreferrer">{video_link}</Link> : 'N/A'} 
                        />
                    </ListItem>
                    {video_timestamp && (
                         <ListItem>
                            <ListItemIcon sx={{opacity: 0.5}}><VideoLibraryIcon /></ListItemIcon>
                            <ListItemText primary={<Localized id="video-timestamp-label" fallback="Video Timestamp" />} secondary={video_timestamp} />
                        </ListItem>
                    )}
                    <ListItem>
                        <ListItemIcon><NotesIcon /></ListItemIcon>
                        <ListItemText 
                            primary={<Localized id="considerations-label" fallback="Considerations" />} 
                            secondary={considerations || 'N/A'} 
                            secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap'} }}
                        />
                    </ListItem>
                </List>
            </Box>
          </Grid>

          {/* Right Column: Status, Jury, Outcome */}
          <Grid item xs={12} md={5}>
             <Box sx={{ mb: 3, textAlign: {xs: 'left', md: 'right'} }}>
                <Typography variant="h6" sx={{mb:1}}><Localized id="penalty-current-status" fallback="Current Status"/></Typography>
                {getStatusChip(status)}
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* Conditionally render the entire Jury Panel section */}
            {canViewJuryPanelList && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom><Localized id="penalty-jury-assignments" fallback="Jury Panel"/></Typography>
                    {juryAssignments.length > 0 ? (
                        <List dense>
                            {juryAssignments.map(ja => {
                                const isCurrentUserJurorInPanel = currentUser.userId === ja.jury_user_id;
                                let displayNameInPanel;

                                if (ja.jury_slot === 'C2') {
                                    // Special handling for C2 slot
                                    if (isAdmin || isCurrentUserJurorInPanel) {
                                        displayNameInPanel = ja.juror_usertag || 'Unknown Juror';
                                    } else {
                                        displayNameInPanel = <Localized id="anonymous-juror-display" fallback="Anonymous Juror (C2)"/>;
                                    }
                                } else {
                                    // For C1 and C3, always show the actual juror's name
                                    displayNameInPanel = ja.juror_usertag || 'Unknown Juror';
                                }

                                return (
                                    <ListItem key={ja.id}>
                                        <ListItemIcon><GavelIcon /></ListItemIcon>
                                        <ListItemText 
                                            primary={<>{ja.jury_slot}: {displayNameInPanel}</>}
                                            secondary={<Localized id={`jury-judgment-status-${ja.judgment_status.toLowerCase()}`} fallback={ja.judgment_status.replace('_',' ')} />}
                                        />
                                        {isCurrentUserJurorInPanel && ja.judgment_status === 'PENDING_JUDGMENT' && status === 'UNDER_JURY_REVIEW' && (
                                            <Chip label={<Localized id="your-turn-to-judge-chip" fallback="Your Turn!"/>} color="info" size="small" sx={{ml:1}}/>
                                        )}
                                    </ListItem>
                                );
                            })}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            {/* This message is shown if canViewJuryPanelList is true but juryAssignments is empty */}
                            <Localized id="no-jury-assigned" fallback="No jury has been assigned to this penalty yet."/>
                        </Typography>
                    )}
                </Box>
            )}

            {/* The Jury Judgments section is always rendered if canViewJudgments is true, regardless of canViewJuryPanelList */}
            {canViewJudgments && judgments.length > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom><Localized id="penalty-judgments-title" fallback="Jury Judgments"/></Typography>
                        <List dense>
                            {judgments
                                .map(judgment => {
                                    let judgmentDisplayName = judgment.juror_usertag || 'Juror';
                                    const actualJudgmentDisplay = getJudgmentDisplay(judgment.judgment);
                                    const reasonDisplay = judgment.judgment_reason;

                                    if (judgment.jury_slot === 'C2' && !isAdmin) {
                                        judgmentDisplayName = <Localized id="anonymous-juror-display" fallback="Anonymous Juror (C2)"/>;
                                    } else if (judgment.jury_slot === 'C3') {
                                        // For C3, the name is always "Popular Vote", but the judgment itself is shown
                                        judgmentDisplayName = <Localized id="judgment-slot-c3-popular-vote" fallback="Popular Vote (C3)"/>;
                                    }

                                    return (
                                        <ListItem key={judgment.id} alignItems="flex-start" sx={{ flexDirection: 'column', mb:1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p:1.5}}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {/* If C2 (non-admin) or C3, use the special display name directly */}
                                                {(judgment.jury_slot === 'C2' && !isAdmin) || judgment.jury_slot === 'C3'
                                                    ? judgmentDisplayName
                                                    : <>{judgmentDisplayName} ({judgment.jury_slot})</>}
                                                {/* Always show the judgment type after the name/slot */}
                                                <>: {actualJudgmentDisplay}</>
                                            </Typography>
                                            {reasonDisplay && (
                                                <Typography variant="body2" color="text.secondary" sx={{pl:1}}>
                                                    <strong><Localized id="judgment-reason-label" fallback="Reason:"/>&nbsp;</strong>{reasonDisplay}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    );
                                })}
                        </List>
                    </Box>
                </>
            )}

            {status.startsWith('CLOSED_') && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom><Localized id="penalty-final-outcome" fallback="Final Outcome"/></Typography>
                        <List dense>
                            <ListItem>
                                <ListItemIcon><PolicyIcon /></ListItemIcon>
                                <ListItemText 
                                    primary={<Localized id="final-outcome-decision" fallback="Decision" />} 
                                    secondary={final_outcome ? getJudgmentDisplay(final_outcome) : <Localized id="outcome-not-specified" fallback="Not Specified"/>}
                                />
                            </ListItem>
                            {final_reason && (
                                <ListItem>
                                    <ListItemIcon sx={{opacity: 0.5}}><PolicyIcon /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Localized id="final-outcome-reason" fallback="Reason" />} 
                                        secondary={final_reason}
                                        secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap'} }} 
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Box>
                </>
            )}

          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
                <Localized id="back-button" fallback="Go Back" />
            </Button>
        </Box>

      </Paper>
    </Container>
  );
} 