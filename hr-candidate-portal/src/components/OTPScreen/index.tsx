import { useState } from "react";
import { Box, Button, Grid, TextField, Typography, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { useBranding } from "../../contexts/BrandingContext";
import BlockBackButton from "../BlockBackButton";

const OtpPage = () => {
  const API_URL =
    import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { logoUrl, bgImageUrl, primaryColor, orgName } = useBranding();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOtpChange = (e: any) => {
    setOtp(e.target.value);
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const userId = Cookies.get("userId");
      const access_token = Cookies.get("access_token");

      if (!userId || !access_token) {
        setError("Session expired. Please register again.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/candidates/verify-otp`,
        { id: userId, otp },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        navigate(`/begin-test/${token}`);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          overflow: "hidden",
          backgroundColor: primaryColor,
          "@media (min-width: 1024px)": { backgroundColor: "#900000" },
          "@media (min-width: 1440px)": { backgroundColor: "#900000" },
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
            position: "relative",
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
              px: 2,
              pt: "34px",
              pb: "20px",
              zIndex: 1,
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
                objectFit: "contain",
                marginBottom: 16,
              }}
            />
            <Typography
              variant="h6"
              fontSize={"22px"}
              fontWeight={600}
              color="#fff"
              textAlign="center"
            >
              OTP Verification
            </Typography>
            <Typography
              variant="body2"
              fontSize={"14px"}
              color="#fff"
              textAlign="center"
            >
              Enter the OTP that has been sent to your email.
            </Typography>
          </Box>

          {/* Form Section */}
          <Box
            sx={{
              backgroundColor: "#fff",
              borderTopLeftRadius: "15px",
              borderTopRightRadius: "15px",
              flexGrow: 1,
            }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                paddingLeft: "5px",
                paddingRight: "20px",
                paddingBottom: "120px",
                width: "100%",
                m: 0,
              }}
            >
              {/* Enter OTP */}
              <Grid item xs={12}>
                <Box sx={{ paddingTop: "20px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    placeholder="Enter OTP*"
                    value={otp}
                    onChange={handleOtpChange}
                    error={!!error}
                    helperText={error || ""}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box>
            <Grid
              item
              xs={12}
              style={{
                position: "fixed",
                bottom: 0,
                backgroundColor: "#fff",
                paddingBottom: "20px",
                paddingLeft: "20px !important",
                paddingRight: "20px",
                zIndex: 1000,
              }}
              sx={{
                "@media (min-width: 200px)": { width: "100%" },
                "@media (min-width: 1024px)": {
                  width: "485px",
                  paddingRight: "5px !important",
                },
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={isLoading}
                sx={{
                  height: "56px",
                  backgroundColor: primaryColor,
                  fontWeight: "bold",
                  fontSize: "14px",
                  "&:hover": { backgroundColor: primaryColor },
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
                    Verifying...
                  </>
                ) : (
                  "VERIFY OTP"
                )}
              </Button>
            </Grid>
          </Box>

        </Box>
      </Box>
    </>
  );
};

export default OtpPage;
