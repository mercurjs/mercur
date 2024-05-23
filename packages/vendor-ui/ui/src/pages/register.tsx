import SEO from "../components/seo";
import PublicLayout from "../components/templates/login-layout";
import { useMutation } from "@tanstack/react-query";
import client from "../services/api";
import RegisterCard from "../components/organisms/register-card";

export const useRegisterVendor = () => {
  return useMutation(async (payload: any) => {
    const response = await client.vendor.register(payload);
    return response.data;
  });
};

const RegisterPage = () => {
  return (
    <PublicLayout>
      <SEO title="Register" />
      <RegisterCard />
    </PublicLayout>
  );
};

export default RegisterPage;
