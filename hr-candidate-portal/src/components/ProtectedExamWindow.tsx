import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { useBranding } from '../contexts/BrandingContext';

// Enable dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const ProtectedExamWindow = ({ children }: { children: React.ReactNode }) => {
  const { logoUrl, bgImageUrl, primaryColor } = useBranding();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'blocked' | 'error'>('loading');

  const istTimeZone = 'Asia/Kolkata';

  useEffect(() => {
    const startTime = parseInt(localStorage.getItem('userExamStartTime') || '0', 10);
    const allowedDuration = parseInt(localStorage.getItem('userExamAllowedDuration') || '0', 10);
    const now = Date.now();

    if (startTime && allowedDuration) {
      const timePassed = (now - startTime) / 1000; // in seconds
      if (timePassed <= allowedDuration) {
        setStatus('allowed');
        return;
      } else {
        // Time expired, clear flags
        localStorage.removeItem('userExamStartTime');
        localStorage.removeItem('userExamAllowedDuration');
        setStatus('blocked');
        return;
      }
    }

    const checkExamWindow = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${API_URL}/registration-link/resolve/${token}`);
        const { examStartTime, examEndTime } = res.data;

        const now = dayjs().tz(istTimeZone);
        const start = dayjs.utc(examStartTime).tz(istTimeZone);
        const end = dayjs.utc(examEndTime).tz(istTimeZone);

        const localStartTime = parseInt(localStorage.getItem('userExamStartTime') || '0', 10);
        const allowedDuration = parseInt(localStorage.getItem('userExamAllowedDuration') || '0', 10);
        const nowTime = Date.now();

        console.log('Backend window:', start.format(), 'to', end.format());
        console.log('Local user session start:', localStartTime, 'allowedDuration:', allowedDuration);

        // Priority 1: If local session exists, check personal 1-hour window
        if (localStartTime && allowedDuration) {
          const timePassed = (nowTime - localStartTime) / 1000;
          if (timePassed <= allowedDuration) {
            console.log('Still within personal session time');
            setStatus('allowed');
            return;
          } else {
            console.log('Personal session time expired, clearing');
            localStorage.removeItem('userExamStartTime');
            localStorage.removeItem('userExamAllowedDuration');
          }
        }

        // Priority 2: If no local session, check global backend window
        if (now.isBefore(start)) {
          console.log('Too early, exam not started');
          setStatus('blocked');
        } else if (now.isAfter(end)) {
          console.log('Global exam window closed');
          setStatus('blocked');
        } else {
          console.log('Inside global window, starting local session');
          // Store personal session (new start)
          localStorage.setItem('userExamStartTime', Date.now().toString());
          localStorage.setItem('userExamAllowedDuration', '3600'); // 1 hour in seconds
          setStatus('allowed');
        }
      } catch (err) {
        console.error('Error checking exam window:', err);
        setStatus('blocked');
      }
    };

    checkExamWindow();
  }, [token]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Plus Jakarta Sans',
          backgroundColor: primaryColor,
          '@media (min-width: 1024px)': { backgroundColor: '#900000' },
        }}
      >
        <CircularProgress color="secondary" />
        <Typography ml={2} color="#fff">
          Checking exam access...
        </Typography>
      </Box>
    );
  }

  if (status === 'blocked') {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Plus Jakarta Sans',
          backgroundColor: primaryColor,
          '@media (min-width: 1024px)': { backgroundColor: '#900000' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            '@media (min-width: 1024px)': { width: '500px' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '34px', pb: '20px' }}>
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: '170px', maxHeight: '80px', objectFit: 'contain', marginBottom: 16 }}
            />
            <Typography variant="h6" fontWeight={600} color="#fff" fontSize="22px" textAlign="center">
              Access Denied
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
              flexGrow: 1,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start', // move content to top
              alignItems: 'center',
              textAlign: 'center',
              pt: 10, // add top padding
            }}
          >
            <Typography fontSize="24px" fontWeight={500} mb={2} color="red">
              Your exam session has expired.
            </Typography>
          </Box>

          {/* Fixed footer button
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              zIndex: 1000,
              padding: '0px 20px 20px',
              '@media (min-width: 1024px)': {
                width: '460px',
                margin: '0 auto',
              },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate(`/${token}`)}
              sx={{
                backgroundColor: primaryColor,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                textTransform: 'none',
                borderRadius: '4px',
                height: '56px',
                padding: '12px 24px',
                '&:hover': { backgroundColor: primaryColor },
              }}
            >
              Go Back
            </Button>
          </Box> */}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedExamWindow;
