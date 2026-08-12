"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Booking } from "@/types/booking";
import { bookingAPI } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon, DownloadIcon } from "@/icons";
import TableSkeleton from "@/components/ui/skeleton/TableSkeleton";
import { getHotel } from "@/lib/hotel-context";
import { Modal } from "@/components/ui/modal";
import SingleImageUpload from "@/components/form/SingleImageUpload";
import { formatBookingRoomsLabel } from "@/lib/booking-rooms";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    customerName: string;
  }>({
    isOpen: false,
    bookingId: null,
    customerName: "",
  });
  const [cancelling, setCancelling] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [checkInModal, setCheckInModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    customerName: string;
    currentTime: string;
  }>({
    isOpen: false,
    bookingId: null,
    customerName: "",
    currentTime: "",
  });
  const [idDocument, setIdDocument] = useState<string | undefined>(undefined);
  const [checkingIn, setCheckingIn] = useState(false);

  const [viewDocsModal, setViewDocsModal] = useState<{
    isOpen: boolean;
    checkedInAt: string | Date | null;
    idDocument: string | null;
    customerName: string;
  }>({
    isOpen: false,
    checkedInAt: null,
    idDocument: null,
    customerName: "",
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingAPI.getAll();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id: string, customerName: string) => {
    setCancelModal({
      isOpen: true,
      bookingId: id,
      customerName: customerName,
    });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.bookingId) return;

    try {
      setCancelling(true);
      await bookingAPI.cancel(cancelModal.bookingId);
      setCancelModal({ isOpen: false, bookingId: null, customerName: "" });
      loadBookings();
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking");
      console.error("Error cancelling booking:", err);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelClose = () => {
    setCancelModal({ isOpen: false, bookingId: null, customerName: "" });
  };

  const handleCheckInClick = (id: string, customerName: string) => {
    setIdDocument(undefined);
    setCheckInModal({
      isOpen: true,
      bookingId: id,
      customerName: customerName,
      currentTime: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    });
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInModal.bookingId) return;
    if (!idDocument) {
      alert("Please upload the NIC / Driver License Document first.");
      return;
    }

    try {
      setCheckingIn(true);
      await bookingAPI.update(checkInModal.bookingId, {
        checkedInAt: new Date().toISOString(),
        idDocument: idDocument,
      });
      setCheckInModal({ isOpen: false, bookingId: null, customerName: "", currentTime: "" });
      loadBookings();
    } catch (err: any) {
      alert(err.message || "Failed to submit check-in");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleViewDocsClick = (booking: Booking) => {
    setViewDocsModal({
      isOpen: true,
      checkedInAt: booking.checkedInAt || null,
      idDocument: booking.idDocument || null,
      customerName: booking.customerName,
    });
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateForPrint = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = (booking: Booking) => {
    // Get hotel information from localStorage
    let hotel = getHotel();
    
    // If hotel not found in separate storage, try to get from user object
    if (!hotel) {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.hotel && typeof user.hotel === "object") {
            hotel = user.hotel;
          }
        }
      } catch (err) {
        console.error("Error getting hotel from user:", err);
      }
    }
    
    // Create print content with bigger and bolder fonts
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Receipt</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 10mm;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        width: 80mm;
      }
    }
    body {
      margin: 0;
      padding: 10mm;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      width: 80mm;
      max-width: 80mm;
    }
    .receipt {
      width: 100%;
      max-width: 80mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .hotel-logo {
      margin-bottom: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .hotel-logo img {
      max-width: 60mm;
      max-height: 40px;
      object-fit: contain;
      display: block;
    }
    .hotel-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .hotel-info {
      font-size: 12px;
      font-weight: bold;
      line-height: 1.5;
    }
    .section {
      margin: 18px 0;
    }
    .section-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 8px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .info-row {
      margin: 8px 0;
      font-size: 13px;
      font-weight: bold;
    }
    .label {
      font-weight: bold;
      display: inline-block;
      min-width: 90px;
      font-size: 13px;
    }
    .value {
      display: inline-block;
      font-weight: bold;
      font-size: 13px;
    }
    .amount-section {
      margin-top: 18px;
      border-top: 3px solid #000;
      padding-top: 12px;
    }
    .total-amount {
      font-size: 22px;
      font-weight: bold;
      text-align: center;
      margin-top: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px dashed #000;
      font-size: 11px;
      font-weight: bold;
    }
    .divider {
      border-top: 2px dashed #000;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${hotel?.logo ? `<div class="hotel-logo"><img src="${hotel.logo}" alt="${hotel?.name || "Hotel"} Logo" onerror="this.style.display='none'" /></div>` : ""}
      <div class="hotel-name">${hotel?.name || "Hotel"}</div>
      <div class="hotel-info">
        ${hotel?.address || ""}<br>
        ${hotel?.phone ? `Tel: ${hotel.phone}` : ""}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">BOOKING RECEIPT</div>
      <div class="info-row">
        <span class="label">Customer:</span>
        <span class="value">${booking.customerName}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${booking.customerEmail}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${booking.customerPhone}</span>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="section">
      <div class="section-title">BOOKING DETAILS</div>
      <div class="info-row">
        <span class="label">Room(s):</span>
        <span class="value">${formatBookingRoomsLabel(booking)}</span>
      </div>
      <div class="info-row">
        <span class="label">Check In:</span>
        <span class="value">${formatDateForPrint(booking.checkIn)}</span>
      </div>
      <div class="info-row">
        <span class="label">Check Out:</span>
        <span class="value">${formatDateForPrint(booking.checkOut)}</span>
      </div>
      <div class="info-row">
        <span class="label">Guests:</span>
        <span class="value">${booking.numberOfGuests}</span>
      </div>
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="value">${booking.status.toUpperCase()}</span>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="amount-section">
      <div class="section-title">AMOUNT</div>
      <div class="total-amount">
        LKR ${booking.totalPrice.toFixed(2)}
      </div>
    </div>
    
    <div class="footer">
      Thank you for your booking!<br>
      ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
    `;

    // Create a hidden iframe for printing (same page, no new tab)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load, then trigger print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 250);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Bookings" />
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Booking Management
        </h2>
        <Link href="/bookings/add">
          <Button startIcon={<PlusIcon />} size="sm">
            New Booking
          </Button>
        </Link>
      </div>
      <ComponentCard title="Bookings">
        {loading ? (
          <TableSkeleton columns={8} rows={5} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-500 mb-4">{error}</p>
            <Button onClick={loadBookings}>Retry</Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No bookings found. Create your first booking to get started.
            </p>
            <Link href="/bookings/add">
              <Button startIcon={<PlusIcon />}>Create Booking</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1102px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Rooms
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Customer
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Check In
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Check Out
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Guests
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Total Price
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {bookings.map((booking) => {
                      const bookingId = booking._id || booking.id || "";
                      return (
                      <TableRow key={bookingId}>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatBookingRoomsLabel(booking)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {booking.customerName}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {booking.customerEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(booking.checkIn)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(booking.checkOut)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {booking.numberOfGuests}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          LKR {booking.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            {booking.checkedInAt ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocsClick(booking)}
                                className="text-brand-500 hover:text-brand-600 font-semibold shrink-0"
                              >
                                View Docs
                              </Button>
                            ) : (
                              (booking.status === "confirmed" || booking.status === "reserved") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCheckInClick(String(bookingId), booking.customerName)}
                                  className="text-success-600 hover:text-success-700 font-semibold shrink-0"
                                >
                                  Check In
                                </Button>
                              )
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              startIcon={<DownloadIcon />}
                              onClick={() => handlePrint(booking)}
                            >
                              Print
                            </Button>
                            <Link href={`/bookings/edit/${String(bookingId)}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                startIcon={<PencilIcon />}
                              >
                                Edit
                              </Button>
                            </Link>
                            {booking.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelClick(String(bookingId), booking.customerName)}
                                className="text-error-500 hover:text-error-600"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>

      <ConfirmationModal
        isOpen={cancelModal.isOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for "${cancelModal.customerName}"? This action cannot be undone.`}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        variant="warning"
        loading={cancelling}
      />

      {/* Check-In Modal */}
      <Modal
        isOpen={checkInModal.isOpen}
        onClose={() => setCheckInModal({ ...checkInModal, isOpen: false })}
        className="max-w-[500px] p-6 lg:p-8"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-6">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
              Guest Check-In
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Checking in <strong>{checkInModal.customerName}</strong>. Please upload the required verification document.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Current Check-In Time</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{checkInModal.currentTime}</p>
          </div>

          <div>
            <SingleImageUpload
              image={idDocument}
              onChange={setIdDocument}
              onUploading={setDocumentUploading}
              folder="bookings/id-documents"
              label="NIC / Driver License Document *"
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
                "application/pdf": [".pdf"],
              }}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Maximum file size limit: 10 MB. Accepted formats: PNG, JPG, WEBP, PDF.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCheckInModal({ ...checkInModal, isOpen: false })}
              disabled={checkingIn || documentUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={checkingIn || documentUploading}>
              {documentUploading ? "Uploading document..." : (checkingIn ? "Saving..." : "Submit Check-In")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Docs Modal */}
      <Modal
        isOpen={viewDocsModal.isOpen}
        onClose={() => setViewDocsModal({ ...viewDocsModal, isOpen: false })}
        className="max-w-[600px] p-6 lg:p-8"
      >
        <div className="space-y-6">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
              Verification Documents
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submitted documents for guest <strong>{viewDocsModal.customerName}</strong>.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Check-In Time</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {viewDocsModal.checkedInAt
                ? new Date(viewDocsModal.checkedInAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                : "N/A"}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50 dark:bg-gray-900/10 flex justify-center w-full">
            {viewDocsModal.idDocument ? (
              viewDocsModal.idDocument.toLowerCase().endsWith(".pdf") ? (
                <div className="py-8 text-center space-y-3 w-full">
                  <svg className="w-12 h-12 text-error-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Verification document uploaded as PDF.</p>
                  <a
                    href={viewDocsModal.idDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    Open PDF Document
                  </a>
                </div>
              ) : (
                <div className="relative group w-full text-center">
                  <img
                    src={viewDocsModal.idDocument}
                    alt="ID Document"
                    className="max-h-[380px] rounded-lg shadow-sm mx-auto object-contain"
                  />
                  <div className="mt-4 flex justify-center gap-2">
                    <a
                      href={viewDocsModal.idDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500 py-8">No document uploaded.</p>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewDocsModal({ ...viewDocsModal, isOpen: false })}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
