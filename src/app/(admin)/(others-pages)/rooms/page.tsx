"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Room } from "@/types/room";
import { roomAPI } from "@/lib/api";
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
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import TableSkeleton from "@/components/ui/skeleton/TableSkeleton";
import { useToast } from "@/context/ToastContext";

export default function RoomsPage() {
  const { error: showError } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    roomId: string | null;
    roomNumber: string;
  }>({
    isOpen: false,
    roomId: null,
    roomNumber: "",
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomAPI.getAll();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
      console.error("Error loading rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, roomNumber: string) => {
    setDeleteModal({
      isOpen: true,
      roomId: id,
      roomNumber: roomNumber,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.roomId) return;

    try {
      setDeleting(true);
      await roomAPI.delete(deleteModal.roomId);
      setDeleteModal({ isOpen: false, roomId: null, roomNumber: "" });
      loadRooms();
    } catch (err: any) {
      showError(err.message || "Failed to delete room");
      console.error("Error deleting room:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, roomId: null, roomNumber: "" });
  };

  const getStatusBadge = (status: Room["status"]) => {
    const colors = {
      available: "success",
      occupied: "warning",
      maintenance: "error",
    } as const;
    return <Badge size="sm" color={colors[status]}>{status}</Badge>;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Rooms" />
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Room Management
        </h2>
        <Link href="/rooms/add">
          <Button startIcon={<PlusIcon />} size="sm">
            Add Room
          </Button>
        </Link>
      </div>
      <ComponentCard title="Rooms">
        {loading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-500 mb-4">{error}</p>
            <Button onClick={loadRooms}>Retry</Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No rooms found. Add your first room to get started.
            </p>
            <Link href="/rooms/add">
              <Button startIcon={<PlusIcon />}>Add Room</Button>
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
                        Room Number
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Type
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Price
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Capacity
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
                    {rooms.map((room) => (
                      <TableRow key={room._id || room.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {room.roomNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {room.roomType}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          LKR {room.price.toFixed(2)}/night
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {room.capacity} guests
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {getStatusBadge(room.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Link href={`/rooms/view/${String(room._id || room.id || "")}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                startIcon={<EyeIcon />}
                              >
                                View
                              </Button>
                            </Link>
                            <Link href={`/rooms/edit/${String(room._id || room.id || "")}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                startIcon={<PencilIcon />}
                              >
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              startIcon={<TrashBinIcon />}
                              onClick={() => handleDeleteClick(String(room._id || room.id || ""), room.roomNumber)}
                              className="text-error-500 hover:text-error-600"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete room "${deleteModal.roomNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
