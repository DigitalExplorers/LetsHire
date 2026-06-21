import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Dialog, DialogActions, DialogTitle } from '@mui/material';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useBranding } from '../../contexts/BrandingContext';
import BlockBackButton from '../BlockBackButton';

interface QuizOption {
  id: number;
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: Record<string, QuizOption>;
}

const QuizPage = () => {
  const { logoUrl, bgImageUrl, primaryColor } = useBranding();
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const { token } = useParams<{ token: string }>();

  const navigate = useNavigate();
  const API_URL =
    import.meta.env.VITE_API_URL;
  const adminId = Cookies.get('urlAdminId');
  const urlRoleId = Cookies.get('urlRoleId');

  // Anti-cheat setup
  useEffect(() => {
    const handleViolation = (reason: string) => {
      setViolationMessage(reason);
      setOpenSnackbar(true);
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Copy attempt detected!');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Paste attempt detected!');
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Right-click attempt detected!');
    };
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      handleViolation('Text selection attempt detected!');
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab switch or window change detected!');
      }
    };
    const requestFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen();
      document.removeEventListener('click', requestFullScreen);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', requestFullScreen);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', requestFullScreen);
    };
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const roleId = Cookies.get("selectedRoleId") ?? urlRoleId;
        const access_token = Cookies.get("access_token");
        const userId = Cookies.get('userId');
        if (!roleId || !access_token) return;

        const response = await axios.get(`${API_URL}/quiz/questions-by-role-to-app?roleId=${urlRoleId}&adminId=${adminId}&userId=${userId}`, {
          headers: { Authorization: `Bearer ${access_token}` },
          withCredentials: true,
        });

        setQuestions(response.data);
        setTimeLeft(response.data.length * 45);
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [urlRoleId, adminId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && questions.length !== 0) {
      submitQuiz();
      navigate(`/video-screening/${token}`);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (key: string) => {
    setSelectedOption(key);
  };

  const handleNext = async () => {
    if (!selectedOption) return setOpenSnackbar(true);
    const access_token = Cookies.get('access_token');
    const currentQ = questions[currentQuestionIndex];
    if (!access_token || !currentQ) return;

    const selectedOptionId = currentQ.options[selectedOption]?.id;

    try {
      const res = await axios.post(`${API_URL}/quiz/submit-answer`, {
        quizId: currentQ.id,
        selectedOptionId,
      }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setScore((prev) => prev + (res.data?.isCorrect ? 1 : 0));
    } catch (err) {
      console.error(err);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      await submitQuiz();
      navigate(`/video-screening/${token}`);
    }
  };

  const handleSkip = async () => {
    const access_token = Cookies.get('access_token');
    const currentQ = questions[currentQuestionIndex];

    if (!access_token || !currentQ) return;

    try {
      await axios.post(`${API_URL}/quiz/submit-answer`, {
        quizId: currentQ.id,
        selectedOptionId: null,  // <== explicitly passing null for skip
        skipped: true,
      }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (err) {
      console.error('Error submitting skipped answer:', err);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      await submitQuiz();
      navigate(`/video-screening/${token}`);
    }
  };


  const submitQuiz = async () => {
    const userId = Cookies.get('userId');
    const urlOrgId = Cookies.get("urlOrgId");
    const access_token = Cookies.get('access_token');
    if (!userId || !access_token) return;

    try {
      await axios.post(`${API_URL}/interviews/submit-screening`, {
        candidateId: userId,
        score,
        feedback: 'Screening round submitted successfully!',
        status: 'Completed',
        createdBy: { id: adminId },
        organization: {id: urlOrgId}
      }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  return (
    <>
      <BlockBackButton />
      <Box sx={{ height: '100vh', minHeight: '100dvh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Plus Jakarta Sans', overflow: 'hidden', backgroundColor: primaryColor,
        '@media (min-width: 1024px)': {
          backgroundColor: '#900000',
        },

        '@media (min-width: 1440px)': {
          backgroundColor: '#900000',
        },
      }}>
        <Box sx={{ width: '100%', height: '100%', backgroundImage: `url(${bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'top', backgroundRepeat: 'no-repeat', display: 'flex', flexDirection: 'column', overflowY: 'scroll', '@media (min-width: 1024px)': { width: '500px' }, '@media (min-width: 1440px)': { width: '500px' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '34px', pb: '16px' }}>
            <img src={logoUrl} alt="Logo" style={{ maxHeight: 80, maxWidth: 170, width: 'auto', height: 'auto', objectFit: "contain", marginBottom: 16 }} />
            {isLoading ? (
              <Typography fontSize="22px" color="#fff">Loading...</Typography>
            ) : questions.length === 0 ? (
              <Typography fontSize="22px" color="#fff">No questions found</Typography>
            ) : (
              <>
                <Typography fontSize="22px" color="#fff" fontWeight={400}>Time Remaining</Typography>
                <Typography fontSize="32px" color="#fff" fontWeight={600}>{formatTime(timeLeft)}</Typography>
              </>
            )}
          </Box>

          <Box sx={{ backgroundColor: '#fff', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', flexGrow: 1, pl: '20px', pr: '20px', pt: 4, pb: '120px' }}>
            {isLoading ? (
              <CircularProgress color="secondary" />
            ) : questions.length > 0 ? (
              <Box>
                <Typography variant="h1" sx={{ color: "#000", marginBottom: 2, fontSize: "18px", fontWeight: 400, lineHeight: "24px", textAlign: "left" }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div><span>{currentQuestionIndex + 1}.{" "}</span></div>
                    <div style={{ marginLeft: '0px' }}>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {questions[currentQuestionIndex]?.question}
                      </span>
                    </div>
                  </div>
                </Typography>

                {Object.entries(questions[currentQuestionIndex].options).map(([key, option]: any) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleOptionSelect(key)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        padding: '12px 16px',
                        textTransform: 'none',
                        fontWeight: 400,
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d1d1',
                        backgroundColor: selectedOption === key ? primaryColor : 'transparent',
                        color: selectedOption === key ? '#fff' : '#000',
                        '&:hover': {
                          backgroundColor: selectedOption === key ? primaryColor : 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', lineHeight: '20px', textAlign: 'left', fontFamily: 'Plus Jakarta Sans', color: selectedOption === key ? '#fff' : '#000' }}>
                        {key.toUpperCase()}. {option.text}
                      </Typography>
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center">
                <Typography>Please check with the admin. Try again later.</Typography>
              </Box>
            )}
          </Box>

          {!isLoading && (
            <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: '0 20px 20px', zIndex: 1000, '@media (min-width: 1024px)': { width: '460px', margin: '0 auto', left: '0', right: '0', } }}>
              {questions.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Button variant="outlined" onClick={handleSkip} sx={{ color: '#000', borderColor: '#000', textTransform: 'none', fontWeight: 'bold', borderRadius: '4px', width: '48%', height: '56px' }}>SKIP</Button>
                  <Button variant="contained" onClick={handleNext} sx={{ backgroundColor: primaryColor, color: 'white', textTransform: 'none', fontWeight: 'bold', borderRadius: '4px', width: '48%', height: '56px', '&:hover': { backgroundColor: primaryColor } }}>
                    {currentQuestionIndex < questions.length - 1 ? 'NEXT' : 'SUBMIT'}
                  </Button>
                </Box>
              ) : (
                <Button fullWidth variant="contained" onClick={() => navigate(`/registration/${token}`)} sx={{ backgroundColor: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '16px', textTransform: 'none', borderRadius: '4px', height: '56px' }}>BACK TO REGISTRATION</Button>
              )}
            </Box>
          )}

          <Dialog open={openSnackbar} 
            onClose={() => {
              setOpenSnackbar(false);
              setViolationMessage('');
            }}
            sx={{ '& .MuiDialog-paper': { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0, width: '330px', height: '190px', fontFamily: 'Plus Jakarta Sans' } }}>
            <DialogTitle sx={{ fontFamily: 'Plus Jakarta Sans', padding: '30px', fontSize: '18px', textAlign: 'center' }}>
              {violationMessage || 'Please select an appropriate answer to proceed'}
            </DialogTitle>
            <DialogActions sx={{ justifyContent: 'center', paddingBottom: '20px' }}>
              <Button variant="outlined" 
                onClick={() => {
                  setOpenSnackbar(false);
                  setViolationMessage('');
                }}
                sx={{ borderRadius: 1, backgroundColor: primaryColor, color: 'white', borderColor: primaryColor, fontWeight: 'bold', width: '100px', height: '40px', fontSize: '16px', textTransform: 'none', '&:hover': { backgroundColor: primaryColor, color: 'white' }, '&:focus': { border: '1px solid black', outline: 'none' } }}>
                <Typography variant="inherit" sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 'bold', fontSize: '16px' }}>CLOSE</Typography>
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </>
  );
};

export default QuizPage;
