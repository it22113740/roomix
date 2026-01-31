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
import { amenityAPI } from "@/lib/api";
import { Amenity } from "@/types/amenity";

export default function EditAmenityPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id || "");
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadAmenity();
  }, [id]);

  const loadAmenity = async () => {
    try {
      setFetching(true);
      const amenity = await amenityAPI.getById(id);
      setFormData({
        name: amenity.name,
        icon: amenity.icon || "",
        description: amenity.description || "",
      });
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to load amenity" });
      console.error("Error loading amenity:", err);
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
    if (!formData.name.trim()) newErrors.name = "Amenity name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await amenityAPI.update(id, {
        name: formData.name,
        icon: formData.icon || undefined,
        description: formData.description || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/amenities");
      }, 1500);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to update amenity" });
      console.error("Error updating amenity:", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Amenity" />
        <ComponentCard title="Edit Amenity">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading amenity...</p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Amenity" />
      <ComponentCard title="Edit Amenity">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Amenity has been updated successfully."
              showLink={false}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Amenity Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., WiFi, TV, AC, Mini Bar"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                hint={errors.name}
              />
            </div>

            <div>
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input
                id="icon"
                name="icon"
                type="text"
                placeholder="Icon name or emoji"
                value={formData.icon}
                onChange={handleChange}
                hint="Icon identifier or emoji"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <TextArea
              placeholder="Enter amenity description..."
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
              onClick={() => router.push("/amenities")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Amenity"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
