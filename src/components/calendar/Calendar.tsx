"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core/index.js";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { bookingAPI, roomAPI } from "@/lib/api";
import { Booking } from "@/types/booking";
import { Room } from "@/types/room";
import Badge from "@/components/ui/badge/Badge";
import DatePicker from "@/components/form/date-picker";
import MultiSelect from "@/components/form/MultiSelect";
import {
  formatBookingEventTitle,
  formatBookingRoomsLabel,
  getBookingRoomIds,
} from "@/lib/booking-rooms";

const formatLocalDate = (dateInput: string | Date | undefined) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    booking: Booking;
  };
}

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { success: showSuccess, error: showError } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal configuration
  const [modalMode, setModalMode] = useState<"add" | "view" | "edit">("add");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form state for adding manual booking
  const [formData, setFormData] = useState({
    roomIds: [] as string[],
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    checkIn: "",
    checkOut: "",
    numberOfGuests: "1",
    status: "confirmed" as Booking["status"],
    bookingSource: "manual" as "manual" | "website" | "call",
    websiteUrl: "",
    specialRequests: "",
    discountType: "none" as "percentage" | "fixed" | "none",
    discountValue: "0",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  useEffect(() => {
    loadData();
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
      } else {
        setCalculatedPrice(0);
      }
    } else {
      setCalculatedPrice(0);
    }
  }, [
    formData.roomIds,
    formData.checkIn,
    formData.checkOut,
    formData.discountType,
    formData.discountValue,
    rooms,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allBookings, allRooms] = await Promise.all([
        bookingAPI.getAll(),
        roomAPI.getAll(),
      ]);
      setBookings(allBookings);
      setRooms(allRooms);

      // Map bookings to FullCalendar events
      const calendarEvents = allBookings.map((b) => {
        let calendarColor = "Primary";
        if (b.status === "confirmed") calendarColor = "Success";
        else if (b.status === "cancelled") calendarColor = "Danger";
        else if (b.status === "completed") calendarColor = "Warning";

        // Extract dates and check format
        const startStr = formatLocalDate(b.checkIn);
        const endStr = formatLocalDate(b.checkOut);

        return {
          id: b._id || b.id,
          title: formatBookingEventTitle(b),
          start: startStr,
          end: endStr,
          allDay: true,
          extendedProps: {
            calendar: calendarColor,
            booking: b,
          },
        };
      });
      setEvents(calendarEvents);
    } catch (err: any) {
      showError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setModalMode("add");
    setFormErrors({});
    setFormData({
      roomIds: [],
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      checkIn: selectInfo.startStr,
      checkOut: selectInfo.endStr, // endStr is exclusive in FullCalendar select
      numberOfGuests: "1",
      status: "confirmed",
      bookingSource: "manual",
      websiteUrl: "",
      specialRequests: "",
      discountType: "none",
      discountValue: "0",
    });
    setCalculatedPrice(0);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps.booking;
    if (booking) {
      setSelectedBooking(booking);
      setModalMode("view");
      openModal();
    }
  };

  const handleAddBookingClick = () => {
    setModalMode("add");
    setFormErrors({});

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setFormData({
      roomIds: [],
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      checkIn: formatDateStr(today),
      checkOut: formatDateStr(tomorrow),
      numberOfGuests: "1",
      status: "confirmed",
      bookingSource: "manual",
      websiteUrl: "",
      specialRequests: "",
      discountType: "none",
      discountValue: "0",
    });
    setCalculatedPrice(0);
    openModal();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "discountType" && value === "none") {
        next.discountValue = "0";
      }
      return next;
    });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (name: string, dateStr: string) => {
    setFormData((prev) => ({ ...prev, [name]: dateStr }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (formData.roomIds.length === 0)
      errors.roomIds = "Select at least one room";
    if (!formData.customerName.trim())
      errors.customerName = "Customer name is required";
    if (formData.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = "Invalid email format";
    }
    if (!formData.checkIn) errors.checkIn = "Check-in date is required";
    if (!formData.checkOut) errors.checkOut = "Check-out date is required";
    if (formData.checkIn && formData.checkOut) {
      const checkInStr = formData.checkIn.split('T')[0];
      const checkOutStr = formData.checkOut.split('T')[0];
      if (checkOutStr <= checkInStr) {
        errors.checkOut = "Check-out date must be after check-in date";
      }
    }
    if (!formData.numberOfGuests || parseInt(formData.numberOfGuests) <= 0) {
      errors.numberOfGuests = "Valid number of guests is required";
    }
    if (formData.discountType === "percentage") {
      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.discountValue = "Percentage must be between 0 and 100";
      }
    } else if (formData.discountType === "fixed") {
      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val < 0) {
        errors.discountValue = "Discount value cannot be negative";
      }
    }
    if (formData.bookingSource === "website" && !formData.websiteUrl.trim()) {
      errors.websiteUrl = "Website URL is required for website bookings";
    } else if (
      formData.bookingSource === "website" &&
      formData.websiteUrl.trim() &&
      !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
        formData.websiteUrl
      )
    ) {
      errors.websiteUrl = "Please enter a valid website URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedRooms = rooms.filter((r) =>
      formData.roomIds.includes(String(r._id || r.id))
    );
    if (selectedRooms.length === 0) return;

    try {
      setSaving(true);
      await bookingAPI.create({
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
        bookingSource: formData.bookingSource,
        websiteUrl:
          formData.bookingSource === "website" ? formData.websiteUrl : undefined,
        specialRequests: formData.specialRequests || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
      });

      showSuccess("Booking created successfully!");
      closeModal();
      await loadData();
    } catch (err: any) {
      showError(err.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setSaving(true);
      await bookingAPI.cancel(bookingId);
      showSuccess("Booking cancelled successfully!");
      closeModal();
      await loadData();
    } catch (err: any) {
      showError(err.message || "Failed to cancel booking");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    if (!selectedBooking) return;
    setFormErrors({});
    setFormData({
      roomIds: getBookingRoomIds(selectedBooking),
      customerName: selectedBooking.customerName,
      customerEmail: selectedBooking.customerEmail || "",
      customerPhone: selectedBooking.customerPhone || "",
      checkIn: formatLocalDate(selectedBooking.checkIn),
      checkOut: formatLocalDate(selectedBooking.checkOut),
      numberOfGuests: String(selectedBooking.numberOfGuests),
      status: selectedBooking.status,
      bookingSource: selectedBooking.bookingSource || "manual",
      websiteUrl: selectedBooking.websiteUrl || "",
      discountType: selectedBooking.discountType || "none",
      discountValue: (selectedBooking.discountValue || 0).toString(),
      specialRequests: selectedBooking.specialRequests || "",
    });
    setCalculatedPrice(selectedBooking.totalPrice);
    setModalMode("edit");
  };

  const handleUpdateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !validateForm()) return;

    const selectedRooms = rooms.filter((r) =>
      formData.roomIds.includes(String(r._id || r.id))
    );
    if (selectedRooms.length === 0) return;

    try {
      setSaving(true);
      const bookingId = String(selectedBooking._id || selectedBooking.id);
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
        bookingSource: formData.bookingSource,
        websiteUrl: formData.bookingSource === "website" ? formData.websiteUrl : undefined,
        specialRequests: formData.specialRequests || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
      });

      showSuccess("Booking updated successfully!");
      closeModal();
      await loadData();
    } catch (err: any) {
      showError(err.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    const colors = {
      confirmed: "success",
      reserved: "primary",
      cancelled: "error",
      completed: "warning",
    } as const;

    const labels = {
      confirmed: "Confirmed",
      reserved: "Reserved",
      cancelled: "Cancelled",
      completed: "Completed",
    };

    return <Badge size="sm" color={colors[status]}>{labels[status]}</Badge>;
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const booking = eventInfo.event.extendedProps.booking;
    const bookingSource = booking?.bookingSource || "call";
    const status = booking?.status || "confirmed";

    let statusClass = "bg-brand-50 text-brand-500 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30";
    if (status === "confirmed") {
      statusClass = "bg-success-50 text-success-600 border-success-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
    } else if (status === "cancelled") {
      statusClass = "bg-error-50 text-error-600 border-error-200 dark:bg-error-500/15 dark:text-error-400 dark:border-error-500/30";
    } else if (status === "completed") {
      statusClass = "bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30";
    }

    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold w-full h-full truncate shadow-xs cursor-pointer ${statusClass}`}
      >
        {bookingSource === "call" ? (
          // Call Icon
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            ></path>
          </svg>
        ) : bookingSource === "website" ? (
          // Website Icon (Globe)
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            ></path>
          </svg>
        ) : (
          // Manual Icon (Laptop/Device)
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            ></path>
          </svg>
        )}
        <span className="truncate">{eventInfo.event.title}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading Calendar Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Booking Calendar
        </h3>
        <button
          onClick={handleAddBookingClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Add Booking +
        </button>
      </div>

      <div className="custom-calendar p-4 sm:p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        {(modalMode === "add" || modalMode === "edit") ? (
          <form onSubmit={modalMode === "add" ? handleAddBookingSubmit : handleUpdateBookingSubmit} className="flex flex-col px-2 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {modalMode === "add" ? "Create Manual Booking" : "Edit Booking"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {modalMode === "add"
                  ? "Book one or more rooms for a customer. Same dates and guest total apply to the whole booking."
                  : "Modify the details of this booking. Automatically recalculates stay pricing on date or room changes."}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Select Rooms */}
              <div className="sm:col-span-2">
                <MultiSelect
                  label="Select Rooms *"
                  options={rooms.map((room) => ({
                    value: String(room._id || room.id || ""),
                    text: `Room ${room.roomNumber} - ${room.roomType} (LKR ${room.price}/night)`,
                    selected: formData.roomIds.includes(
                      String(room._id || room.id || "")
                    ),
                  }))}
                  value={formData.roomIds}
                  onChange={(selected) => {
                    setFormData((prev) => ({ ...prev, roomIds: selected }));
                    if (formErrors.roomIds) {
                      setFormErrors((prev) => ({ ...prev, roomIds: "" }));
                    }
                  }}
                  placeholder="Select one or more rooms"
                />
                {formErrors.roomIds && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.roomIds}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Booking Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="confirmed" className="dark:bg-gray-900">Confirmed</option>
                  <option value="reserved" className="dark:bg-gray-900">Reserved</option>
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
                {formErrors.customerName && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.customerName}</p>
                )}
              </div>

              {/* Customer Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Customer Email
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
                {formErrors.customerEmail && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.customerEmail}</p>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="e.g. +94 77 123 4567"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
                {formErrors.customerPhone && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.customerPhone}</p>
                )}
              </div>

              {/* Number of Guests */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Number of Guests *
                </label>
                <input
                  type="number"
                  name="numberOfGuests"
                  min="1"
                  value={formData.numberOfGuests}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
                {formErrors.numberOfGuests && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.numberOfGuests}</p>
                )}
              </div>

              {/* Check-In Date */}
              <div>
                <DatePicker
                  id="checkIn"
                  label="Check-In Date *"
                  placeholder="YYYY-MM-DD"
                  mode="single"
                  defaultDate={formData.checkIn}
                  onChange={(selectedDates, dateStr) => handleDateChange("checkIn", dateStr)}
                />
                {formErrors.checkIn && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.checkIn}</p>
                )}
              </div>

              {/* Check-Out Date */}
              <div>
                <DatePicker
                  id="checkOut"
                  label="Check-Out Date *"
                  placeholder="YYYY-MM-DD"
                  mode="single"
                  defaultDate={formData.checkOut}
                  onChange={(selectedDates, dateStr) => handleDateChange("checkOut", dateStr)}
                />
                {formErrors.checkOut && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.checkOut}</p>
                )}
              </div>

              {/* Booking Source */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Booking Source *
                </label>
                <select
                  name="bookingSource"
                  value={formData.bookingSource}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="manual" className="dark:bg-gray-900">Manual (Our Website)</option>
                  <option value="website" className="dark:bg-gray-900">Website (Other Website)</option>
                  <option value="call" className="dark:bg-gray-900">Call (Over Call)</option>
                </select>
              </div>

              {/* Discount Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Discount Type
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="none" className="dark:bg-gray-900">No Discount</option>
                  <option value="percentage" className="dark:bg-gray-900">Percentage (%)</option>
                  <option value="fixed" className="dark:bg-gray-900">Fixed Amount (LKR)</option>
                </select>
              </div>

              {/* Discount Value */}
              {formData.discountType !== "none" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {formData.discountType === "percentage"
                      ? "Discount Percentage (%)"
                      : "Discount Value (LKR)"}
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    min="0"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                  {formErrors.discountValue && (
                    <p className="mt-1 text-xs text-error-500">{formErrors.discountValue}</p>
                  )}
                </div>
              )}

              {/* Calculated Price */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Calculated Total Price
                </label>
                <input
                  type="text"
                  value={`LKR ${calculatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  disabled
                  className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400"
                />
              </div>

              {/* Website URL (Conditional) */}
              {formData.bookingSource === "website" && (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Website URL *
                  </label>
                  <input
                    type="text"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    placeholder="e.g. https://booking.com/your-hotel"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                  {formErrors.websiteUrl && (
                    <p className="mt-1 text-xs text-error-500">{formErrors.websiteUrl}</p>
                  )}
                </div>
              )}

              {/* Special Requests */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Special Requests / Notes
                </label>
                <textarea
                  name="specialRequests"
                  rows={2}
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  placeholder="Any extra customer requests..."
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8 modal-footer sm:justify-end border-t border-gray-200 dark:border-gray-800 pt-5">
              <button
                onClick={modalMode === "add" ? closeModal : () => setModalMode("view")}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={saving}
              >
                {saving
                  ? modalMode === "add" ? "Creating..." : "Saving..."
                  : modalMode === "add" ? "Create Booking" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* View mode - Booking details */
          <div className="flex flex-col px-2 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h5 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
                  Booking Details
                </h5>
                {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Reference ID: {selectedBooking?._id || selectedBooking?.id}
                </p> */}
              </div>
              <div className="flex items-center gap-2">
                {selectedBooking && getStatusBadge(selectedBooking.status)}
              </div>
            </div>

            {selectedBooking && (
              <div className="mt-6 space-y-6">
                {/* Booking Source Banner */}
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  {selectedBooking.bookingSource === "call" ? (
                    <>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Booked Over Call</p>
                        <p className="text-xs text-gray-500">Created manually following a telephone request.</p>
                      </div>
                    </>
                  ) : selectedBooking.bookingSource === "website" ? (
                    <>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Booked via Website (Other)</p>
                        {selectedBooking.websiteUrl ? (
                          <a
                            href={selectedBooking.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:underline block truncate"
                          >
                            URL: {selectedBooking.websiteUrl}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-500">No URL link provided.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Booked via Our Website (Manual)</p>
                        <p className="text-xs text-gray-500">Reserved directly through the hotel website system.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Main Information */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Customer Block */}
                  <div>
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h6>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{selectedBooking.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBooking.customerEmail}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBooking.customerPhone}</p>
                    </div>
                  </div>

                  {/* Room Block */}
                  <div>
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room Details</h6>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        Room{getBookingRoomIds(selectedBooking).length > 1 ? "s" : ""}:{" "}
                        {formatBookingRoomsLabel(selectedBooking)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getBookingRoomIds(selectedBooking).length} room
                        {getBookingRoomIds(selectedBooking).length === 1 ? "" : "s"} in this booking
                      </p>
                    </div>
                  </div>

                  {/* Stay Dates */}
                  <div>
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stay Schedule</h6>
                    <div className="space-y-1.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-800 dark:text-white/90">Check-In:</span>{" "}
                        {new Date(selectedBooking.checkIn).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-800 dark:text-white/90">Check-Out:</span>{" "}
                        {new Date(selectedBooking.checkOut).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Booking Pricing */}
                  <div>
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pricing & Capacity</h6>
                    <div className="space-y-1.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-gray-800 dark:text-white/90">Guests:</span>{" "}
                        {selectedBooking.numberOfGuests} guests
                      </p>
                      {selectedBooking.discountType && selectedBooking.discountType !== "none" && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-gray-800 dark:text-white/90">Discount:</span>{" "}
                          {selectedBooking.discountType === "percentage"
                            ? `${selectedBooking.discountValue}%`
                            : `LKR ${(selectedBooking.discountValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                      )}
                      <p className="text-lg font-bold text-brand-500">
                        LKR {selectedBooking.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Special Requests / Notes</h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                      "{selectedBooking.specialRequests}"
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-8 modal-footer sm:justify-end border-t border-gray-200 dark:border-gray-800 pt-5">
              {selectedBooking && selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                <>
                  <button
                    onClick={handleEditClick}
                    type="button"
                    className="flex w-full justify-center rounded-lg border border-gray-300 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:w-auto"
                    disabled={saving}
                  >
                    Edit Booking
                  </button>
                  <button
                    onClick={() => handleCancelBooking(String(selectedBooking._id || selectedBooking.id))}
                    type="button"
                    className="flex w-full justify-center rounded-lg border border-error-300 bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 px-4 py-2.5 text-sm font-medium hover:bg-error-100 dark:hover:bg-error-500/20 sm:w-auto"
                    disabled={saving}
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 sm:w-auto"
                disabled={saving}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
