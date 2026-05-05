import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useBranding } from '../contexts/BrandingContext';

const DeviceChecker = ({ children }: { children: React.ReactNode }) => {
  const [isAllowed, setIsAllowed] = useState(true); // Start true for SSR safety
  const { logoUrl, bgImageUrl, primaryColor } = useBranding();

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileAgent = /android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;

    setIsAllowed(isMobileAgent && isSmallScreen);

    const handleResize = () => {
      const updatedSmallScreen = window.innerWidth <= 768;
      setIsAllowed(isMobileAgent && updatedSmallScreen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAllowed) {
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
          '@media (min-width: 1024px)': {
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
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: '34px',
              pb: '20px',
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                maxWidth: '170px',
                maxHeight: '80px',
                objectFit: 'contain',
                marginBottom: 16,
              }}
            />
            <Typography
              variant="h6"
              fontWeight={600}
              color="#fff"
              fontSize="22px"
              textAlign="center"
            >
              Desktop Access Not Supported
            </Typography>
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
              flexGrow: 1,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              pb: '40px',
            }}
          >
            <Box textAlign="center" px={2}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '22px',
                  color: '#464D67',
                  fontWeight: 500,
                  lineHeight: '140%',
                  mb: 2,
                }}
              >
                This page is optimized for mobile. Please access it on a mobile device.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};

export default DeviceChecker;

