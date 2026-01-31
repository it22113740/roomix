"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { roomTypeAPI } from "@/lib/api";
import { RoomType } from "@/types/roomType";

export default function AddRoomTypePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      await roomTypeAPI.create({
        name: formData.name,
        description: formData.description || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/room-types");
      }, 1500);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to create room type" });
      console.error("Error creating room type:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Add Room Type" />
      <ComponentCard title="Add New Room Type">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Room type has been created successfully."
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
              {loading ? "Adding..." : "Add Room Type"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
