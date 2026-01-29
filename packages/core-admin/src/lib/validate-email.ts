import { toast } from "@medusajs/ui";

export const validateEmail = (email: string) => {
  if (!email) {
    toast.error("Please enter an email");
    return false;
  }

  if (!email.includes("@")) {
    toast.error("Please enter a valid email");
    return false;
  }

  if (!email.includes(".")) {
    toast.error("Please enter a valid email");
    return false;
  }

  if (email.length < 3) {
    toast.error("Please enter a valid email");
    return false;
  }

  if (email.length > 255) {
    toast.error("Please enter a valid email");
    return false;
  }

  if (email.includes(" ")) {
    toast.error("Please enter a valid email");
    return false;
  }

  return true;
};
