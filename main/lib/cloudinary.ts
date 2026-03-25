"use server"; //

import { v2 as cloudinary } from "cloudinary";

// Global variable to track if Cloudinary has been configured
let cloudinaryConfigured = false;

export async function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export async function getCloudinaryClient(): Promise<typeof cloudinary> {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    cloudinaryConfigured = true;
  }

  return cloudinary;
}

export async function getCloudinaryEvidenceFolder() {
  return process.env.CLOUDINARY_EVIDENCE_FOLDER || "fr33/release-evidence";
}

// A helper function to delete an image from Cloudinary by public ID, with error handling.
export async function uploadEvidenceAndGetUrl(
  releaseEvidenceText: string,
  releaseEvidenceImageDataUrl?: string,
): Promise<{
  uploadSuccess: boolean;
  uploadedImageUrl?: string;
  errorMsg?: string;
}> {
  if (!releaseEvidenceText.trim()) {
    return {
      uploadSuccess: false,
      errorMsg:
        "Please provide evidence text before applying for fund release.",
    };
  }

  let uploadedImageUrl: string | undefined;
  if (releaseEvidenceImageDataUrl) {
    // Validate image data URL format and size
    if (!releaseEvidenceImageDataUrl.startsWith("data:image/")) {
      return {
        uploadSuccess: false,
        errorMsg: "imageDataUrl must be a valid image data URL",
      };
    }

    const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000;
    if (releaseEvidenceImageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return {
        uploadSuccess: false,
        errorMsg: "Image is too large. Keep it under 2MB.",
      };
    }

    // If Cloudinary config is missing, return the original data URL (dev-friendly fallback)
    if (!(await hasCloudinaryConfig())) {
      return {
        uploadSuccess: true,
        uploadedImageUrl: releaseEvidenceImageDataUrl,
      };
    }

    // Upload to Cloudinary
    try {
      const cloudinaryClient = await getCloudinaryClient();
      const folder = await getCloudinaryEvidenceFolder();
      const result = await cloudinaryClient.uploader.upload(
        releaseEvidenceImageDataUrl,
        {
          folder,
          resource_type: "image",
        },
      );
      uploadedImageUrl = result.secure_url;
    } catch (error) {
      return {
        uploadSuccess: false,
        errorMsg: `Failed to upload image: ${(error as Error).message}`,
      };
    }
  }
  return { uploadSuccess: true, uploadedImageUrl };
}
