"use client";

import Swal from "sweetalert2";
import { toast } from "react-toastify";

interface ConfirmActionProps {
  action: () => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  successMessage?: string;
  errorActionLabel?: string;
  confirmColor?: string;
  cancelColor?: string;
}

export const ConfirmAction = async ({
  action,
  title,
  message,
  confirmText,
  successMessage,
  errorActionLabel,
  confirmColor = "#d33",
  cancelColor = "#3085d6",
}: ConfirmActionProps) => {
  const result = await Swal.fire({
    title: `<h2 style="font-size: 18px; font-weight: bold;">${title}</h2>`,
    html: `<p style="font-size: 14px; color: #555;">${message}</p>`,
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: cancelColor,
    confirmButtonText: confirmText,
    customClass: {
      popup: "small-popup",
      title: "small-title",
      htmlContainer: "small-text",
    },
  });

  if (result.isConfirmed) {
    try {
      await action();
      toast.success(successMessage || `${title} successful!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error executing action:", error);

      const errorMessage =
        error?.message || error?.removalReason || "An unexpected error occurred.";

      toast.error(`Failed to ${errorActionLabel || title?.toLowerCase?.() || "perform action"}: ${errorMessage}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  }
};

export default ConfirmAction;
