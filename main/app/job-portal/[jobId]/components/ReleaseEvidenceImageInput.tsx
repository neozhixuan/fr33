"use client";

import { type ChangeEvent } from "react";

const MAX_EVIDENCE_IMAGE_BYTES = 2 * 1024 * 1024;

type ReleaseEvidenceImageInputProps = {
    imageName: string;
    imagePreviewUrl: string;
    onImageChange: (params: { imageName: string; imageDataUrl: string }) => void;
};

export default function ReleaseEvidenceImageInput({
    imageName,
    imagePreviewUrl,
    onImageChange,
}: ReleaseEvidenceImageInputProps) {
    const handleEvidenceImageChange = async (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            onImageChange({ imageName: "", imageDataUrl: "" });
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Only image files are supported for release evidence.");
            event.currentTarget.value = "";
            return;
        }

        if (file.size > MAX_EVIDENCE_IMAGE_BYTES) {
            alert("Image is too large. Please keep it under 2MB.");
            event.currentTarget.value = "";
            return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read image file"));
            reader.readAsDataURL(file);
        });

        onImageChange({ imageName: file.name, imageDataUrl: dataUrl });
    };

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cacb]">
                Evidence image (optional)
            </label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleEvidenceImageChange(e)}
                className="w-full rounded-md border border-white/15 bg-[#131314] px-3 py-2 text-xs text-[#e5e2e3]"
            />
            {imageName ? (
                <p className="text-xs text-[#b9cacb]">Attached: {imageName}</p>
            ) : null}
            {imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imagePreviewUrl}
                    alt="Release evidence preview"
                    className="max-h-56 w-auto rounded-md border border-white/10"
                />
            ) : null}
        </div>
    );
}
