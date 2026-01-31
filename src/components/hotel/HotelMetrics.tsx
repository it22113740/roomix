"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIcon, TaskIcon, DollarLineIcon } from "@/icons";
import { roomAPI, bookingAPI } from "@/lib/api";

export const HotelMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [rooms, bookings] = await Promise.all([
        roomAPI.getAll(),
        bookingAPI.getAll(),
      ]);

      // Calculate room metrics
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((r) => r.status === "available").length;
      const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
      const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;

      // Calculate booking metrics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
      const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
      const completedBookings = bookings.filter((b) => b.status === "completed").length;

      // Calculate revenue
      const totalRevenue = bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = bookings
        .filter((b) => {
          if (b.status === "cancelled") return false;
          const bookingDate = new Date(b.createdAt || "");
          return (
            bookingDate.getMonth() === currentMonth &&
            bookingDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      setMetrics({
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="h-12 w-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
              <div className="h-8 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const occupancyRate =
    metrics.totalRooms > 0
      ? ((metrics.occupiedRooms / metrics.totalRooms) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Total Rooms */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Rooms
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.totalRooms}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {metrics.availableRooms} Available
            </p>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            {occupancyRate}%
          </Badge>
        </div>
      </div>

      {/* Total Bookings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <TaskIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Bookings
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.totalBookings}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {metrics.confirmedBookings} Confirmed
            </p>
          </div>
          <Badge color={metrics.confirmedBookings > 0 ? "success" : "error"}>
            {metrics.confirmedBookings > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {metrics.confirmedBookings}
          </Badge>
        </div>
      </div>

      {/* Occupied Rooms */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Occupied Rooms
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.occupiedRooms}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {metrics.maintenanceRooms} In Maintenance
            </p>
          </div>
          <Badge color={metrics.occupiedRooms > 0 ? "warning" : "success"}>
            {metrics.occupiedRooms > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {occupancyRate}%
          </Badge>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              LKR {metrics.totalRevenue.toLocaleString()}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              LKR {metrics.monthlyRevenue.toLocaleString()} This Month
            </p>
          </div>
          <Badge color={metrics.monthlyRevenue > 0 ? "success" : "error"}>
            {metrics.monthlyRevenue > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {metrics.monthlyRevenue > 0 ? "Active" : "No Sales"}
          </Badge>
        </div>
      </div>
    </div>
  );
};
