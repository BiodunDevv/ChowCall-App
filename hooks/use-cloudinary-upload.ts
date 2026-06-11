"use client";

import { useState } from "react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type UploadState = {
  uploading: boolean;
  progress: number;
  error: string | null;
};

export function useCloudinaryUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  async function upload(file: File, folder = "chowcall"): Promise<string> {
    setState({ uploading: true, progress: 0, error: null });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setState((prev) => ({ ...prev, progress: Math.round((e.loaded / e.total) * 100) }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText) as { secure_url: string };
          setState({ uploading: false, progress: 100, error: null });
          resolve(data.secure_url);
        } else {
          const msg = "Upload failed. Please try again.";
          setState({ uploading: false, progress: 0, error: msg });
          reject(new Error(msg));
        }
      });

      xhr.addEventListener("error", () => {
        const msg = "Network error during upload.";
        setState({ uploading: false, progress: 0, error: msg });
        reject(new Error(msg));
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  }

  function reset() {
    setState({ uploading: false, progress: 0, error: null });
  }

  return { ...state, upload, reset };
}
