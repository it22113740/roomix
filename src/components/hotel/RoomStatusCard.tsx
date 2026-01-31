"use client";
import React, { useEffect, useState } from "react";
import { roomAPI } from "@/lib/api";
import { Room } from "@/types/room";

export default function RoomStatusCard() {
  const [roomStats, setRoomStats] = useState({
    available: 0,
    occupied: 0,
    maintenance: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomStats();
  }, []);

  const loadRoomStats = async () => {
    try {
      setLoading(true);
      const rooms = await roomAPI.getAll();
      
      const stats = {
        available: rooms.filter((r) => r.status === "available").length,
        occupied: rooms.filter((r) => r.status === "occupied").length,
        maintenance: rooms.filter((r) => r.status === "maintenance").length,
        total: rooms.length,
      };

      setRoomStats(stats);
    } catch (error) {
      console.error("Error loading room stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const getPercentage = (value: number) => {
    return roomStats.total > 0 ? ((value / roomStats.total) * 100).toFixed(1) : "0";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        Room Status Overview
      </h3>
      <div className="space-y-4">
        {/* Available Rooms */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {roomStats.available} ({getPercentage(roomStats.available)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${getPercentage(roomStats.available)}%` }}
            ></div>
          </div>
        </div>

        {/* Occupied Rooms */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Occupied
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {roomStats.occupied} ({getPercentage(roomStats.occupied)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-yellow-500 h-2.5 rounded-full"
              style={{ width: `${getPercentage(roomStats.occupied)}%` }}
            ></div>
          </div>
        </div>

        {/* Maintenance Rooms */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Maintenance
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {roomStats.maintenance} ({getPercentage(roomStats.maintenance)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-red-500 h-2.5 rounded-full"
              style={{ width: `${getPercentage(roomStats.maintenance)}%` }}
            ></div>
          </div>
        </div>

        {/* Total Rooms */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-800 dark:text-white/90">
              Total Rooms
            </span>
            <span className="text-lg font-bold text-gray-800 dark:text-white/90">
              {roomStats.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
