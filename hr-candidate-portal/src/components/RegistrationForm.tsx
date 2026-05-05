import { useEffect, useState } from 'react';
import {
  TextField,
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Autocomplete,
  Popper,
  styled,
  DialogActions,
  Dialog,
  DialogTitle,
} from '@mui/material';
import axios from 'axios';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useBranding } from '../contexts/BrandingContext'; // Adjust this path based on your structure

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 1949 }, (_, i) => (currentYear - i).toString()); // Convert to string
};

const passedOutYears = generateYears();


const qualifications = [
  // Undergraduate Degrees
  'High School Diploma',
  'Associate Degree',
  'Bachelor of Science (B.Sc.)',
  'Bachelor of Arts (B.A.)',
  'Bachelor of Technology (B.Tech)',
  'Bachelor of Engineering (B.E.)',
  'Bachelor of Computer Applications (BCA)',
  'Bachelor of Business Administration (BBA)',
  'Bachelor of Commerce (B.Com)',
  'Bachelor of Fine Arts (BFA)',
  'Bachelor of Architecture (B.Arch)',
  'Bachelor of Science in Information Technology (B.Sc IT)',
  'Bachelor of Science in Computer Science (B.Sc CS)',
  'Bachelor of Social Work (BSW)',
  'Bachelor of Pharmacy (B.Pharm)',
  'Bachelor of Education (B.Ed)',
  'Bachelor of Law (LLB)',

  // Postgraduate Degrees
  'Master of Science (M.Sc.)',
  'Master of Arts (M.A.)',
  'Master of Technology (M.Tech)',
  'Master of Engineering (M.E.)',
  'Master of Computer Applications (MCA)',
  'Master of Business Administration (MBA)',
  'Master of Commerce (M.Com)',
  'Master of Fine Arts (MFA)',
  'Master of Architecture (M.Arch)',
  'Master of Science in Information Technology (M.Sc IT)',
  'Master of Science in Computer Science (M.Sc CS)',
  'Master of Social Work (MSW)',
  'Master of Pharmacy (M.Pharm)',
  'Master of Education (M.Ed)',
  'Master of Law (LLM)',
  'Doctor of Philosophy (Ph.D.)',

  // Diplomas & Certifications
  'Diploma in Computer Science',
  'Diploma in Electronics & Communication',
  'Diploma in Information Technology',
  'Diploma in Software Development',
  'Diploma in Web Development',
  'Diploma in UI/UX Design',
  'Diploma in Data Science',
  'Diploma in AI & ML',
  'Diploma in Cyber Security',
  'Diploma in DevOps',
  'Diploma in Digital Marketing',
  'Diploma in Networking & Cloud Computing',
  'Diploma in Graphic Design',
  'Diploma in Mobile App Development',
  'Diploma in Ethical Hacking',
  'Diploma in Financial Management',
  'Diploma in HR Management',

  // Specialized Certifications
  'Certificate in AI & ML',
  'Certificate in Cyber Security',
  'Certificate in Cloud Computing',
  'Certificate in Data Analytics',
  'Certificate in Blockchain Technology',
  'Certificate in Ethical Hacking',
  'Certificate in Digital Marketing',
  'Certificate in Web Development',
  'Certificate in UI/UX Design',
  'Certificate in Python Programming',
  'Certificate in Java Development',
  'Certificate in SQL & Database Management',
  'Certificate in Agile & Scrum',
  'Certificate in AWS & Cloud Security',
  'Certificate in Software Testing (QA)',
  'Other',
];

type Role = {
  id: number;
  name: string;
};

type ResolvedRegistrationLink = {
  adminId: number;
  roleId: number;
  roleName: string | null;
  organizationId: number;
  examStartTime?: string | null;
  examEndTime?: string | null;
};

