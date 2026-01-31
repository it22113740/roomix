import SignUpFormStepper from "@/components/auth/SignUpFormStepper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Roomix - Hotel Booking Management",
  description: "Create your account and set up your hotel",
  // other metadata
};

export default function SignUp() {
  return <SignUpFormStepper />;
}
