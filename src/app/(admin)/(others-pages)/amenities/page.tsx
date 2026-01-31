"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Amenity } from "@/types/amenity";
import { amenityAPI } from "@/lib/api";
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

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    amenityId: string | null;
    amenityName: string;
  }>({
    isOpen: false,
    amenityId: null,
    amenityName: "",
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await amenityAPI.getAll();
      setAmenities(data);
    } catch (err: any) {
      setError(err.message || "Failed to load amenities");
      console.error("Error loading amenities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      amenityId: id,
      amenityName: name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.amenityId) return;

    try {
      setDeleting(true);
      await amenityAPI.delete(deleteModal.amenityId);
      setDeleteModal({ isOpen: false, amenityId: null, amenityName: "" });
      loadAmenities();
    } catch (err: any) {
      alert(err.message || "Failed to delete amenity");
      console.error("Error deleting amenity:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, amenityId: null, amenityName: "" });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Amenities" />
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Amenity Management
        </h2>
        <Link href="/amenities/add">
          <Button startIcon={<PlusIcon />} size="sm">
            Add Amenity
          </Button>
        </Link>
      </div>
      <ComponentCard title="Amenities">
        {loading ? (
          <TableSkeleton columns={4} rows={5} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-500 mb-4">{error}</p>
            <Button onClick={loadAmenities}>Retry</Button>
          </div>
        ) : amenities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No amenities found. Add your first amenity to get started.
            </p>
            <Link href="/amenities/add">
              <Button startIcon={<PlusIcon />}>Add Amenity</Button>
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
                        Icon
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
                    {amenities.map((amenity) => (
                      <TableRow key={amenity._id || amenity.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {amenity.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {amenity.description || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {amenity.icon || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Link href={`/amenities/edit/${String(amenity._id || amenity.id || "")}`}>
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
                              onClick={() => handleDeleteClick(String(amenity._id || amenity.id || ""), amenity.name)}
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
        title="Delete Amenity"
        message={`Are you sure you want to delete amenity "${deleteModal.amenityName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
