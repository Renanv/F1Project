import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Container, Typography, Grid, Paper, CircularProgress, Alert, Card, CardMedia, Link, Box, Avatar } from '@mui/material';
import { Localized } from '@fluent/react';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description'; // For payment confirmations

function AdminUploadedFilesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverPictures, setDriverPictures] = useState([]);
  const [paymentConfirmations, setPaymentConfirmations] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/admin/uploaded-files');
        const allFiles = response.data.files || [];
        
        setDriverPictures(allFiles.filter(user => user.driver_picture_url));
        setPaymentConfirmations(allFiles.filter(user => user.payment_confirmation_url));

      } catch (err) {
        console.error("Error fetching uploaded files:", err);
        setError(err.response?.data?.message || 'fetch-uploaded-files-error');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        <Localized id="admin-uploaded-files-title" />
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}><Localized id={error} /></Alert>}

      <Grid container spacing={4}>
        {/* Driver Pictures Grid */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <Localized id="admin-driver-pictures-heading" />
            </Typography>
            {driverPictures.length === 0 && !loading && (
              <Typography><Localized id="admin-no-driver-pictures" /></Typography>
            )}
            <Grid container spacing={2}>
              {driverPictures.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={`dp-${user.id}`}>
                  <Card>
                    {user.driver_picture_url ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={user.driver_picture_url}
                        alt={`Driver picture for ${user.username}`}
                        sx={{ objectFit: 'contain' }} // Or 'cover' depending on desired look
                      />
                    ) : (
                      <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <ImageIcon color="disabled" sx={{ fontSize: 40 }}/>
                      </Box>
                    )}
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1">{user.username}</Typography>
                      <Typography variant="body2" color="text.secondary">{user.usertag}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Payment Confirmations Grid */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <Localized id="admin-payment-confirmations-heading" />
            </Typography>
            {paymentConfirmations.length === 0 && !loading && (
              <Typography><Localized id="admin-no-payment-confirmations" /></Typography>
            )}
            <Grid container spacing={2}>
              {paymentConfirmations.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={`pc-${user.id}`}>
                  <Card>
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                            <DescriptionIcon />
                        </Avatar>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1">{user.username}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{user.usertag}</Typography>
                      {user.payment_confirmation_url && (
                        <Link href={user.payment_confirmation_url} target="_blank" rel="noopener noreferrer">
                          <Localized id="admin-view-payment-confirmation-link" />
                        </Link>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminUploadedFilesPage; 