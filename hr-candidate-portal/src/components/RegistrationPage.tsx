import { Box, Typography } from '@mui/material';
const the8800Bg = '/assets/THE8800-bg.png';
const the8800Logo = '/assets/THE8800-icon.jpg';

const CandidateRegistration = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        fontFamily: 'Plus Jakarta Sans',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          maxWidth: '390px',
          maxHeight: '845px',
          backgroundImage: `url(${the8800Bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontFamily: 'Plus Jakarta Sans',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '90px',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: 2,
          }}
        >
          <img
            src={the8800Logo}
            alt="Letshire Logo"
            style={{ width: 48, height: 48, marginBottom: 16 }}
          />
          <Typography variant="h6" fontWeight={600} color="#fff" textAlign="center">
            Welcome to Letshire
          </Typography>
          <Typography variant="body2" color="#fff" textAlign="center">
            Kindly fill all the details required in the form below.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CandidateRegistration;
