"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Stepper from "@/components/form/Stepper";
import SingleImageUpload from "@/components/form/SingleImageUpload";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { authAPI } from "@/lib/api";

export default function SignUpFormStepper() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [hotelData, setHotelData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    logo: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const stepLabels = ["Personal Information", "Hotel Details", "Confirmation"];

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (showError) {
      setShowError(false);
    }
  };

  const handleHotelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHotelData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (showError) {
      setShowError(false);
    }
  };

  const handleLogoChange = (url: string | undefined) => {
    setHotelData((prev) => ({ ...prev, logo: url || "" }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!personalData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!personalData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!personalData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email))
      newErrors.email = "Invalid email format";
    if (!personalData.password) newErrors.password = "Password is required";
    else if (personalData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!isChecked) newErrors.terms = "You must agree to the terms and conditions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!hotelData.name.trim()) newErrors.name = "Hotel name is required";
    if (!hotelData.address.trim()) newErrors.address = "Address is required";
    if (!hotelData.phone.trim()) newErrors.phone = "Phone is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    try {
      setLoading(true);
      setShowError(false);
      const user = await authAPI.signup({
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        email: personalData.email,
        password: personalData.password,
        hotel: {
          name: hotelData.name,
          address: hotelData.address,
          phone: hotelData.phone,
          description: hotelData.description || undefined,
          logo: hotelData.logo || undefined,
        },
      });

      setShowSuccess(true);
      setTimeout(() => {
        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));
        if (user.hotel) {
          localStorage.setItem("hotel", JSON.stringify(user.hotel));
        }
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign up");
      setShowError(true);
      console.error("Error signing up:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <Label>
            First Name<span className="text-error-500">*</span>
          </Label>
          <Input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            value={personalData.firstName}
            onChange={handlePersonalChange}
            error={!!errors.firstName}
            hint={errors.firstName}
          />
        </div>
        <div className="sm:col-span-1">
          <Label>
            Last Name<span className="text-error-500">*</span>
          </Label>
          <Input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Enter your last name"
            value={personalData.lastName}
            onChange={handlePersonalChange}
            error={!!errors.lastName}
            hint={errors.lastName}
          />
        </div>
      </div>
      <div>
        <Label>
          Email<span className="text-error-500">*</span>
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          value={personalData.email}
          onChange={handlePersonalChange}
          error={!!errors.email}
          hint={errors.email}
        />
      </div>
      <div>
        <Label>
          Password<span className="text-error-500">*</span>
        </Label>
        <div className="relative">
          <Input
            name="password"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={personalData.password}
            onChange={handlePersonalChange}
            error={!!errors.password}
            hint={errors.password}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
          >
            {showPassword ? (
              <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
            ) : (
              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          className="w-5 h-5"
          checked={isChecked}
          onChange={setIsChecked}
        />
        <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
          By creating an account means you agree to the{" "}
          <span className="text-gray-800 dark:text-white/90">
            Terms and Conditions,
          </span>{" "}
          and our{" "}
          <span className="text-gray-800 dark:text-white">
            Privacy Policy
          </span>
        </p>
      </div>
      {errors.terms && (
        <p className="text-sm text-error-500">{errors.terms}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <Label>
          Hotel Name<span className="text-error-500">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Enter hotel name"
          value={hotelData.name}
          onChange={handleHotelChange}
          error={!!errors.name}
          hint={errors.name}
        />
      </div>
      <div>
        <Label>
          Address<span className="text-error-500">*</span>
        </Label>
        <Input
          type="text"
          id="address"
          name="address"
          placeholder="Enter hotel address"
          value={hotelData.address}
          onChange={handleHotelChange}
          error={!!errors.address}
          hint={errors.address}
        />
      </div>
      <div>
        <Label>
          Phone<span className="text-error-500">*</span>
        </Label>
        <Input
          type="tel"
          id="phone"
          name="phone"
          placeholder="Enter hotel phone number"
          value={hotelData.phone}
          onChange={handleHotelChange}
          error={!!errors.phone}
          hint={errors.phone}
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Enter hotel description (optional)"
          value={hotelData.description}
          onChange={handleHotelChange}
          rows={4}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-transparent text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
      </div>
      <div>
        <SingleImageUpload
          label="Hotel Logo (Optional)"
          image={hotelData.logo}
          onChange={handleLogoChange}
          folder="hotels/logos"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="p-5 border border-gray-200 rounded-lg dark:border-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Personal Information
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>{" "}
            <span className="text-gray-800 dark:text-white/90">
              {personalData.firstName} {personalData.lastName}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>{" "}
            <span className="text-gray-800 dark:text-white/90">{personalData.email}</span>
          </p>
        </div>
      </div>
      <div className="p-5 border border-gray-200 rounded-lg dark:border-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Hotel Details
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Hotel Name:</span>{" "}
            <span className="text-gray-800 dark:text-white/90">{hotelData.name}</span>
          </p>
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Address:</span>{" "}
            <span className="text-gray-800 dark:text-white/90">{hotelData.address}</span>
          </p>
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>{" "}
            <span className="text-gray-800 dark:text-white/90">{hotelData.phone}</span>
          </p>
          {hotelData.description && (
            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>{" "}
              <span className="text-gray-800 dark:text-white/90">{hotelData.description}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div> */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your account and set up your hotel
            </p>
          </div>

          <Stepper
            currentStep={currentStep}
            totalSteps={3}
            stepLabels={stepLabels}
          />

          {showError && (
            <div className="mb-6">
              <Alert
                variant="error"
                title="Error"
                message={errorMessage}
                showLink={false}
              />
            </div>
          )}
          {showSuccess && (
            <div className="mb-6">
              <Alert
                variant="success"
                title="Success!"
                message="Account created successfully. Redirecting..."
                showLink={false}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex items-center gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {" "}Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
