import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';
import BlockBackButton from '../BlockBackButton';

const VideoScreening = () => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { token } = useParams<{ token: string }>();
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false);
  const { logoUrl, bgImageUrl, primaryColor, orgName, policy } = useBranding();

  const handleCheckboxClick = () => {
    setIsChecked(!isChecked);
  };

  const handleButtonClick = () => {
    if (isChecked) {
      navigate(`/video-screening2/${token}`);
    } else {
      setOpenSnackbar(true);
    }
  };

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
          {/* Header */}
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
              alt={`${orgName} Logo`}
              style={{
                maxWidth: '170px',
                maxHeight: '80px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                marginBottom: 16,
              }}
            />
            <Typography variant="h6" fontSize={'22px'} fontWeight={600} color="#fff" textAlign="center">
              Video Screening
            </Typography>
            <Typography variant="body2" fontSize={'14px'} color="#fff" textAlign="center">
              Great! You’ve completed your screening test.
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
              pt: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingLeft: '20px',
              paddingRight: '20px',
              pb: '120px',

            }}
          >
            <Box width="100%">
              <Typography
                variant="body1"
                sx={{
                  fontSize: '24px',
                  color: '#464D67',
                  fontWeight: '400',
                  textAlign: 'left',
                  fontStyle: 'normal',
                  lineHeight: '120%',
                  mb: 2,
                }}
              >
                Instructions:
              </Typography>
              <ul
                className="custom-list"
                style={{
                  textAlign: 'left',
                  fontSize: '18px',
                  lineHeight: '130%',
                  fontWeight: '300',
                  color: '#000',
                  fontFamily: 'Plus Jakarta Sans',
                  paddingLeft: '20px',
                  marginTop: '10px',
                  marginBottom: '24px',
                }}
              >
                <li>Record the video in a quiet place.</li>
                <li>The prompt will be shown twice.</li>
              </ul>
            </Box>

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
              <div style={{ display: "flex", justifyContent: "start", alignItems: "center", marginBottom: '25px' }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "baseline",
                    width: "100%",
                  }}
                >
                  <div
                    onClick={handleCheckboxClick}
                    style={{
                      position: "relative",
                      width: "16px",
                      height: "16px",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      marginRight: "10px",
                      borderRadius: "2px",
                      border: isChecked ? `1px solid ${primaryColor}` : '1px solid black',
                      color: '#022E71',
                      background: isChecked ? primaryColor : "transparent",
                      flexShrink: 0,
                      top: '5px'
                    }}
                  >
                    {isChecked && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "4px",
                          width: "50%",
                          height: "100%",
                          backgroundImage: `url('/assets/tick.svg')`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      sx={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "14px",
                        lineHeight: "110%",
                        color: "#464D67",
                        fontStyle: "normal",
                        fontWeight: "300",
                        marginTop: "10px",
                        marginLeft: "0px",
                        textAlign: "start",
                      }}
                    >
                      Agree to the T&C of saving the uploaded Audio/Video.
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#464D67',
                        mt: 1,
                        fontWeight: 300,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={() => setOpenPrivacyDialog(true)}
                    >
                      View Privacy Policy
                    </Typography>
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                variant="contained"
                onClick={handleButtonClick}
                sx={{
                  backgroundColor: primaryColor,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'none',
                  borderRadius: 0,
                  height: '56px',
                  '&:hover': {
                    backgroundColor: primaryColor
                  }
                }}
              >
                BEGIN VIDEO SCREENING
              </Button>
            </Box>
          </Box>

          {/* Snackbar Dialog */}
          <Dialog
            open={openSnackbar}
            onClose={() => setOpenSnackbar(false)}
            sx={{
              '& .MuiDialog-paper': {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: 0,
                width: '330px',
                height: '180px',
                fontFamily: 'Plus Jakarta Sans',
              },
            }}
          >
            <DialogTitle sx={{ fontFamily: 'Plus Jakarta Sans', padding: '30px', fontSize: '16px', textAlign: 'center' }}>
              Please select the terms and conditions
            </DialogTitle>
            <DialogActions sx={{ justifyContent: 'center', paddingBottom: '20px' }}>
              <Button
                variant="outlined"
                sx={{
                  margin: '0 12px 15px 0px',
                  borderRadius: '1',
                  backgroundColor: primaryColor,
                  color: 'white',
                  borderColor: primaryColor,
                  fontWeight: 'bold',
                  width: '100px',
                  height: '40px',
                  fontSize: '16px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderColor: primaryColor,
                  },
                  '&:focus': {
                    border: '1px solid black',
                    outline: 'none',
                  },
                }}
                onClick={() => setOpenSnackbar(false)}
              >
                <Typography variant="inherit" sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 'bold', fontSize: '16px' }}>
                  CLOSE
                </Typography>
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={openPrivacyDialog}
            onClose={() => setOpenPrivacyDialog(false)}
            sx={{
              '& .MuiDialog-paper': {
                width: '90%',
                maxWidth: '500px',
                padding: '20px',
                fontFamily: 'Plus Jakarta Sans',
              },
            }}
          >
            <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, pb: 1 }}>
              Privacy Policy
            </DialogTitle>
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', px: 3 }}>
              <Typography fontSize="14px" fontWeight={300} color="#464D67" whiteSpace="pre-line">
                {policy || 'No privacy policy available.'}
              </Typography>
            </Box>
            <DialogActions sx={{ justifyContent: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setOpenPrivacyDialog(false)}
                sx={{
                  backgroundColor: primaryColor,
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: primaryColor,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Box>
    </>
  );
};

export default VideoScreening;
