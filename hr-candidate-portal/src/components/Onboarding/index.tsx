import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';

const OnboardScreen = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { logoUrl, bgImageUrl, logo2Url, isDefaultBrand } = useBranding();

  useEffect(() => {
    const activeToken = token ?? localStorage.getItem("urlToken");

    if (activeToken) {
      localStorage.setItem("urlToken", activeToken);

      const timer = setTimeout(() => {
        navigate(`/registration/${activeToken}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [token, navigate]);

  return (
    // Outer box just centers the mobile view
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0,
        backgroundColor: '#900000',
      }}
    >
      {/* Mobile frame container */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',

          // Large tablets landscape or small desktops
          '@media (min-width: 1024px)': {
            width: '500px',
          },

          // Ensure even huge desktop monitors maintain mobile view
          '@media (min-width: 1440px)': {
            width: '500px',
          },
        }}
      >
        <img
          src={isDefaultBrand ? logo2Url : logoUrl}
          alt="Company Logo"
          style={{
            width: '60%',
            maxWidth: '220px',
            objectFit: 'contain',
          }}
        />
      </Box>
    </Box>
  );
};

export default OnboardScreen;
