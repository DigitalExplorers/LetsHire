import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Cookies from "js-cookie";
import { useBranding } from "../../contexts/BrandingContext";
import BlockBackButton from "../BlockBackButton";

const API_URL =
  import.meta.env.VITE_API_URL;

const TestBegin = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [userName, setUserName] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timePerQuestionInSeconds, setTimePerQuestionInSeconds] = useState<number>(45); // default fallback
  const [isLoading, setIsLoading] = useState(true);

  const { logoUrl, bgImageUrl, primaryColor, orgName } = useBranding();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = Cookies.get("userId");
        const access_token = Cookies.get("access_token");
        if (!userId || !access_token) return;

        const userResponse = await axios.get(`${API_URL}/candidates/candidate/${userId}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setUserName(userResponse.data?.firstName || "User");

        const roleId = Cookies.get("selectedRoleId");
        const adminId = localStorage.getItem('urlAdminId');
        const urlRoleId = localStorage.getItem('urlRoleId');
        if (!adminId || !urlRoleId) return;

        const configResponse = await axios.get(`${API_URL}/quiz/app-quiz-config?roleId=${urlRoleId}&adminId=${adminId}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setQuestionCount(configResponse.data?.numberOfQuestions);
        setTimePerQuestionInSeconds(configResponse.data?.timePerQuestionInSeconds || 45);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
          // position: 'fixed',
          // top: '0',
          overflow: "hidden",
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
            {isLoading ? (
              <Typography variant="h6" fontSize={"22px"} fontWeight={600} color="#fff" textAlign="center">
                Loading...
              </Typography>
            ) : (
              <>
                <Typography variant="h6" fontSize={"22px"} fontWeight={600} color="#fff" textAlign="center">
                  Hi {userName}
                </Typography>
                <Typography variant="body2" fontSize={"14px"} color="#fff" textAlign="center">
                  Welcome to your screening test.
                </Typography>
              </>
            )}
          </Box>

          {/* Instruction Section */}
          <Box
            sx={{
              backgroundColor: "#fff",
              borderTopLeftRadius: "15px",
              borderTopRightRadius: "15px",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              pl: "20px",
              pr: "20px",
              pt: 4,
              pb: "120px",
            }}
          >
            {isLoading ? (
              <CircularProgress color="secondary" />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexGrow: 1,
                  height: "100%",
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "24px",
                      color: "#464D67",
                      fontWeight: "400",
                      textAlign: "left",
                      fontStyle: "normal",
                      lineHeight: "120%",
                      mb: 2,
                    }}
                  >
                    Instructions:
                  </Typography>
                  <ul
                    style={{
                      textAlign: "left",
                      fontSize: "18px",
                      lineHeight: "130%",
                      fontWeight: "300",
                      color: "#000",
                      fontFamily: "Plus Jakarta Sans",
                      paddingLeft: "20px",
                      marginTop: "10px",
                      marginBottom: "24px",
                    }}
                  >
                    <li>
                      Answer {questionCount ?? "Loading..."} MCQs in{" "}
                      {questionCount ? (questionCount * 45 / 60).toFixed(2) : "Loading..."} minutes ({timePerQuestionInSeconds} seconds per question).
                    </li>
                    <li>After completing the MCQs, proceed to the Video Screening round.</li>
                    <li>Record and upload your pitch in the live video.</li>
                  </ul>
                </Box>
              </Box>
            )}
          </Box>

          {/* Button */}
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
                "@media (min-width: 200px)": {
                  width: "100%",
                },
                "@media (min-width: 1024px)": {
                  width: "485px",
                  paddingRight: "5px !important",
                },
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/test/${token}`)}
                sx={{
                  backgroundColor: primaryColor,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  textTransform: "none",
                  borderRadius: 0,
                  py: 1.4,
                  "&:hover": {
                    backgroundColor: primaryColor,
                    opacity: 0.9,
                  },
                }}
              >
                BEGIN TEST
              </Button>
            </Grid>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default TestBegin;
