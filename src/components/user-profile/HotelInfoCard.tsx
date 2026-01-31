"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getHotel } from "@/lib/hotel-context";
import { Hotel } from "@/types/hotel";

export default function HotelInfoCard() {
  const [hotel, setHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    loadHotel();
    
    // Listen for storage changes (in case hotel is updated elsewhere)
    const handleStorageChange = () => {
      loadHotel();
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loadHotel = () => {
    const hotelData = getHotel();
    if (hotelData) {
      setHotel(hotelData);
    } else {
      // Try to get from user data
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.hotel && typeof user.hotel === "object") {
            setHotel(user.hotel);
          }
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      }
    }
  };

  if (!hotel) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No hotel information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Hotel Information
          </h4>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Hotel Logo */}
            {hotel.logo && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <Image
                    width={128}
                    height={128}
                    src={hotel.logo}
                    alt={hotel.name || "Hotel logo"}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Hotel Details */}
            <div className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Hotel Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {hotel.name}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {hotel.phone || "-"}
                </p>
              </div>

              <div className="lg:col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {hotel.address || "-"}
                </p>
              </div>

              {hotel.description && (
                <div className="lg:col-span-2">
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {hotel.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
