import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const ScoreBoard = () => {
  const [score, setScore] = useState<number | null>(null);
  const [analysisDataList, setAnalysisDataList] = useState<string[]>([]); // Stores all data as an array
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL;
  const userId = Cookies.get("userId");

  useEffect(() => {
    if (!userId) {
      console.error("User ID not found in cookies");
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API_URL}/candidates/candidate/${userId}`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setScore(response.data.score);
        console.log("Video Analytics:", response.data);

        const videoAnalysis =
          response.data.videoAnalysis.result?.video_analysis || [];
        const audioAnalysis =
          response.data.videoAnalysis.result?.audio_analysis || {};

        let analysisArray: string[] = [];

        // Add the most repeated video analysis result
        const mostRepeated = getMostRepeatedAnalysis(videoAnalysis);

        if (mostRepeated) analysisArray.push(`${mostRepeated}`);
        if (Array.isArray(analysisArray) && analysisArray.length > 0) {
          analysisArray = analysisArray[0]
            .split(",")
            .map((item) => item.trim());
        }

        // Add Fluency Rating, Tone Rating, and Transcript as separate list items
        if (audioAnalysis.fluency_rating)
          analysisArray.push(`Fluency Rating: ${audioAnalysis.fluency_rating}`);
        if (audioAnalysis.tone_rating)
          analysisArray.push(`Tone Rating: ${audioAnalysis.tone_rating}`);
        if (audioAnalysis.transcript)
          analysisArray.push(`Transcript: ${audioAnalysis.transcript}`);

        setAnalysisDataList(analysisArray);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };

    fetchResults();
  }, [userId]);

  // Function to get the most repeated video analysis entry
  const getMostRepeatedAnalysis = (analysis: string[][]) => {
    const flatData = analysis.flat().filter(Boolean); // Flatten and remove empty entries
    if (flatData.length === 0) return "No Data Available";

    const countMap = flatData.reduce<Record<string, number>>((acc, entry) => {
      acc[entry] = (acc[entry] || 0) + 1;
      return acc;
    }, {});

    // Find the most repeated item
    return Object.keys(countMap).reduce((a, b) =>
      countMap[a] > countMap[b] ? a : b
    );
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        margin: "0px !important",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Box
          sx={{
            padding: "0px",
            position: "relative",
            margin: "0px",
            width: "100%",
            maxWidth: "400px",
            "@media (max-width: 600px)": {
              width: "100%",
            },
          }}
        >
          {/* <img
            src={ResultBG}
            alt="Background"
            style={{ width: "100%", height: "100vh", objectFit: "cover" }}
          /> */}
                  <div style={{ width: "396px", height: "100vh",backgroundColor:'white',}}/>


          <Box
            sx={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -30%)",
              width: "80%",
              maxWidth: "311px",
              textAlign: "center",
              color: "#000",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "-120px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src="/assets/THE8800-logo-final.png"
                alt="THE8800 Logo"
                style={{ width: "132px", height: "80px", marginLeft: "15px" }}
              />
            </Box>
            {/* Display Score */}
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Space Grotesk",
                fontWeight: 400,
                fontSize: "36px",
                marginTop: "10px",
                  fontStyle: "normal",
                lineHeight: "110%",
              }}
            >
              Your Score: {score !== null ? `${score}/5` : "Loading..."}
            </Typography>

            {/* Analysis Data List */}
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Space Grotesk",
                fontWeight: 400,
                fontSize: "20px",
                lineHeight: "120%",
                fontStyle: "normal",
                marginTop: "20px",
              }}
            >
              Video Analysis Data:
            </Typography>

            <Box
              sx={{
                backgroundColor: "#7676FF",
                padding: "10px",
                borderRadius: "10px",
                marginTop: "30px",
                maxHeight: "250px",
                overflowY: "auto",
                textAlign: "left",
              }}
            >
              {analysisDataList.length > 0 ? (
                analysisDataList.map((item, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#464D67",
                      padding: "5px",
                    }}
                  >
                    {item}
                  </Typography>
                ))
              ) : (
                <Typography sx={{ color: "#464D67" }}>Processing...</Typography>
              )}
            </Box>
          </Box>

      
        </Box>
      </Box>
    </div>
  );
};

export default ScoreBoard;
