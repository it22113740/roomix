"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { bookingAPI, roomAPI } from "@/lib/api";
import { Room } from "@/types/room";
import { Booking } from "@/types/booking";
import { useToast } from "@/context/ToastContext";
import { getBookingRoomIds } from "@/lib/booking-rooms";

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { error: showError } = useToast();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    roomIds: [] as string[],
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
    const loadBooking = async () => {
      try {
        const foundBooking = await bookingAPI.getById(bookingId);
        setBooking(foundBooking);

        const checkInDate =
          foundBooking.checkIn instanceof Date
            ? foundBooking.checkIn.toISOString().split("T")[0]
            : typeof foundBooking.checkIn === "string"
              ? foundBooking.checkIn.split("T")[0]
              : "";
        const checkOutDate =
          foundBooking.checkOut instanceof Date
            ? foundBooking.checkOut.toISOString().split("T")[0]
            : typeof foundBooking.checkOut === "string"
              ? foundBooking.checkOut.split("T")[0]
              : "";

        setFormData({
          roomIds: getBookingRoomIds(foundBooking),
          customerName: foundBooking.customerName || "",
          customerEmail: foundBooking.customerEmail || "",
          customerPhone: foundBooking.customerPhone || "",
          checkIn: checkInDate,
          checkOut: checkOutDate,
          numberOfGuests: foundBooking.numberOfGuests?.toString() || "1",
          specialRequests: foundBooking.specialRequests || "",
          status: foundBooking.status || "confirmed",
          discountType: foundBooking.discountType || "none",
          discountValue: (foundBooking.discountValue || 0).toString(),
        });
        setCalculatedPrice(foundBooking.totalPrice || 0);
      } catch (err: any) {
        console.error("Error loading booking:", err);
        router.push("/bookings");
      }
    };
    loadBooking();
  }, [bookingId, router]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await roomAPI.getAll();
        setRooms(allRooms);
      } catch (err: any) {
        console.error("Error loading rooms:", err);
      }
    };
    loadRooms();
  }, []);

  useEffect(() => {
    if (formData.roomIds.length > 0 && formData.checkIn && formData.checkOut) {
      const selectedRooms = rooms.filter((r) =>
        formData.roomIds.includes(String(r._id || r.id))
      );
      if (selectedRooms.length > 0) {
        const checkInDate = new Date(formData.checkIn);
        const checkOutDate = new Date(formData.checkOut);
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (nights > 0) {
          const basePrice = selectedRooms.reduce(
            (sum, room) => sum + room.price * nights,
            0
          );
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
    }
  }, [
    formData.roomIds,
    formData.checkIn,
    formData.checkOut,
    formData.discountType,
    formData.discountValue,
    rooms,
  ]);

  const roomOptions = rooms.map((room) => ({
    value: room._id || room.id || "",
    text: `${room.roomNumber} - ${room.roomType} (LKR ${room.price}/night)`,
    selected: formData.roomIds.includes(String(room._id || room.id || "")),
  }));

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "reserved", label: "Reserved" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
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

  const handleRoomsChange = (selected: string[]) => {
    setFormData((prev) => ({ ...prev, roomIds: selected }));
    if (errors.roomIds) {
      setErrors((prev) => ({ ...prev, roomIds: "" }));
    }
  };

  const handleDateChange = (name: string) => {
    return (_selectedDates: Date[], dateStr: string) => {
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
    if (formData.roomIds.length === 0)
      newErrors.roomIds = "Select at least one room";
    if (!formData.customerName.trim())
      newErrors.customerName = "Customer name is required";
    if (
      formData.customerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)
    )
      newErrors.customerEmail = "Invalid email format";
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
    if (!validate() || !booking) return;

    const selectedRooms = rooms.filter((r) =>
      formData.roomIds.includes(String(r._id || r.id))
    );
    if (selectedRooms.length === 0) return;

    try {
      setLoading(true);
      await bookingAPI.update(bookingId, {
        roomIds: formData.roomIds,
        roomNumbers: selectedRooms.map((r) => r.roomNumber),
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
      showError(err.message || "Failed to update booking");
      console.error("Error updating booking:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Booking" />
        <ComponentCard title="Loading...">Loading booking data...</ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Booking" />
      <ComponentCard title="Edit Booking">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Booking has been updated successfully."
              showLink={false}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <MultiSelect
                label="Select Rooms *"
                options={roomOptions}
                value={formData.roomIds}
                onChange={handleRoomsChange}
                placeholder="Select one or more rooms"
              />
              {errors.roomIds && (
                <p className="mt-1.5 text-xs text-error-500">{errors.roomIds}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                key={`status-${formData.status}`}
                options={statusOptions}
                placeholder="Select status"
                onChange={(value) =>
                  handleSelectChange("status", value as Booking["status"])
                }
                value={formData.status}
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
                defaultDate={formData.checkIn}
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
                defaultDate={formData.checkOut}
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
              <Label htmlFor="customerEmail">Customer Email</Label>
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
              <Label htmlFor="customerPhone">Customer Phone</Label>
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

            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                key={`discount-${formData.discountType}`}
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
                value={`LKR ${calculatedPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}`}
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
              {loading ? "Updating..." : "Update Booking"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
