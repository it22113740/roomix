"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import SingleImageUpload from "@/components/form/SingleImageUpload";
import Alert from "@/components/ui/alert/Alert";
import { bookingAPI, roomAPI } from "@/lib/api";
import { Room } from "@/types/room";
import { Booking } from "@/types/booking";
import { useToast } from "@/context/ToastContext";

export default function AddBookingPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    roomId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    checkIn: "",
    checkOut: "",
    numberOfGuests: "",
    specialRequests: "",
    status: "confirmed" as Booking["status"],
    discountType: "none" as "percentage" | "fixed" | "none",
    discountValue: "0",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await roomAPI.getAll();
        const availableRooms = allRooms.filter(
          (r) => r.status === "available"
        );
        setRooms(availableRooms);
      } catch (err: any) {
        console.error("Error loading rooms:", err);
      }
    };
    loadRooms();
  }, []);

  useEffect(() => {
    if (formData.roomId && formData.checkIn && formData.checkOut) {
      const selectedRoom = rooms.find(
        (r) => (r._id || r.id) === formData.roomId
      );
      if (selectedRoom) {
        const checkInDate = new Date(formData.checkIn);
        const checkOutDate = new Date(formData.checkOut);
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (nights > 0) {
          const basePrice = selectedRoom.price * nights;
          let finalPrice = basePrice;
          const discVal = parseFloat(formData.discountValue) || 0;
          if (formData.discountType === "percentage") {
            finalPrice = basePrice * (1 - discVal / 100);
          } else if (formData.discountType === "fixed") {
            finalPrice = basePrice - discVal;
          }
          setCalculatedPrice(Math.max(0, finalPrice));
        } else {
          setCalculatedPrice(0);
        }
      }
    } else {
      setCalculatedPrice(0);
    }
  }, [formData.roomId, formData.checkIn, formData.checkOut, formData.discountType, formData.discountValue, rooms]);

  const roomOptions = rooms.map((room) => ({
    value: room._id || room.id || "",
    label: `${room.roomNumber} - ${room.roomType} (LKR ${room.price}/night)`,
  }));

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "reserved", label: "Reserved" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "discountType" && value === "none") {
        next.discountValue = "0";
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (name: string) => {
    return (selectedDates: Date[], dateStr: string) => {
      setFormData((prev) => ({ ...prev, [name]: dateStr }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };
  };

  const handleTextAreaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, specialRequests: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roomId) newErrors.roomId = "Room selection is required";
    if (!formData.customerName.trim())
      newErrors.customerName = "Customer name is required";
    if (!formData.customerEmail.trim())
      newErrors.customerEmail = "Customer email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail))
      newErrors.customerEmail = "Invalid email format";
    if (!formData.customerPhone.trim())
      newErrors.customerPhone = "Customer phone is required";
    if (!formData.checkIn) newErrors.checkIn = "Check-in date is required";
    if (!formData.checkOut) newErrors.checkOut = "Check-out date is required";
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      if (checkOut <= checkIn) {
        newErrors.checkOut = "Check-out must be after check-in";
      }
    }
    if (!formData.numberOfGuests || parseInt(formData.numberOfGuests) <= 0)
      newErrors.numberOfGuests = "Valid number of guests is required";
    if (formData.discountType === "percentage") {
      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val < 0 || val > 100) {
        newErrors.discountValue = "Percentage must be between 0 and 100";
      }
    } else if (formData.discountType === "fixed") {
      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val < 0) {
        newErrors.discountValue = "Discount value cannot be negative";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedRoom = rooms.find(
      (r) => (r._id || r.id) === formData.roomId
    );
    if (!selectedRoom) return;

    try {
      setLoading(true);
      await bookingAPI.create({
        roomId: formData.roomId,
        roomNumber: selectedRoom.roomNumber,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        numberOfGuests: parseInt(formData.numberOfGuests),
        totalPrice: calculatedPrice,
        status: formData.status,
        specialRequests: formData.specialRequests || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/bookings");
      }, 1500);
    } catch (err: any) {
      showError(err.message || "Failed to create booking");
      console.error("Error creating booking:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Create Booking" />
      <ComponentCard title="Create New Booking">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Booking has been created successfully."
              showLink={false}
            />
          </div>
        )}
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No available rooms found. Please add rooms first.
            </p>
            <Button onClick={() => router.push("/rooms")}>
              Go to Rooms
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="roomId">Select Room *</Label>
                <Select
                  options={roomOptions}
                  placeholder="Select a room"
                  onChange={(value) => handleSelectChange("roomId", value)}
                  defaultValue={formData.roomId}
                />
                {errors.roomId && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.roomId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  options={statusOptions}
                  placeholder="Select status"
                  onChange={(value) =>
                    handleSelectChange("status", value as Booking["status"])
                  }
                  defaultValue={formData.status}
                />
              </div>

              <div>
                <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                <Input
                  id="numberOfGuests"
                  name="numberOfGuests"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={formData.numberOfGuests}
                  onChange={handleChange}
                  error={!!errors.numberOfGuests}
                  hint={errors.numberOfGuests}
                />
              </div>

              <div>
                <DatePicker
                  id="checkIn"
                  label="Check-In Date *"
                  placeholder="Select check-in date"
                  mode="single"
                  onChange={handleDateChange("checkIn")}
                />
                {errors.checkIn && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.checkIn}</p>
                )}
              </div>

              <div>
                <DatePicker
                  id="checkOut"
                  label="Check-Out Date *"
                  placeholder="Select check-out date"
                  mode="single"
                  onChange={handleDateChange("checkOut")}
                />
                {errors.checkOut && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.checkOut}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.customerName}
                  onChange={handleChange}
                  error={!!errors.customerName}
                  hint={errors.customerName}
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  error={!!errors.customerEmail}
                  hint={errors.customerEmail}
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Customer Phone *</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  error={!!errors.customerPhone}
                  hint={errors.customerPhone}
                />
              </div>

              {/* Discount Type */}
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  options={[
                    { value: "none", label: "No Discount" },
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount (LKR)" },
                  ]}
                  placeholder="Select discount type"
                  onChange={(value) => handleSelectChange("discountType", value)}
                  defaultValue={formData.discountType}
                />
              </div>

              {/* Discount Value */}
              {formData.discountType !== "none" && (
                <div>
                  <Label htmlFor="discountValue">
                    {formData.discountType === "percentage"
                      ? "Discount Percentage (%)"
                      : "Discount Value (LKR)"}
                  </Label>
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    placeholder="0"
                    min="0"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    value={formData.discountValue}
                    onChange={handleChange}
                    error={!!errors.discountValue}
                    hint={errors.discountValue}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="totalPrice">Total Price</Label>
                <Input
                  id="totalPrice"
                  name="totalPrice"
                  type="text"
                  value={`LKR ${calculatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <TextArea
                placeholder="Any special requests or notes..."
                rows={3}
                value={formData.specialRequests}
                onChange={handleTextAreaChange}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/bookings")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </form>
        )}
      </ComponentCard>
    </div>
  );
}
