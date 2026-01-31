"use client";
import { HotelMetrics } from "@/components/hotel/HotelMetrics";
import React from "react";
import BookingTrendsChart from "@/components/hotel/BookingTrendsChart";
import RecentBookings from "@/components/hotel/RecentBookings";
import RoomStatusCard from "@/components/hotel/RoomStatusCard";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <HotelMetrics />

        <BookingTrendsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <RoomStatusCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentBookings />
      </div>
    </div>
  );
}
