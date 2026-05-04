import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useBranding } from '../contexts/BrandingContext';

// Enable dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const ExamEntryPage = () => {
  const { logoUrl, bgImageUrl, primaryColor, orgName } = useBranding();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'countdown' | 'open' | 'closed' | 'error'>('loading');
  const [timeLeft, setTimeLeft] = useState(0);

  const istTimeZone = 'Asia/Kolkata';

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;

        const res = await axios.get(`${API_URL}/registration-link/resolve/${token}`);
        const { examStartTime, examEndTime, roleId, adminId, organizationId } = res.data;

        // Store in localStorage (if needed by registration page)
        localStorage.setItem('urlRoleId', roleId);
        localStorage.setItem('urlAdminId', adminId);
        localStorage.setItem('urlOrgId', organizationId);
        localStorage.setItem('urlExamStartTime', examStartTime);
        localStorage.setItem('urlExamEndTime', examEndTime);

        const now = dayjs().tz(istTimeZone);
        const start = dayjs.utc(examStartTime).tz(istTimeZone);
        const end = dayjs.utc(examEndTime).tz(istTimeZone);

        const localStartTime = parseInt(localStorage.getItem('userExamStartTime') || '0', 10);
        const allowedDuration = parseInt(localStorage.getItem('userExamAllowedDuration') || '0', 10);
        const nowTime = Date.now();

        if (now.isBefore(start)) {
          setStatus('countdown');
          setTimeLeft(start.diff(now, 'second'));
        } else if (now.isAfter(end)) {
          if (localStartTime && allowedDuration) {
            const timePassed = (nowTime - localStartTime) / 1000;
            if (timePassed <= allowedDuration) {
              navigate(`/onboard/${token}`);
              return;
            } else {
              localStorage.removeItem('userExamStartTime');
              localStorage.removeItem('userExamAllowedDuration');
            }
          }
          setStatus('closed');
        } else {
          setStatus('open');
          setTimeLeft(end.diff(now, 'second'));
        }
      } catch (err) {
        console.error('Error resolving token:', err);
        setStatus('error');
      }
    };

    fetchExamDetails();
  }, [token, navigate]);

  // Timer countdown
  useEffect(() => {
    let interval: any;

    if (status === 'countdown' || status === 'open') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);

  // Auto-start on open
  useEffect(() => {
    if (status === 'open') {
      const allowedDurationInSeconds = 3600; // 1 hour
      localStorage.setItem('userExamStartTime', Date.now().toString());
      localStorage.setItem('userExamAllowedDuration', allowedDurationInSeconds.toString());
      navigate(`/onboard/${token}`);
    }
  }, [status, navigate, token]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: '170px', maxHeight: '80px', objectFit: 'contain', marginBottom: 16 }}
            />
          )}
          <Typography variant="h6" fontWeight={600} color="#fff" fontSize="22px" textAlign="center">
            {orgName}
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            textAlign: 'center',
            pt: 4,
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress />
              <Typography fontSize="22px" sx={{ mt: 2 }}>Loading exam details...</Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Typography fontSize="24px" fontWeight={500} mb={2} color="red">
                Exam Link Invalid or Expired
              </Typography>
              <Typography fontSize="22px" mb={2}>
                The exam link you are trying to access is either invalid or has expired.
              </Typography>
            </>
          )}

          {status === 'countdown' && (
            <>
              <Typography fontSize="24px" fontWeight={600} mb={1}>
                Your assessment will begin shortly.
              </Typography>
              <Typography fontSize="20px" mb={2}>
                The exam will start in:
              </Typography>
              <Typography fontSize="32px" fontWeight={700} color={primaryColor} mb={3}>
                {formatTime(timeLeft)}
              </Typography>

              <Box sx={{ textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                <Typography fontSize="16px" fontWeight={500} mb={1}>
                  Instructions/Note:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
                  <li>Please ensure your environment is quiet and free from distractions.</li>
                  <li>Make sure your internet connection is stable.</li>
                  <li>The test will auto-start when the timer hits zero.</li>
                </ul>
              </Box>
            </>
          )}

          {status === 'closed' && (
            <>
              <div style={{"marginTop": '50px'}}>
                <Typography fontSize="26px" fontWeight={500} mb={2} color="red">
                  Exam Closed
                </Typography>
                <Typography fontSize="22px">This exam is no longer available.</Typography>
              </div>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExamEntryPage;
