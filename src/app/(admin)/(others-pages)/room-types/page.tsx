"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { RoomType } from "@/types/roomType";
import { roomTypeAPI } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import TableSkeleton from "@/components/ui/skeleton/TableSkeleton";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    roomTypeId: string | null;
    roomTypeName: string;
  }>({
    isOpen: false,
    roomTypeId: null,
    roomTypeName: "",
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomTypeAPI.getAll();
      setRoomTypes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load room types");
      console.error("Error loading room types:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      roomTypeId: id,
      roomTypeName: name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.roomTypeId) return;

    try {
      setDeleting(true);
      await roomTypeAPI.delete(deleteModal.roomTypeId);
      setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: "" });
      loadRoomTypes();
    } catch (err: any) {
      alert(err.message || "Failed to delete room type");
      console.error("Error deleting room type:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, roomTypeId: null, roomTypeName: "" });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Room Types" />
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Room Type Management
        </h2>
        <Link href="/room-types/add">
          <Button startIcon={<PlusIcon />} size="sm">
            Add Room Type
          </Button>
        </Link>
      </div>
      <ComponentCard title="Room Types">
        {loading ? (
          <TableSkeleton columns={3} rows={5} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-500 mb-4">{error}</p>
            <Button onClick={loadRoomTypes}>Retry</Button>
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No room types found. Add your first room type to get started.
            </p>
            <Link href="/room-types/add">
              <Button startIcon={<PlusIcon />}>Add Room Type</Button>
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
                        Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Description
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
                    {roomTypes.map((roomType) => (
                      <TableRow key={roomType._id || roomType.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {roomType.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {roomType.description || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Link href={`/room-types/edit/${String(roomType._id || roomType.id || "")}`}>
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
                              onClick={() => handleDeleteClick(String(roomType._id || roomType.id || ""), roomType.name)}
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
        title="Delete Room Type"
        message={`Are you sure you want to delete room type "${deleteModal.roomTypeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
