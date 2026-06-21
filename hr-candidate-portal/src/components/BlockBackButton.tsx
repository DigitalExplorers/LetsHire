import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogActions, Button, Typography } from "@mui/material";
import Cookies from "js-cookie";
import { useBranding } from "../contexts/BrandingContext";

const BlockBackButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unloadTriggered, setUnloadTriggered] = useState(false);
  const branding = useBranding();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setDialogOpen(true);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Let the browser show a confirmation prompt
      e.preventDefault();
      e.returnValue = '';
      setUnloadTriggered(true);
    };

    const handleUnload = () => {
      // This only runs if the user actually refreshes/closes the page
      if (unloadTriggered) {
        Cookies.remove("userId");
        Cookies.remove("selectedRoleId");
        Cookies.remove("access_token");
        Cookies.remove('userExamStartTime');
        Cookies.remove('userExamAllowedDuration');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.metaKey && e.key === "r")
      ) {
        e.preventDefault();
        setDialogOpen(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [unloadTriggered]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
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
          textAlign: 'center',
        }}
      >
        You cannot go back during the screening process.
      </DialogTitle>
      <DialogActions
        sx={{
          justifyContent: 'center',
          paddingBottom: '20px',
        }}
      >
        <Button
          variant="outlined"
          onClick={() => setDialogOpen(false)}
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
  );
};

export default BlockBackButton;
