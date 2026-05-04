import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    typography: {
        fontFamily: 'Plus Jakarta Sans',
    },
    components: {
        MuiTextField: {
            defaultProps: {
                size: 'small',
                margin: 'dense',
                fullWidth: true,
            },
            styleOverrides: {
                root: {
                    // Input base styling
                    '& .MuiInputBase-input': {
                        color: '#000',
                        height: '33px',
                        // padding: '0 14px', // Optional: Ensures text aligns vertically
                        fontFamily: 'Plus Jakarta Sans',
                    },
                    // Placeholder styling
                    '& input::placeholder': {
                        color: '#000',
                        opacity: 1,
                        fontSize: '14px',
                        fontFamily: 'Plus Jakarta Sans',
                    },
                    // Helper text styling
                    '& .MuiFormHelperText-root': {
                        color: '#000',
                        marginLeft: '0px',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
              root: {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(28, 55, 90, 0.16)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(28, 55, 90, 0.16)',
                },
              },
              notchedOutline: {
                borderColor: 'rgba(28, 55, 90, 0.16)',
              },
            },
          },

        //Optional: Style Grid items to remove horizontal padding
        MuiGrid: {
            styleOverrides: {
                item: {
                    paddingLeft: '20px !important',
                    paddingTop: '5px !important',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                borderRadius: '4px',
                display: 'flex',
                width: '100%',
                height: '56px',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '16px',
                textTransform: 'none',
                },
            },
        },
    },
});

export default theme;
