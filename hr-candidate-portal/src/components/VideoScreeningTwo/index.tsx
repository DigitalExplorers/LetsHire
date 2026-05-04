import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import BlockBackButton from '../BlockBackButton';
import { useBranding } from '../../contexts/BrandingContext';

const API_URL =
    import.meta.env.VITE_API_URL;

const VideoScreeningTwo = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('your');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams<{ token: string }>();
  const { bgImageUrl, logoUrl, primaryColor } = useBranding();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userId = Cookies.get('userId');
        const access_token = Cookies.get('access_token');
        if (!userId || !access_token) return;

        const response = await axios.get(`${API_URL}/candidates/candidate/${userId}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        if (response.data?.desiredRole) {
          setUserRole(response.data.desiredRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <>
      <BlockBackButton />
      <Box
        sx={{
          height: "100vh",
          minHeight: '100dvh',
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Plus Jakarta Sans",
          overflow: 'hidden',
          backgroundColor: primaryColor,
          '@media (min-width: 1024px)': {
            backgroundColor: '#900000',
          },

          '@media (min-width: 1440px)': {
            backgroundColor: '#900000',
          },
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
            overflowY: 'scroll',
            '@media (min-width: 1024px)': { width: '500px' },
            '@media (min-width: 1440px)': { width: '500px' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: '34px',
              pb: '20px',
              flexShrink: 0,
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                maxWidth: '170px',
                maxHeight: '80px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                marginBottom: 16,
              }}
            />
            {isLoading ? (
              <Typography variant="h6" fontSize={'22px'} fontWeight={600} color="#fff" textAlign="center">
                Loading...
              </Typography>
            ) : (
              <Typography variant="h6" fontSize={'22px'} fontWeight={600} color="#fff" textAlign="center">
                Video Screening Prompt
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
              flexGrow: 1,
              px: 3,
              pt: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              paddingLeft: '20px',
              paddingRight: '20px',
              pb: '120px',
            }}
          >
            {isLoading ? (
              <Box display="flex" justifyContent="start" alignItems="baseline" height="100%">
                <CircularProgress color="secondary" />
              </Box>
            ) : (
              <Box
                sx={{
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  flexGrow: 1,
                }}
              >
                <Typography
                  fontSize="20px"
                  color="#000"
                  fontWeight={400}
                  textAlign="left"
                  sx={{ mb: 3, fontFamily: 'Plus Jakarta Sans', lineHeight: '130%' }}
                >
                  Highlight why you are the ideal candidate for the {userRole} role, focusing on your key strengths and abilities.
                </Typography>

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
                      pb: '2',
                    },
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/video-recorder/${token}`)}
                    sx={{
                      backgroundColor: primaryColor,
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      textTransform: 'none',
                      borderRadius: 0,
                      py: 1.4,
                      width: '100%',
                      '&:hover': {
                        backgroundColor: primaryColor,
                      },
                    }}
                  >
                    START
                  </Button>

                  <Typography
                    fontSize="14px"
                    color="#464D67"
                    fontWeight={300}
                    mt={2}
                    textAlign="left"
                    sx={{ lineHeight: '130%', fontFamily: 'Plus Jakarta Sans' }}
                  >
                    Your 1 min. timer will start as soon as you tap on the ‘START’ button.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default VideoScreeningTwo;