function RegistrationForm() {
  const { token } = useParams<{ token: string }>();
  const branding = useBranding();

  const [adminId, setAdminId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [organizationId, setOrgId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+91',
    phoneNumber: '',
    email: '',
    currentCity: '',
    desiredRole: '',
    workExperience: '',
    yearOfPassedOut: '',
    passPercentage: '',
    resume: null as File | null,
    idProof: null as File | null,
  });
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneContact?: string;
    phoneNumber?: string;
    email?: string;
    qualification?: string;
    yearOfPassedOut?: string;
    passPercentage?: string;
    currentCity?: string;
    desiredRole?: string;
    workExperience?: string;
    resume?: string;
  }>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);
  const [loadingDropdown, setLoadingDropDown] = useState<boolean>(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isUploading, setIsUploading] = useState(false); // Loader state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const CITY_API_URL = 'https://api.countrystatecity.in/v1/countries/IN/cities';
  const CITY_API_KEY = 'OUVxOXBzUjI1Q3NOVDZRaVRiV002NTVUQXdYSDBiWVJDYnN4NVc3WQ==';
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCities = async () => {
    try {
      const response = await axios.get(CITY_API_URL, {
        headers: {
          'X-CSCAPI-KEY': CITY_API_KEY,
        },
      });

      const cityNames = response.data.map((city: any) => city.name);

      // Ensure unique city names
      const uniqueCities = [...new Set(cityNames as string[])];

      setCities(uniqueCities);
    } catch (error) {
      // API unavailable — freeSolo allows manual typing as fallback
      console.warn('City API unavailable, manual input enabled:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    const resolveToken = async () => {
      try {
        const res = await fetch(`${API_URL}/registration-link/resolve/${token}`);
        const data = await res.json();

        if (res.ok) {
          const resolvedData = data as ResolvedRegistrationLink;

          // Save to localStorage or state
          localStorage.setItem('urlAdminId', String(resolvedData.adminId));
          localStorage.setItem('urlRoleId', String(resolvedData.roleId));
          localStorage.setItem('urlOrgId', String(resolvedData.organizationId));

          setAdminId(resolvedData.adminId);
          setRoleId(resolvedData.roleId);
          setOrgId(resolvedData.organizationId);

          if (resolvedData.roleName) {
            const resolvedRole = { id: resolvedData.roleId, name: resolvedData.roleName };
            setRoles([resolvedRole]);
            setFormData((prev) => ({ ...prev, desiredRole: resolvedData.roleName ?? '' }));
            Cookies.set('selectedRoleId', String(resolvedData.roleId), { expires: 7 });
          } else {
            setRoles([]);
          }

          setLoadingDropDown(false);
        } else {
          console.error('Token not valid:', data.message);
          setLoadingDropDown(false);
        }
      } catch (err) {
        console.error('Error resolving token:', err);
        setLoadingDropDown(false);
      }
    };

    if (token) {
      localStorage.setItem('urlToken', token);
      resolveToken();
    }
  }, [token]);

  useEffect(() => {
    fetchCities();
  }, []);

  const navigate = useNavigate();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (event: any) => {
    const { name } = event.target; // Get the name of the input field (resume or idProof)
    const file = event.target.files[0]; // Get the uploaded file

    if (file) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: file, // Dynamically update the correct field
      }));
    }
  };

  const handleFileRemove = (field: string) => {
    setFormData({ ...formData, [field]: '' });
  };

  const checkUserExists = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await axios.get(
        `${API_URL}/candidates/check-email?email=${encodedEmail}&token=${token}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      );

      return response.data.exists; // Will be true if the email exists, false otherwise
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false; // If an error occurs, assume user doesn't exist
    }
  };

  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.firstName) newErrors.firstName = 'First Name is required';
    if (!formData.lastName) newErrors.lastName = 'Last Name is required';
    if (
      !formData.countryCode ||
      !/^\+\d{1,4}$/.test(formData.countryCode) ||
      !formData.phoneNumber ||
      formData.phoneNumber.length !== 10
    ) {
      newErrors.phoneContact = 'Enter a valid country code (e.g., +91) and 10-digit phone number';
    }
    if (!formData.email) newErrors.email = 'Email ID is required';
    if (!formData.currentCity) newErrors.currentCity = 'Native City is required';
    if (!formData.desiredRole) newErrors.desiredRole = 'Desired Role is required';
    if (!formData.yearOfPassedOut)
      newErrors.yearOfPassedOut = 'Graduation Pass Out Year is required';
    if (
      !formData.passPercentage ||
      isNaN(Number(formData.passPercentage)) ||
      Number(formData.passPercentage) <= 0 ||
      Number(formData.passPercentage) > 100
    ) {
      newErrors.passPercentage = 'Enter a valid graduation percentage (1–100)';
    }
    if (!formData.workExperience) newErrors.workExperience = 'Work Experience is required';
    if (!formData.resume) newErrors.resume = 'Resume is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextPage = async () => {
    // setOpenSnackbar(true);

    if (!validateForm()) {
      return;
    }

    try {
      const userExists = await checkUserExists(formData.email);

      if (userExists) {
        setOpenSnackbar(true);

        setErrors((prevErrors) => ({
          ...prevErrors,
          // email: "This email is already registered."
        }));
        return;
      }

      setIsUploading(true);
      const data = new FormData();

      // Append form fields to FormData
      data.append('email', formData.email);
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('countryCode', formData.countryCode);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('currentCity', formData.currentCity);
      data.append('desiredRole', formData.desiredRole);
      data.append('workExperience', formData.workExperience);
      data.append('yearOfPassedOut', formData.yearOfPassedOut);
      data.append('passPercentage', formData.passPercentage);
      if (formData.resume) {
        data.append('resume', formData.resume);
      }
      if (formData.idProof) {
        data.append('idProof', formData.idProof);
      }

      const response = await axios.post(
        `${API_URL}/candidates?adminId=${adminId}&organizationId=${organizationId}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        },
      );

      if (response.status === 200 || response.status === 201) {
        const userId = response.data.userId; // Adjust based on your API response structure
        Cookies.set('userId', userId, { expires: 7 });
        Cookies.set('access_token', response.data.access_token, { expires: 7 });
        // navigate(`/otp/${token}`);
        // Auto-verify OTP in background
        try {
          const verifyResponse = await axios.post(
            `${API_URL}/candidates/verify-otp`,
            { id: userId, otp: '999999' },
            {
              headers: {
                Authorization: `Bearer ${response.data.access_token}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            },
          );

          setIsUploading(false);

          if (verifyResponse.data.success) {
            navigate(`/begin-test/${token}`);
          } else {
            navigate(`/otp/${token}`); // fallback only if verify fails
          }
        } catch (err) {
          navigate(`/otp/${token}`); // fallback
        }
      } else {
        setIsUploading(false);
        console.warn('Unexpected response:', response);
      }
    } catch (error) {
      setIsUploading(false);
      console.error(error); // Handle error
    }
  };

  const CustomPopper = styled(Popper)({
    border: "1.1px solid #000",
    borderRadius: "4px",
    //backgroundColor: "#fff", // Ensure background remains white

  });

  return (
    <>
      <Box
        sx={{
          height: '100vh',
          minHeight: '100dvh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Plus Jakarta Sans',
          // position: 'fixed',
          // top: '0',
          backgroundColor: '#ad3444',
          overflow: 'hidden',
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
            backgroundImage: `url(${branding.bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',

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
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 2,
              pt: '34px',
              pb: '20px',
              zIndex: 1,
              flexShrink: 0,        // Prevent from shrinking
            }}
          >

            <img src={branding.logoUrl} alt="THE8800 Logo" style={{
              maxWidth: '170px',
              maxHeight: '80px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              marginBottom: 16,
            }} />
            <Typography variant="h6" fontFamily={'Plus Jakarta Sans'} fontWeight={600} color="#fff" lineHeight={'125%'} fontSize={'22px'} textAlign="center">
              Welcome to {branding.orgName} Hiring
            </Typography>
            <Typography variant="body2" fontFamily={'Plus Jakarta Sans'} fontSize={'14px'} color="#fff" textAlign="center">
              Kindly fill all the details required in the form below.
            </Typography>
          </Box>

          {/* Scrollable Form Section */}
          <Box
            sx={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
              // height: 'calc(100% - 230px)', // <-- subtract header height
              // overflowY: 'auto',
              flexGrow: 1
            }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                paddingRight: '20px',
                paddingBottom: '210px',
                width: '100%',
                m: 0,
              }}
            >
              {/* First Name */}
              <Grid item xs={6}>
                <Box sx={{ paddingTop: '5px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="firstName"
                    placeholder='First Name*'
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName || ""}
                  />
                </Box>
              </Grid>

              {/* Last Name */}
              <Grid item xs={6}>
                <Box sx={{ paddingTop: '5px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="lastName"
                    placeholder="Last Name*"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName || ""}
                  />
                </Box>
              </Grid>

              {/* Country Code and Phone Number */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box flexShrink={0} width="18%">
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          name="countryCode"
                          placeholder='Code*'
                          value={formData.countryCode}
                          onChange={handleInputChange}
                          error={!!errors.phoneContact}
                        />
                      </Box>
                      <Box flexGrow={1}>
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          name="phoneNumber"
                          placeholder='Phone Number*'
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          error={!!errors.phoneContact}
                        />
                      </Box>
                    </Box>
                    {!!errors.phoneContact && (
                      <Typography
                        fontSize="12px"
                        display={'flex'}
                        sx={{ color: '#d32f2f' }}
                      >
                        {errors.phoneContact}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Email ID */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="email"
                    placeholder='Email ID*'
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email || ""}
                  />
                </Box>
              </Grid>

              {/* Native City */}
              <Grid item xs={6}>
                <Box sx={{ marginBottom: '0px' }}>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={cities}
                    getOptionLabel={(option) => option}
                    loading={loadingCities}
                    value={formData.currentCity || undefined}
                    disableClearable
                    open={cityDropdownOpen && cities.length > 0}
                    onOpen={() => setCityDropdownOpen(true)}
                    onClose={() => setCityDropdownOpen(false)}
                    onInputChange={(_, newInputValue) =>
                      setFormData({ ...formData, currentCity: newInputValue || '' })
                    }
                    onChange={(_, newValue) =>
                      setFormData({ ...formData, currentCity: (newValue as string) || '' })
                    }
                    PopperComponent={CustomPopper}
                    popupIcon={<KeyboardArrowDownIcon sx={{ color: '#999', fontSize: 24 }} />}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Native City*"
                        fullWidth
                        size="small"
                        error={!!errors.currentCity}
                        helperText={errors.currentCity || ""}
                      />
                    )}
                  />

                </Box>
              </Grid>
              {/* Graduation Pass Out Year */}
              <Grid item xs={6}>
                <Box sx={{ marginBottom: '0px' }}>
                  <Autocomplete
                    fullWidth
                    options={passedOutYears.map(String)}
                    getOptionLabel={(option) => option}
                    value={formData.yearOfPassedOut || undefined}
                    disableClearable
                    open={yearDropdownOpen}
                    onOpen={() => setYearDropdownOpen(true)}
                    onClose={() => setYearDropdownOpen(false)}
                    onChange={(event, newValue) =>
                      setFormData({ ...formData, yearOfPassedOut: newValue || "" })
                    }
                    PopperComponent={CustomPopper}
                    popupIcon={<KeyboardArrowDownIcon sx={{ color: '#999', fontSize: 24 }} />}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Year of Graduation*"
                        fullWidth
                        size="small"
                        error={!!errors.yearOfPassedOut}
                        helperText={errors.yearOfPassedOut || ""}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            '& input': {
                              padding: '2.5px 0px 2.5px 0px !important'
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* Graduation Percentage (1-100) */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="passPercentage"
                    placeholder="Graduation Percentage (1-100)*"
                    type="number"
                    value={formData.passPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                        setFormData({ ...formData, passPercentage: value });
                      }
                    }}
                    error={!!errors.passPercentage}
                    helperText={errors.passPercentage || ''}
                    InputProps={{
                      endAdornment: (
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          %
                        </Typography>
                      ),
                      inputProps: {
                        step: "0.01",
                        min: "0",
                        max: "100"
                      },
                      sx: {
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* Desired Role */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="desiredRole"
                    placeholder="Desired Role*"
                    value={formData.desiredRole}
                    disabled
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#000', // ensures text is visible even when disabled
                      },
                    }}
                    error={!!errors.desiredRole}
                    helperText={errors.desiredRole || ''}
                  />
                </Box>
              </Grid>

              {/* Work Experience */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    name="workExperience"
                    type="number"
                    value={formData.workExperience}
                    placeholder="Work Exp. (in years)?*"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
                        setFormData({ ...formData, workExperience: value });
                      }
                    }}
                    error={!!errors.workExperience}
                    helperText={errors.workExperience || ''}
                    InputProps={{
                      inputProps: {
                        style: {
                          MozAppearance: 'textfield',
                        },
                      },
                      sx: {
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* Upload Resume */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      {/* File name (readonly input style) */}
                      <TextField
                        fullWidth
                        size="small"
                        margin="dense"
                        value={formData.resume ? formData.resume.name : ''}
                        placeholder="Resume*"
                        error={!!errors.resume}
                        sx={{
                          height: '57px',
                          '& .MuiInputBase-input': {
                            fontFamily: 'Plus Jakarta Sans',
                            color: '#000',
                            height: '35px',
                            '&::placeholder': {
                              color: '#000',
                              opacity: 1,
                              fontSize: '14px',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#000',
                            marginLeft: '0px !important',
                          },
                        }}
                        InputProps={{
                          readOnly: true,
                          endAdornment: formData.resume && (
                            <img
                              src="/assets/close.svg"
                              alt="Remove file"
                              onClick={() => {
                                setFormData({ ...formData, resume: null });
                              }}
                              style={{
                                cursor: 'pointer',
                                height: '13px',
                                width: '17px',
                                filter: 'brightness(0) saturate(0%)',
                              }}
                            />
                          ),
                        }}
                      />

                      {/* Upload Button */}
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{
                          color: '#000',
                          borderColor: 'rgba(28, 55, 90, 0.16)',
                          textTransform: 'none',
                          fontFamily: 'Plus Jakarta Sans',
                          fontSize: '11px',
                          fontWeight: '300',
                          height: '49px',
                          width: '70px',
                          borderRadius: 0,
                          padding: '5px',
                          minWidth: 'unset',
                          '&:hover': {
                            backgroundColor: branding.primaryColor,
                            color: '#FFFFFF',
                            border: 'none',
                          },
                        }}
                      >
                        <img
                          src="/assets/upload.svg"
                          alt="Upload"
                          style={{
                            height: '20px',
                            width: '20px',
                            filter: 'brightness(0) saturate(0%)',
                          }}
                        />
                        <input hidden type="file" name="resume" onChange={handleFileChange} />
                      </Button>
                    </Box>

                    {!!errors.resume && (
                      <Typography
                        fontSize="12px"
                        sx={{ color: '#d32f2f', textAlign: 'left', marginTop: '-8px' }}
                      >
                        {errors.resume}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Aadhaar or PAN Upload */}
              <Grid item xs={12}>
                <Box sx={{ marginBottom: '0px' }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      margin="dense"
                      placeholder="Aadhaar or PAN"
                      value={formData.idProof ? formData.idProof.name : ''}
                      sx={{
                        height: '57px',
                        '& .MuiInputBase-input': {
                          fontFamily: 'Plus Jakarta Sans',
                          color: '#000',
                          height: '35px',
                          '&::placeholder': {
                            color: '#000',
                            fontSize: '14px',
                            opacity: 1,
                          },
                        },
                      }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: formData.idProof && (
                          <img
                            src="/assets/close.svg"
                            alt="Remove file"
                            onClick={() => {
                              setFormData({ ...formData, idProof: null });
                            }}
                            style={{
                              cursor: 'pointer',
                              height: '13px',
                              width: '17px',
                              filter: 'brightness(0) saturate(0%)',
                            }}
                          />
                        ),
                      }}
                    />

                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        color: '#000',
                        borderColor: 'rgba(28, 55, 90, 0.16)',
                        textTransform: 'none',
                        fontFamily: 'Plus Jakarta Sans',
                        fontSize: '11px',
                        fontWeight: '300',
                        height: '49px',
                        width: '70px',
                        borderRadius: 0,
                        padding: '5px',
                        minWidth: 'unset',
                        '&:hover': {
                          backgroundColor: branding.primaryColor,
                          color: '#FFFFFF',
                          border: 'none',
                        },
                      }}
                    >
                      <img
                        src="/assets/upload.svg"
                        alt="Upload"
                        style={{
                          height: '20px',
                          width: '20px',
                          filter: 'brightness(0) saturate(0%)',
                        }}
                      />
                      <input hidden type="file" name="idProof" onChange={handleFileChange} />
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box>
            <Grid
              item
              xs={12}
              style={{
                position: 'fixed',
                bottom: 0,
                backgroundColor: '#fff',
                padding: '16px 15px',
                // padding: '16px 15px calc(16px + env(safe-area-inset-bottom)) 15px', // updated
                zIndex: 1000,
              }}
              sx={{
                '@media (min-width: 200px)': {
                  width: '100%',
                },
                '@media (min-width: 1024px)': {
                  width: '485px',
                  paddingRight: '5px !important',
                },
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={handleNextPage}
                // disabled={isUploading}
                sx={{
                  height: '56px',
                  backgroundColor: branding.primaryColor,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  '&:hover': { backgroundColor: branding.primaryColor },
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'NEXT'}
              </Button>
              {/* <Typography
                variant="body2"
                fontFamily="Plus Jakarta Sans"
                fontSize="12px"
                color="#263446"
                textAlign="center"
                paddingTop="6px"
              >
                You will receive an OTP to the above mentioned Email ID.
              </Typography> */}
            </Grid>
          </Box>
        </Box>
      </Box>

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
            height: '190px',
            fontFamily: 'Plus Jakarta Sans',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Plus Jakarta Sans',
            padding: '30px',
            fontSize: '18px',
            textAlign: 'center', // center text
          }}
        >
          You have already completed registration.
        </DialogTitle>

        <DialogActions
          sx={{
            justifyContent: 'center', // center button horizontally
            paddingBottom: '20px',
          }}
        >
          <Button
            variant="outlined"
            sx={{
              borderRadius: 1,
              backgroundColor: branding.primaryColor,
              color: 'white',
              borderColor: branding.primaryColor,
              fontWeight: 'bold',
              width: '100px',
              height: '40px',
              fontSize: '16px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: branding.primaryColor,
                color: 'white',
                borderColor: branding.primaryColor,
              },
              '&:focus': {
                border: '1px solid black',
                outline: 'none',
              },
            }}
            onClick={() => setOpenSnackbar(false)}
          >
            <Typography
              variant="inherit"
              sx={{
                fontFamily: 'Plus Jakarta Sans',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              CLOSE
            </Typography>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default RegistrationForm;
