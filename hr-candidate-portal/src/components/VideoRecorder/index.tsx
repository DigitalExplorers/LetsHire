import { CircularProgress, Typography, Button, Box } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import BlockBackButton from "../BlockBackButton";
import { useBranding } from "../../contexts/BrandingContext";

const VideoRecorder = () => {
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [timer, setTimer] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMinDurationWarning, setShowMinDurationWarning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null); //FOR THE NODEJS :cannot find namespace 
  const streamRef = useRef<MediaStream | null>(null);
  const { token } = useParams<{ token: string }>();

  const API_URL =
    import.meta.env.VITE_API_URL;
  const userId = Cookies.get("userId");
  const access_token = Cookies.get('access_token');
  const {primaryColor } = useBranding();
  

  // Get camera/mic access on mount
  useEffect(() => {
    const getMediaAccess = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        setHasMediaAccess(true);
      } catch (err) {
        alert("Camera/Mic access denied. Please allow to proceed.");
        console.error(err);
      }
    };

    getMediaAccess();

    return () => {
      // Clean up on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Bind stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Timer handling
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  // Auto stop after 60s
  useEffect(() => {
    if (timer >= 60 && recording) {
      stopRecording(false);
    }
  }, [timer, recording]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (showMinDurationWarning) {
      const timeout = setTimeout(() => {
        setShowMinDurationWarning(false);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [showMinDurationWarning]);

  // Start recording
  const startRecording = async () => {
    try {
      if (!stream) return;

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        // Wait a short delay to ensure video loads before capturing a frame
        setTimeout(() => captureThumbnail(url), 500);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setTimer(0);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  // Stop recording
  const stopRecording = (navigateToThankYou = true) => {
    if (timer < 30) {
      setShowMinDurationWarning(true); // show warning
      return;
    }

    setShowMinDurationWarning(false);

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    setRecording(false);
    setMediaRecorder(null);

    // Stop the actual media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStream(null);
    setHasMediaAccess(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (navigateToThankYou) {
      navigate(`/thank-you/${token}`);
    }
  };

  // Capture a frame from the recorded video
  const captureThumbnail = async (videoUrl: string) => {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement("video");
      videoElement.src = videoUrl;
      videoElement.crossOrigin = "anonymous";
      videoElement.muted = true;
      videoElement.playsInline = true;

      videoElement.style.display = "none";
      document.body.appendChild(videoElement); // some browsers require this to render

      videoElement.addEventListener("loadedmetadata", () => {
        videoElement.currentTime = 0.5; // Seek after metadata is loaded
      });

      videoElement.addEventListener("seeked", () => {
        try {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d")!;

          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;

          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageDataUrl = canvas.toDataURL("image/png");
          setThumbnail(imageDataUrl);
          resolve(imageDataUrl);
        } catch (err) {
          reject("Failed to capture frame");
        } finally {
          document.body.removeChild(videoElement); // cleanup
        }
      });

      videoElement.addEventListener("error", () => {
        reject("Video failed to load");
        document.body.removeChild(videoElement);
      });

      videoElement.load(); // trigger the load
    });
  };

  // Upload recorded video
  const uploadVideo = async () => {
    if (!videoBlob || !userId || !access_token) {
      console.error("No recorded video or user ID or access_token found!");
      return;
    }

    // Validate video file size (50MB limit)
    const maxVideoSize = 200 * 1024 * 1024; // 200MB
    if (videoBlob.size > maxVideoSize) {
      alert("Video file size exceeds 500MB limit. Please record a shorter video.");
      return;
    }

    // Validate video MIME type
    const allowedVideoTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
    ];
    if (!allowedVideoTypes.includes(videoBlob.type)) {
      alert(`Invalid video format. Allowed formats: MP4, MOV, AVI, MKV, WebM. Detected: ${videoBlob.type}`);
      return;
    }

    try {
      setIsUploading(true); // Show loader
      const formData = new FormData();
      formData.append("video", videoBlob, "recorded-video.mp4"); // Append video with correct field name  
      formData.append("userId",userId)
      const response = await axios.post(
        `${API_URL}/candidates/upload/video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            'Authorization': `Bearer ${access_token}`,
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        setIsUploading(false);
        navigate(`/thank-you/${token}`);
      } else {
        setIsUploading(false);
        console.error("Failed to upload video:", response.statusText);
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Error uploading video:", error);
    }
  };


  return (
    <>
      <BlockBackButton />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 0,
          width: "100%",
          height: "100dvh",
          zIndex: 1,
          backgroundColor: "#000",
          overflow: "hidden",

          // Even on large screens or desktops, keep the same mobile width
          '@media (min-width: 1024px)': {
            maxWidth: '500px', // optional slight bump for tablets
          },
          '@media (min-width: 1440px)': {
            maxWidth: '500px', // maintain same look
          },
        }}
      >
        {/* Video Preview */}
        {hasMediaAccess && !videoUrl && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Thumbnail after recording */}
        {!recording && videoUrl && thumbnail && (
          <img
            src={thumbnail}
            alt="Video Frame"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Hidden canvas for capturing frame */}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {/* Black background container for text and timer */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px",
            zIndex: 2,
            textAlign: "center",
            height: "65px",
          }}
        >
          <h2
            style={{
              color: "#fff",
              margin: "40px 0",
              fontFamily: 'Plus Jakarta Sans',
              fontSize: "17px",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {recording
              ? "Recording..."
              : videoUrl
                ? "Preview"
                : hasMediaAccess
                  ? "Ready to Record"
                  : "Waiting for camera access..."}
            {/* {!recording && videoUrl ? "Recorded Video" : "Recording..."} */}
          </h2>
        </div>

        {/* Timer */}
        {recording && (
          <div
            style={{
              fontSize: "15px",
              fontFamily: 'Plus Jakarta Sans',
              color: "#fff",
              position: "absolute",
              top: "45px",
              right: "30px",
              backgroundColor: "#D21313",
              padding: "5px 10px",
              zIndex: 2,
              width: "45px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >

            <Typography sx={{ color: "#FFFFFF" }}>{timer}s</Typography>
          </div>
        )}

        {/* Buttons */}
        {showMinDurationWarning && (
          <Typography
            sx={{
              position: "absolute",
              bottom: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "50%",
              backgroundColor: primaryColor,
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              zIndex: 3,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
          >
            Please record for at least 30 seconds before stopping.
          </Typography>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "80%",
          }}
        >
          {/* Start Recording */}
          {!recording && hasMediaAccess && !videoUrl && (
            <div
              onClick={startRecording}
              style={{ cursor: "pointer", display: "flex", justifyContent: "center" }}
            >
              <RecordIcon />
            </div>
          )}

          {/* Stop Recording */}
          {recording && timer < 60 && (
            <div
              onClick={() => stopRecording(false)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "center" }}
            >
              <StopIcon />
            </div>
          )}


          {/* Submit Video */}
          {!recording && videoUrl && (
            <Button
              variant="contained"
              onClick={uploadVideo}
              sx={{
                backgroundColor: primaryColor,
                fontWeight: "bold",
                mt: 2,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Submit Video"}
            </Button>
          )}
        </div>
      </Box>
    </>
  );
};

// Shutter button icon
export const ShutterIcon = () => (
  <svg width="73" height="72" viewBox="0 0 73 72" fill="none">
    <rect x="23.1667" y="23" width="26" height="26" rx="4" fill="#D21313" />
    <path
      d="M72.5 36C72.5 55.8823 56.3823 72 36.5 72C16.6177 72 0.5 55.8823 0.5 36C0.5 16.1177 16.6177 0 36.5 0C56.3823 0 72.5 16.1177 72.5 36ZM4.98105 36C4.98105 53.4074 19.0926 67.519 36.5 67.519C53.9074 67.519 68.019 53.4074 68.019 36C68.019 18.5926 53.9074 4.48105 36.5 4.48105C19.0926 4.48105 4.98105 18.5926 4.98105 36Z"
      fill="#ECDDD5"
    />
  </svg>
);

export const RecordIcon = ({ size = 73 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 73 72" fill="none">
    <circle cx="36.5" cy="36" r="26" fill="#D21313" />
    <circle cx="36.5" cy="36" r="35.5" stroke="#ECDDD5" strokeWidth="3" />
  </svg>
);

export const StopIcon = ({ size = 73 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 73 72" fill="none">
    <circle cx="36.5" cy="36" r="26" fill="#D21313" />
    <rect x="28.5" y="28" width="16" height="16" rx="2" fill="#FFFFFF" />
    <circle cx="36.5" cy="36" r="35.5" stroke="#ECDDD5" strokeWidth="3" />
  </svg>
);


export default VideoRecorder;
