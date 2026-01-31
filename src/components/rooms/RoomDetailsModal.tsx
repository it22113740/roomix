"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core/index.js";
import { Modal } from "@/components/ui/modal";
import { Room } from "@/types/room";
import { Booking } from "@/types/booking";
import { bookingAPI } from "@/lib/api";
import Badge from "@/components/ui/badge/Badge";

interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
}

export default function RoomDetailsModal({
  isOpen,
  onClose,
  room,
}: RoomDetailsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    if (isOpen && room) {
      loadBookings();
    }
  }, [isOpen, room]);

  const loadBookings = async () => {
    if (!room) return;

    try {
      setLoading(true);
      const allBookings = await bookingAPI.getAll();
      // Filter bookings for this specific room
      const roomBookings = allBookings.filter((booking) => {
        const bookingRoomId =
          typeof booking.roomId === "object" && booking.roomId !== null
            ? (booking.roomId as any)._id || (booking.roomId as any).id
            : booking.roomId;
        const currentRoomId = room._id || room.id;
        return String(bookingRoomId) === String(currentRoomId);
      });
      setBookings(roomBookings);
    } catch (err: any) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Booking["status"]): string => {
    switch (status) {
      case "confirmed":
        return "Success";
      case "reserved":
        return "Primary";
      case "cancelled":
        return "Danger";
      case "completed":
        return "Warning";
      default:
        return "Primary";
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    const colors = {
      confirmed: "success",
      reserved: "info",
      cancelled: "error",
      completed: "warning",
    } as const;
    return <Badge size="sm" color={colors[status]}>{status}</Badge>;
  };

  // Convert bookings to calendar events
  const calendarEvents: EventInput[] = bookings.map((booking) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    // Add one day to checkOut for display (since check-out is typically at checkout time, not end of day)
    checkOut.setDate(checkOut.getDate() + 1);

    return {
      id: booking._id || booking.id || "",
      title: `${booking.customerName} - ${booking.status}`,
      start: checkIn.toISOString().split("T")[0],
      end: checkOut.toISOString().split("T")[0],
      allDay: true,
      extendedProps: {
        calendar: getStatusColor(booking.status),
        booking: booking,
      },
    };
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps.booking as Booking;
    setSelectedBooking(booking);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!room) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="max-w-[1200px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar max-h-[90vh]">
          {/* Room Details Header */}
          <div className="mb-6">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Room Details - {room.roomNumber}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View room information and booking calendar
            </p>
          </div>

          {/* Room Information */}
          <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            <h6 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              Room Information
            </h6>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Room Number</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {room.roomNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {room.roomType}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  LKR {room.price.toFixed(2)}/night
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {room.capacity} guests
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">
                  {getStatusBadge(room.status as any)}
                </div>
              </div>
              {room.amenities && Array.isArray(room.amenities) && room.amenities.length > 0 && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar View */}
          <div className="mb-6">
            <h6 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              Booking Calendar
            </h6>
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="custom-calendar">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="auto"
                />
              </div>
            </div>
          </div>

          {/* Selected Booking Details */}
          {selectedBooking && (
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-4">
                <h6 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Booking Details
                </h6>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedBooking.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedBooking.customerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedBooking.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Check-In</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatDate(selectedBooking.checkIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Check-Out</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatDate(selectedBooking.checkOut)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedBooking.numberOfGuests}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Price</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    LKR {selectedBooking.totalPrice.toFixed(2)}
                  </p>
                </div>
                {selectedBooking.specialRequests && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Special Requests</p>
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 modal-footer">
            <button
              onClick={onClose}
              type="button"
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};
