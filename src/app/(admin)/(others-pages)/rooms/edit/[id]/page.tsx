"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import ImageUpload from "@/components/form/ImageUpload";
import Alert from "@/components/ui/alert/Alert";
import { roomAPI, amenityAPI, roomTypeAPI } from "@/lib/api";
import { Room } from "@/types/room";
import { Amenity } from "@/types/amenity";
import { RoomType } from "@/types/roomType";

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    capacity: "",
    amenities: [] as string[],
    description: "",
    status: "available" as Room["status"],
  });
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load amenities and room types first
        const [amenitiesData, roomTypesData] = await Promise.all([
          amenityAPI.getAll(),
          roomTypeAPI.getAll(),
        ]);
        setAmenities(amenitiesData);
        setRoomTypes(roomTypesData);

        // Then load room
        const foundRoom = await roomAPI.getById(roomId);
        setRoom(foundRoom);

        // Match existing amenity names to IDs
        const matchedAmenityIds = foundRoom.amenities
          .map((amenityName) => {
            const amenity = amenitiesData.find((a) => a.name === amenityName);
            return amenity ? String(amenity._id || amenity.id || "") : null;
          })
          .filter((id): id is string => !!id);

        setFormData({
          roomNumber: foundRoom.roomNumber,
          roomType: foundRoom.roomType,
          price: foundRoom.price.toString(),
          capacity: foundRoom.capacity.toString(),
          amenities: matchedAmenityIds,
          description: foundRoom.description,
          status: foundRoom.status,
        });
        setImages(foundRoom.images || []);
      } catch (err: any) {
        console.error("Error loading data:", err);
        router.push("/rooms");
      }
    };
    loadData();
  }, [roomId, router]);

  const roomTypeOptions = roomTypes.map((rt) => ({
    value: rt.name,
    label: rt.name,
  }));

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roomNumber.trim()) newErrors.roomNumber = "Room number is required";
    if (!formData.roomType) newErrors.roomType = "Room type is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.capacity || parseInt(formData.capacity) <= 0)
      newErrors.capacity = "Valid capacity is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !room) return;

    try {
      setLoading(true);
      // Get amenity names from selected IDs
      const amenitiesArray = formData.amenities
        .map((id) => {
          const amenity = amenities.find((a) => String(a._id || a.id || "") === id);
          return amenity?.name;
        })
        .filter((name): name is string => !!name);

      await roomAPI.update(roomId, {
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        amenities: amenitiesArray,
        description: formData.description,
        status: formData.status,
        images: images,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/rooms");
      }, 1500);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to update room" });
      console.error("Error updating room:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Room" />
        <ComponentCard title="Loading...">Loading room data...</ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Room" />
      <ComponentCard title="Edit Room">
        {showSuccess && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="Room has been updated successfully."
              showLink={false}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                name="roomNumber"
                type="text"
                placeholder="e.g., 101, 201A"
                value={formData.roomNumber}
                onChange={handleChange}
                error={!!errors.roomNumber}
                hint={errors.roomNumber}
              />
            </div>

            <div>
              <Label htmlFor="roomType">Room Type *</Label>
              <Select
                options={roomTypeOptions}
                placeholder="Select room type"
                onChange={(value) => handleSelectChange("roomType", value)}
                defaultValue={formData.roomType}
              />
              {errors.roomType && (
                <p className="mt-1.5 text-xs text-error-500">{errors.roomType}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price per Night (LKR) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="0.00"
                min="0"
                step={0.01}
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                hint={errors.price}
              />
            </div>

            <div>
              <Label htmlFor="capacity">Capacity (Guests) *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="1"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                error={!!errors.capacity}
                hint={errors.capacity}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                options={statusOptions}
                placeholder="Select status"
                onChange={(value) => handleSelectChange("status", value as Room["status"])}
                defaultValue={formData.status}
              />
            </div>

            <div>
              <MultiSelect
                label="Amenities"
                options={amenities.map((amenity) => ({
                  value: String(amenity._id || amenity.id || ""),
                  text: amenity.name,
                  icon: amenity.icon || undefined,
                  selected: formData.amenities.includes(String(amenity._id || amenity.id || "")),
                }))}
                defaultSelected={formData.amenities}
                onChange={(selected) => {
                  setFormData((prev) => ({ ...prev, amenities: selected }));
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <TextArea
              placeholder="Enter room description..."
              rows={4}
              value={formData.description}
              onChange={handleTextAreaChange}
              error={!!errors.description}
              hint={errors.description}
            />
          </div>

          <div>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={5}
              folder="rooms"
              label="Room Images (Max 5)"
            />
          </div>

          {errors.submit && (
            <div className="text-error-500 text-sm">{errors.submit}</div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/rooms")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Room"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
