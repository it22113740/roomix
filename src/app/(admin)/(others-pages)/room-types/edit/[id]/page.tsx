"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { roomTypeAPI } from "@/lib/api";
import { RoomType } from "@/types/roomType";

export default function EditRoomTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id || "");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadRoomType();
  }, [id]);

  const loadRoomType = async () => {
    try {
      setFetching(true);
      const roomType = await roomTypeAPI.getById(id);
      setFormData({
        name: roomType.name,
        description: roomType.description || "",
      });
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to load room type" });
      console.error("Error loading room type:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTextAreaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Room type name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await roomTypeAPI.update(id, {
        name: formData.name,
        description: formData.description || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/room-types");
      }, 1500);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to update room type" });
      console.error("Error updating room type:", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Room Type" />
        <ComponentCard title="Edit Room Type">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading room type...</p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Room Type" />
      <ComponentCard title="Edit Room Type">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Room type has been updated successfully."
              showLink={false}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Room Type Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Single, Double, Suite"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              hint={errors.name}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <TextArea
              placeholder="Enter room type description..."
              rows={4}
              value={formData.description}
              onChange={handleTextAreaChange}
            />
          </div>

          {errors.submit && (
            <div className="text-error-500 text-sm">{errors.submit}</div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/room-types")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Room Type"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
