import React, { useState, useEffect, useCallback } from 'react';
// Use axiosInstance
import axiosInstance from '../utils/axiosInstance';
// import axios from 'axios';
import { Container, Typography, Box, TextField, Button, Grid, Paper, CircularProgress, Alert, Avatar, Card, CardMedia, Link } from '@mui/material';
import { Localized } from '@fluent/react';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RecoveryCodesDisplay from './RecoveryCodesDisplay';

// Simple debounce function (reuse from Register? Consider moving to a utils file)
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// --- Backend Endpoints now expect Bearer token ---
// GET /api/users/me
// PUT /api/users/me // Need to implement this backend route
// PUT /api/users/me/password
// GET /api/validate/driver-number/:number - (Assuming still public)
// POST /api/users/me/driver-picture - NEW
// POST /api/users/me/payment-confirmation - NEW
// -------------------------------------

function AccountPage() {
  const [userData, setUserData] = useState({ username: '', usertag: '', driver_number: '', driver_picture_url: null, payment_confirmation_url: null });
  const [usertagInput, setUsertagInput] = useState('');
  const [driverNumberInput, setDriverNumberInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState(null); // General form errors
  const [successMessage, setSuccessMessage] = useState(''); // General form success

  // Recovery Code States
  const [hasActiveCodes, setHasActiveCodes] = useState(true); // Assume they have codes initially to avoid flash of button
  const [newlyGeneratedCodes, setNewlyGeneratedCodes] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  // Driver number specific states
  const [driverNumberError, setDriverNumberError] = useState('');
  const [isCheckingDriverNumber, setIsCheckingDriverNumber] = useState(false);
  const [driverNumberAvailable, setDriverNumberAvailable] = useState(false); // State for success message

  // File Upload States
  const [driverPictureFile, setDriverPictureFile] = useState(null);
  const [driverPicturePreview, setDriverPicturePreview] = useState(null);
  const [uploadingDriverPicture, setUploadingDriverPicture] = useState(false);
  const [driverPictureUrl, setDriverPictureUrl] = useState(null); // To display current picture

  const [paymentConfirmationFile, setPaymentConfirmationFile] = useState(null);
  const [uploadingPaymentConfirmation, setUploadingPaymentConfirmation] = useState(false);
  const [paymentConfirmationUrl, setPaymentConfirmationUrl] = useState(null); // To display current link
  const [fetchedPaymentSignedUrl, setFetchedPaymentSignedUrl] = useState(null); // For the actual link href

  // Fetch user data using axiosInstance
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/users/me');
        const fetchedUser = response.data.user;
        console.log("Fetched user data:", fetchedUser);
        console.log("Fetched driver_picture_url:", fetchedUser?.driver_picture_url);
        if (!fetchedUser) {
            console.error("User data not found in response:", response.data);
            throw new Error("User data structure incorrect in API response");
        }
        setUserData(fetchedUser);
        setUsertagInput(fetchedUser.usertag || '');
        setDriverNumberInput(fetchedUser.driver_number !== null && fetchedUser.driver_number !== undefined ? String(fetchedUser.driver_number) : '');
        setDriverPictureUrl(fetchedUser.driver_picture_url || null);
        console.log("State driverPictureUrl after set:", fetchedUser.driver_picture_url || null); // Log what was set
        setPaymentConfirmationUrl(fetchedUser.payment_confirmation_url || null);

        // Fetch recovery code status
        const recoveryStatusResponse = await axiosInstance.get('/api/users/me/recovery-status');
        setHasActiveCodes(recoveryStatusResponse.data.hasActiveCodes);

        // If a payment confirmation URL/pathname exists, fetch its signed URL for viewing
        if (fetchedUser.payment_confirmation_url) {
          const fetchSignedUrl = async () => {
            try {
              setError(null); // Clear previous errors
              const response = await axiosInstance.get('/api/users/me/payment-confirmation-link');
              setFetchedPaymentSignedUrl(response.data.signedUrl);
            } catch (err) {
              console.error("Error fetching payment confirmation link:", err);
              // Set a generic error, or a specific one if available
              setError(err.response?.data?.message || 'fetch-payment-link-error'); 
              setFetchedPaymentSignedUrl(null); // Ensure no broken link
            }
          };
          fetchSignedUrl();
        }

      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.response) {
            if (err.response.status === 401 || err.response.status === 403) {
                setError('fetch-user-data-error-auth');
            } else {
                console.error('Server responded with status:', err.response.status);
                setError('fetch-user-data-error');
            }
        } else if (err.request) {
            console.error('No response received:', err.request);
            setError('fetch-user-data-error-network');
        } else {
            console.error('Error setting up request:', err.message);
            setError('fetch-user-data-error-setup');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // Debounced Driver number validation
  const checkDriverNumberUniqueness = useCallback((number) => {
    const validateNumber = async () => {
      // Clear previous states before checking
      setDriverNumberError('');
      setDriverNumberAvailable(false); // Reset availability on new check

      // Don't check if empty or if it's the user's current number
      if (!number || number === String(userData.driver_number)) {
          setIsCheckingDriverNumber(false);
          return;
      }

      setIsCheckingDriverNumber(true);
      try {
        const response = await axiosInstance.get(`/api/validate/driver-number/${number}`);
        if (!response.data.isAvailable) {
          setDriverNumberError('driver-number-invalid-or-taken');
          setDriverNumberAvailable(false);
        } else {
          // Number is available and different from the original
          setDriverNumberAvailable(true);
          setDriverNumberError(''); // Clear any previous error
        }
      } catch (error) {
        console.error("Validation check failed:", error);
        setDriverNumberError('validation-check-failed');
        setDriverNumberAvailable(false);
      } finally {
        setIsCheckingDriverNumber(false);
      }
    };
    return debounce(validateNumber, 500)();
  }, [userData.driver_number]); // Dependency: original driver number

  // Handle input change for driver number
  const handleDriverNumberChange = (event) => {
    const value = event.target.value;
    // Allow only digits
    if (/^\d*$/.test(value)) {
      setDriverNumberInput(value);
      // Trigger debounced validation
      checkDriverNumberUniqueness(value);
    }
  };

  // Handle Driver Picture File Change
  const handleDriverPictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDriverPictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDriverPicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setDriverPictureFile(null);
      setDriverPicturePreview(null);
    }
  };

  // Handle Payment Confirmation File Change
  const handlePaymentConfirmationChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentConfirmationFile(file);
    } else {
      setPaymentConfirmationFile(null);
    }
  };

  // Handle Driver Picture Upload
  const handleUploadDriverPicture = async () => {
    if (!driverPictureFile) {
      setError('select-driver-picture-first');
      return;
    }
    setUploadingDriverPicture(true);
    setError(null);
    setSuccessMessage('');
    const formData = new FormData();
    formData.append('driverPicture', driverPictureFile);

    try {
      const response = await axiosInstance.post('/api/users/me/driver-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('driver-picture-uploaded');
      setDriverPictureUrl(response.data.url); // Update with the new URL from blob storage
      setDriverPictureFile(null); // Clear the file input
      setDriverPicturePreview(null); // Clear the preview
    } catch (err) {
      console.error("Error uploading driver picture:", err);
      setError(err.response?.data?.message || 'driver-picture-upload-error');
    } finally {
      setUploadingDriverPicture(false);
    }
  };

  // Handle Payment Confirmation Upload
  const handleUploadPaymentConfirmation = async () => {
    if (!paymentConfirmationFile) {
      setError('select-payment-confirmation-first');
      return;
    }
    setUploadingPaymentConfirmation(true);
    setError(null);
    setSuccessMessage('');
    const formData = new FormData();
    formData.append('paymentConfirmation', paymentConfirmationFile);

    try {
      const response = await axiosInstance.post('/api/users/me/payment-confirmation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('payment-confirmation-uploaded');
      setPaymentConfirmationUrl(response.data.url); // Update with the new URL
      setPaymentConfirmationFile(null); // Clear the file input
      // After successful upload, fetch the new signed URL for the link
      try {
        const signedUrlResponse = await axiosInstance.get('/api/users/me/payment-confirmation-link');
        setFetchedPaymentSignedUrl(signedUrlResponse.data.signedUrl);
      } catch (fetchErr) {
        console.error("Error fetching new payment confirmation link:", fetchErr);
        setError(fetchErr.response?.data?.message || 'fetch-payment-link-error');
        setFetchedPaymentSignedUrl(null);
      }
    } catch (err) {
      console.error("Error uploading payment confirmation:", err);
      setError(err.response?.data?.message || 'payment-confirmation-upload-error');
    } finally {
      setUploadingPaymentConfirmation(false);
    }
  };

  const handleGenerateCodes = async () => {
    setIsLoadingCodes(true);
    setError(null);
    setSuccessMessage('');
    try {
      const response = await axiosInstance.post('/api/users/me/generate-recovery-codes');
      if (response.data.success) {
        setNewlyGeneratedCodes(response.data.recoveryCodes);
        setHasActiveCodes(true); // They now have active codes
        setSuccessMessage('recovery-codes-generated-success');
      }
    } catch (err) {
      console.error("Error generating recovery codes:", err);
      setError(err.response?.data?.message || 'generate-codes-error');
    } finally {
      setIsLoadingCodes(false);
    }
  };

  // Handle details update (Usertag, Driver Number)
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    // Prevent submission if number is invalid, being checked, or required but empty
    if (isCheckingDriverNumber) {
        setError('wait-driver-number-validation');
        return;
    }
     if (driverNumberError && driverNumberInput !== String(userData.driver_number)) {
        setError('driver-number-invalid-or-taken'); // More specific error
        return;
    }
    if (!driverNumberInput) {
        setError('driver-number-required');
        return;
    }
    if (!usertagInput) {
        setError('usertag-required'); // Added validation for usertag
        return;
    }


    setSavingDetails(true);
    try {
        const payload = {};
        // Only include fields if they have changed
        if (usertagInput !== userData.usertag) {
            payload.usertag = usertagInput;
        }
        if (driverNumberInput !== String(userData.driver_number)) {
             const driverNum = parseInt(driverNumberInput, 10);
             // Double-check parsing (though input filter helps)
             if (isNaN(driverNum)) {
                 setError('invalid-driver-number-format');
                 setSavingDetails(false);
                 return;
             }
             payload.driverNumber = driverNum;
        }

        // If nothing changed, show a message and stop
        if (Object.keys(payload).length === 0) {
            setSuccessMessage('account-no-changes');
            setSavingDetails(false);
            return;
        }

        // ** ACTION NEEDED: Implement PUT /api/users/me endpoint on backend ** - DONE
        // This endpoint should accept { usertag?, driverNumber? }
        await axiosInstance.put('/api/users/me', payload); // Uncommented API call
        
        setSuccessMessage('account-details-updated');
        // Refresh local state to reflect "saved" changes
        setUserData(prev => ({
          ...prev,
          ...(payload.usertag && { usertag: payload.usertag }),
          ...(payload.driverNumber !== undefined && { driver_number: payload.driverNumber }),
        }));
        // Reset input fields to match the new userData state
        if (payload.usertag) setUsertagInput(payload.usertag);
        if (payload.driverNumber !== undefined) setDriverNumberInput(String(payload.driverNumber));
        setDriverNumberAvailable(false); // Clear availability message after successful save

    } catch (err) {
        // This will catch errors once the actual API call is implemented
        console.error("Error updating details:", err);
        setError(err.response?.data?.message || 'account-update-details-error');
    } finally {
        setSavingDetails(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (newPassword !== confirmNewPassword) {
      setError('password-mismatch');
      return;
    }
    if (!currentPassword || !newPassword) {
      setError('account-password-fields-required');
      return;
    }
    if (newPassword.length < 6) { // Add password length validation
        setError('password-too-short');
        return;
    }

    setSavingPassword(true);
    try {
       await axiosInstance.put('/api/users/me/password', {
           currentPassword,
           newPassword
       });
       setSuccessMessage('account-password-updated');
       // Clear password fields on success
       setCurrentPassword('');
       setNewPassword('');
       setConfirmNewPassword('');
    } catch (err) {
        console.error("Error changing password:", err);
         // Improve error handling: Map specific backend messages if available
         if (err.response?.data?.message === 'Incorrect current password') {
            setError('account-incorrect-current-password');
         } else {
            setError(err.response?.data?.message || 'account-update-password-error');
         }
    } finally {
        setSavingPassword(false);
    }
  };

  // Loading state
  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  }

  // Determine helper text content and style for driver number
  const getDriverNumberHelperText = () => {
      if (isCheckingDriverNumber) {
          return <Localized id="driver-number-checking" />;
      }
      if (driverNumberError) {
          return <Localized id={driverNumberError} />;
      }
      // Show "Available" only if a check was successful AND it's different from original
      if (driverNumberAvailable && driverNumberInput !== String(userData.driver_number)) {
           // Wrap in Typography for green color
           return (
                <Typography component="span" sx={{ color: 'success.main', fontSize: '0.75rem' }}>
                     <Localized id="driver-number-available" />
                </Typography>
           );
      }
      return ''; // No message otherwise
  };

  // Render the component
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <ManageAccountsIcon fontSize='large' />
        </Avatar>
        <Typography component="h1" variant="h4">
            <Localized id="account-page-title" />
        </Typography>
      </Box>

      {/* General Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}><Localized id={error} /></Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}><Localized id={successMessage} /></Alert>}

      <Grid container spacing={4}>
        {/* User Details Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom><Localized id="account-details-heading" /></Typography>
            <Box component="form" onSubmit={handleUpdateDetails} noValidate sx={{ mb: 3 }}>
              {/* Username (Display Only) */}
              <TextField
                label={<Localized id="username-label"/>}
                value={userData.username || ''}
                fullWidth
                margin="normal"
                disabled
                InputProps={{ readOnly: true }}
              />
              {/* Usertag */}
              <TextField
                label={<Localized id="usertag-label"/>}
                value={usertagInput}
                onChange={(e) => setUsertagInput(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={!usertagInput && !!error} // Show error if usertag is required and empty during submission attempt
                helperText={!usertagInput && error === 'usertag-required' ? <Localized id="usertag-required" /> : ''}
              />
              {/* Driver Number */}
               <TextField
                label={<Localized id="driver-number-label" />}
                value={driverNumberInput}
                onChange={handleDriverNumberChange}
                fullWidth
                margin="normal"
                required
                type="text" // Use text to allow leading zeros if desired, pattern enforces numeric
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                error={!!driverNumberError && driverNumberInput !== String(userData.driver_number)} // Show error only if it's not the original number
                helperText={getDriverNumberHelperText()} // Use the helper function
                sx={{
                  ...(driverNumberAvailable && driverNumberInput !== String(userData.driver_number) && {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'success.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'success.dark',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'success.main',
                      },
                    },
                  }),
                }}
              />
              {/* Save Details Button */}
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
                disabled={
                    savingDetails || // Disable while saving
                    isCheckingDriverNumber || // Disable while checking number
                    (!!driverNumberError && driverNumberInput !== String(userData.driver_number)) || // Disable if there's an error on a *new* number
                    !usertagInput || // Disable if required usertag is empty
                    !driverNumberInput // Disable if required driver number is empty
                    // Optionally disable if no changes were made (already handled in submit logic)
                }
              >
                {savingDetails ? <CircularProgress size={24} /> : <Localized id="account-save-details-button" />}
              </Button>
            </Box>

            {/* Driver Picture Upload */}
            <Box sx={{ mt: 4, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom><Localized id="account-driver-picture-heading" /></Typography>
              {console.log("Rendering CardMedia. driverPicturePreview:", driverPicturePreview, "driverPictureUrl:", driverPictureUrl)}
              {(driverPictureUrl || driverPicturePreview) && (
                <Card sx={{ maxWidth: 345, mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="194"
                    image={driverPicturePreview || driverPictureUrl} // Preview takes precedence, otherwise shows current URL
                    alt={driverPicturePreview ? "Driver Picture Preview" : "Driver Picture"}
                  />
                </Card>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{ mr: 2 }}
              >
                <Localized id="account-select-driver-picture-button" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleDriverPictureChange}
                />
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadDriverPicture}
                disabled={!driverPictureFile || uploadingDriverPicture}
                startIcon={uploadingDriverPicture ? <CircularProgress size={20} /> : <UploadFileIcon />}
              >
                <Localized id="account-upload-driver-picture-button" />
              </Button>
              {driverPictureFile && <Typography variant="caption" display="block" sx={{mt:1}}>{driverPictureFile.name}</Typography>}
            </Box>

            {/* Payment Confirmation Upload */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom><Localized id="account-payment-confirmation-heading" /></Typography>
              {paymentConfirmationUrl && fetchedPaymentSignedUrl && (
                 <Typography variant="body2" sx={{ mb: 1 }}>
                    <Localized id="account-current-payment-confirmation-label" />{' '}
                    <Link href={fetchedPaymentSignedUrl} target="_blank" rel="noopener noreferrer">
                        <Localized id="account-view-payment-confirmation-link" />
                    </Link>
                </Typography>
              )}
              {paymentConfirmationUrl && !fetchedPaymentSignedUrl && error && (
                <Typography variant="body2" sx={{ mb: 1, color: 'error.main' }}>
                  <Localized id={error} />
                </Typography>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{ mr: 2 }}
              >
                <Localized id="account-select-payment-confirmation-button" />
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={handlePaymentConfirmationChange}
                />
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadPaymentConfirmation}
                disabled={!paymentConfirmationFile || uploadingPaymentConfirmation}
                startIcon={uploadingPaymentConfirmation ? <CircularProgress size={20} /> : <UploadFileIcon />}
              >
                <Localized id="account-upload-payment-confirmation-button" />
              </Button>
              {paymentConfirmationFile && <Typography variant="caption" display="block" sx={{mt:1}}>{paymentConfirmationFile.name}</Typography>}
            </Box>

          </Paper>
        </Grid>

        {/* Change Password Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom><Localized id="account-change-password-heading" /></Typography>
            <Box component="form" onSubmit={handlePasswordChange} noValidate>
              {/* Current Password */}
              <TextField
                label={<Localized id="account-current-password-label"/>}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={error === 'account-incorrect-current-password'} // Highlight if backend reported incorrect pass
              />
              {/* New Password */}
              <TextField
                label={<Localized id="account-new-password-label"/>}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={(!!error && error !== 'account-incorrect-current-password') || (newPassword.length > 0 && newPassword.length < 6)} // Show error for mismatch, general errors, or length violation
                helperText={newPassword.length > 0 && newPassword.length < 6 ? <Localized id="password-too-short" /> : ''}
              />
              {/* Confirm New Password */}
              <TextField
                 label={<Localized id="confirm-password-label"/>}
                 type="password"
                 value={confirmNewPassword}
                 onChange={(e) => setConfirmNewPassword(e.target.value)}
                 fullWidth
                 margin="normal"
                 required
                 error={newPassword !== confirmNewPassword && confirmNewPassword !== ''} // Standard mismatch error
                 helperText={newPassword !== confirmNewPassword && confirmNewPassword !== '' ? <Localized id="password-mismatch" /> : ''}
              />
              {/* Change Password Button */}
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
                disabled={
                    savingPassword || // Disable while saving
                    !currentPassword || // Disable if fields are empty
                    !newPassword ||
                    newPassword.length < 6 || // Disable if new password too short
                    newPassword !== confirmNewPassword // Disable if passwords don't match
                }
              >
                {savingPassword ? <CircularProgress size={24} /> : <Localized id="account-change-password-button" />}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recovery Codes Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Localized id="account-recovery-codes-heading" />
            </Typography>
            
            {newlyGeneratedCodes.length > 0 ? (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Localized id="recovery-codes-save-warning" />
                </Alert>
                <RecoveryCodesDisplay recoveryCodes={newlyGeneratedCodes} showLoginButton={false} />
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => setNewlyGeneratedCodes([])}
                >
                  <Localized id="recovery-codes-done-button" />
                </Button>
              </>
            ) : (
              <>
                {hasActiveCodes ? (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <Localized id="account-has-active-codes-prompt" />
                  </Typography>
                ) : (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <Localized id="account-no-active-codes-prompt" />
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={handleGenerateCodes}
                  disabled={isLoadingCodes}
                >
                  {isLoadingCodes ? <CircularProgress size={24} /> : <Localized id="generate-recovery-codes-button" />}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AccountPage;