"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { error: showError } = useToast();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
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
  });
  const [idDocument, setIdDocument] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const foundBooking = await bookingAPI.getById(bookingId);
        setBooking(foundBooking);
        
        // Extract roomId - handle both object and string formats
        let roomId = "";
        if (typeof foundBooking.roomId === "object" && foundBooking.roomId !== null) {
          roomId = (foundBooking.roomId as any)._id?.toString() || (foundBooking.roomId as any).id?.toString() || "";
        } else {
          roomId = String(foundBooking.roomId || "");
        }
        
        // Format dates
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
        
        const newFormData = {
          roomId: roomId,
          customerName: foundBooking.customerName || "",
          customerEmail: foundBooking.customerEmail || "",
          customerPhone: foundBooking.customerPhone || "",
          checkIn: checkInDate,
          checkOut: checkOutDate,
          numberOfGuests: foundBooking.numberOfGuests?.toString() || "1",
          specialRequests: foundBooking.specialRequests || "",
          status: foundBooking.status || "confirmed",
        };
        
        setFormData(newFormData);
        setCalculatedPrice(foundBooking.totalPrice || 0);
        setIdDocument(foundBooking.idDocument);
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
          setCalculatedPrice(selectedRoom.price * nights);
        } else {
          setCalculatedPrice(0);
        }
      }
    }
  }, [formData.roomId, formData.checkIn, formData.checkOut, rooms]);

  const roomOptions = rooms.map((room) => ({
    value: room._id || room.id || "",
    label: `${room.roomNumber} - ${room.roomType} (LKR ${room.price}/night)`,
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !booking) return;

    const selectedRoom = rooms.find(
      (r) => (r._id || r.id) === formData.roomId
    );
    if (!selectedRoom) return;

    try {
      setLoading(true);
      await bookingAPI.update(bookingId, {
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
        idDocument: idDocument,
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
            <div>
              <Label htmlFor="roomId">Select Room *</Label>
              <Select
                key={`room-${formData.roomId}`}
                options={roomOptions}
                placeholder="Select a room"
                onChange={(value) => handleSelectChange("roomId", value)}
                value={formData.roomId}
                defaultValue={formData.roomId}
              />
              {errors.roomId && (
                <p className="mt-1.5 text-xs text-error-500">{errors.roomId}</p>
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

            <div>
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                name="totalPrice"
                type="text"
                value={`LKR ${calculatedPrice.toFixed(2)}`}
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

          <div>
            <SingleImageUpload
              image={idDocument}
              onChange={setIdDocument}
              folder="bookings/id-documents"
              label="NIC / Driver License Document"
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
                "application/pdf": [".pdf"],
              }}
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
