import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import BlockBackButton from "../BlockBackButton";
import { useBranding } from "../../contexts/BrandingContext";

const ThankYouScreen = () => {

  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { logoUrl, bgImageUrl, primaryColor } = useBranding();

  useEffect(() => {
    Cookies.remove("userId");
    Cookies.remove("selectedRoleId");
    Cookies.remove("access_token");
    setTimeout(() => {
      localStorage.removeItem('userExamStartTime');
      localStorage.removeItem('userExamAllowedDuration');
    }, 500);
  }, []);

  return (
    <>
      <BlockBackButton />
    <Box
      sx={{
        height: "100vh",
        minHeight: "100dvh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Plus Jakarta Sans",
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
          width: "100%",
          height: "100%",
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
          overflowY: "scroll",
          "@media (min-width: 1024px)": { width: "500px" },
          "@media (min-width: 1440px)": { width: "500px" },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: "34px",
            pb: "20px",
            flexShrink: 0,
          }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            style={{
              maxWidth: "170px",
              maxHeight: "80px",
              width: "auto",
              height: "auto",
              objectFit: "contain",
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
            Registration Successful!
          </Typography>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderTopLeftRadius: "15px",
            borderTopRightRadius: "15px",
            flexGrow: 1,
            px: 3,
            pt: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pb: "120px",
          }}
        >
          <Box textAlign="center" mt={6} px={2}>
            <Typography
              variant="body1"
              sx={{
                fontSize: "20px",
                color: "#464D67",
                fontWeight: 500,
                lineHeight: "140%",
                fontStyle: "normal",
                mb: 2,
              }}
            >
              Thank you for registering. We’ve received your details successfully.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "16px",
                color: "#464D67",
                fontWeight: 400,
                lineHeight: "130%",
              }}
            >
              You will receive a confirmation email shortly with your submission details.
              We’ll review your application and contact you soon.
            </Typography>
          </Box>

          {/* Footer Button */}
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              zIndex: 1000,
              padding: "0px 20px 20px",
              "@media (min-width: 1024px)": {
                width: "460px",
                margin: "0 auto",
              },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate(`/registration/${token}`)}
              sx={{
                backgroundColor: primaryColor,
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                textTransform: "none",
                borderRadius: 0,
                py: 1.4,
              }}
            >
              BACK TO REGISTRATION
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default ThankYouScreen;
