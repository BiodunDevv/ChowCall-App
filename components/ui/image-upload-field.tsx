"use client";

/**
 * Reusable image upload field with:
 * - Click-to-upload / drag-and-drop
 * - Paste-a-URL tab
 * - Cloudinary upload
 * - Upload states: idle → uploading → done → error
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	IconPhotoPlus,
	IconLoader,
	IconX,
	IconCheck,
	IconAlertCircle,
	IconLink,
	IconUpload,
} from "@tabler/icons-react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

type UploadState = "idle" | "uploading" | "done" | "error";
type Tab = "upload" | "url";

export type ImageUploadFieldProps = {
	/** Current image URL (controlled) */
	value?: string;
	/** Called whenever the URL changes (upload complete or URL pasted) */
	onChange: (url: string) => void;
	/** aspect-video (default) | aspect-square */
	aspect?: "video" | "square";
	/** object-cover (default) | object-contain */
	fit?: "cover" | "contain";
	/** Shown inside the drop zone before anything is uploaded */
	placeholder?: string;
	hint?: string;
};

export function ImageUploadField({
	value = "",
	onChange,
	aspect = "video",
	fit = "cover",
	placeholder = "Click to upload or drag & drop",
	hint = "PNG, JPG, WEBP up to 10 MB",
}: ImageUploadFieldProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [uploadState, setUploadState] = useState<UploadState>(
		value ? "done" : "idle",
	);
	const [preview, setPreview] = useState<string>(value);

	// Sync external value into local preview (handles pre-fill from API)
	const prevValueRef = useRef(value);
	useEffect(() => {
		if (value && value !== prevValueRef.current && uploadState !== "uploading") {
			prevValueRef.current = value;
			setPreview(value);
			setUploadState("done");
		}
	}, [value, uploadState]);
	const [isDragging, setIsDragging] = useState(false);
	const [tab, setTab] = useState<Tab>("upload");
	const [urlInput, setUrlInput] = useState("");
	const [urlError, setUrlError] = useState("");

	// ── Upload to Cloudinary ────────────────────────────────────────────────
	const upload = useCallback(
		async (file: File) => {
			setUploadState("uploading");
			const form = new FormData();
			form.append("file", file);
			form.append("upload_preset", UPLOAD_PRESET);
			try {
				const res = await fetch(
					`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
					{ method: "POST", body: form },
				);
				if (!res.ok) throw new Error("Upload failed");
				const json = (await res.json()) as { secure_url: string };
				setPreview(json.secure_url);
				onChange(json.secure_url);
				setUploadState("done");
			} catch {
				setUploadState("error");
			}
		},
		[onChange],
	);

	// ── File picker ─────────────────────────────────────────────────────────
	const handleFile = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			setPreview(URL.createObjectURL(file));
			void upload(file);
		},
		[upload],
	);

	// ── Drag-and-drop ────────────────────────────────────────────────────────
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files?.[0];
			if (file?.type.startsWith("image/")) {
				setPreview(URL.createObjectURL(file));
				void upload(file);
			}
		},
		[upload],
	);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragging(false);
		}
	}, []);

	// ── URL paste ────────────────────────────────────────────────────────────
	const applyUrl = useCallback(() => {
		const trimmed = urlInput.trim();
		if (!trimmed) return;
		try {
			new URL(trimmed); // validate
		} catch {
			setUrlError("Please enter a valid URL (https://...)");
			return;
		}
		setUrlError("");
		setPreview(trimmed);
		onChange(trimmed);
		setUploadState("done");
	}, [urlInput, onChange]);

	// ── Clear ────────────────────────────────────────────────────────────────
	const clear = useCallback(() => {
		setPreview("");
		setUploadState("idle");
		setUrlInput("");
		setUrlError("");
		onChange("");
		if (fileRef.current) fileRef.current.value = "";
	}, [onChange]);

	// ── Preview card ─────────────────────────────────────────────────────────
	if (preview) {
		return (
			<div className="relative overflow-hidden rounded-xl border bg-muted/20">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={preview}
					alt="Uploaded image"
					className={cn(
						"w-full",
						aspect === "square" ? "aspect-square" : "aspect-video",
						fit === "contain"
							? "object-contain"
							: "object-cover",
					)}
					onError={() => {
						setPreview("");
						setUploadState("error");
					}}
				/>

				{/* Upload in-progress overlay */}
				{uploadState === "uploading" && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
						<IconLoader className="size-7 animate-spin text-white" />
					</div>
				)}

				{/* Status badges */}
				{uploadState === "done" && (
					<div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
						<IconCheck className="size-3" />
						Uploaded
					</div>
				)}
				{uploadState === "error" && (
					<div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-destructive px-2 py-1 text-xs font-medium text-white">
						<IconAlertCircle className="size-3" />
						Failed
					</div>
				)}

				{/* Clear button */}
				<button
					type="button"
					onClick={clear}
					className="absolute left-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
					aria-label="Remove image"
				>
					<IconX className="size-3.5" />
				</button>
			</div>
		);
	}

	// ── Drop zone + URL tab ───────────────────────────────────────────────────
	return (
		<div className="space-y-2">
			{/* Tab switcher */}
			<div className="flex rounded-lg border p-0.5 gap-0.5 w-fit bg-muted/40">
				<button
					type="button"
					onClick={() => setTab("upload")}
					className={cn(
						"flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
						tab === "upload"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<IconUpload className="size-3" />
					Upload file
				</button>
				<button
					type="button"
					onClick={() => setTab("url")}
					className={cn(
						"flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
						tab === "url"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<IconLink className="size-3" />
					Paste URL
				</button>
			</div>

			{tab === "upload" ? (
				<>
					<input
						ref={fileRef}
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={handleFile}
					/>
					<div
						role="button"
						tabIndex={0}
						onClick={() => fileRef.current?.click()}
						onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={(e) => e.preventDefault()}
						onDrop={handleDrop}
						className={cn(
							"flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8",
							"transition-all duration-150",
							isDragging
								? "scale-[1.01] border-primary bg-primary/8 text-primary"
								: "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
							"focus:outline-none focus:ring-2 focus:ring-ring",
						)}
					>
						<IconPhotoPlus
							className={cn(
								"size-8 transition-transform duration-150",
								isDragging && "scale-110",
							)}
						/>
						<div className="text-sm">
							{isDragging ? (
								<span className="font-semibold">Drop it here</span>
							) : (
								<>
									<span className="font-medium">{placeholder.split(" or ")[0]}</span>
									{" or drag & drop"}
								</>
							)}
						</div>
						<p className="text-xs">
							{isDragging ? "Release to upload" : hint}
						</p>
					</div>
				</>
			) : (
				<div className="space-y-2">
					<div className="flex gap-2">
						<Input
							type="url"
							placeholder="https://example.com/image.jpg"
							value={urlInput}
							onChange={(e) => {
								setUrlInput(e.target.value);
								setUrlError("");
							}}
							onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
							className="h-10 flex-1"
						/>
						<Button
							type="button"
							onClick={applyUrl}
							size="sm"
							className="shrink-0 h-10"
						>
							Use image
						</Button>
					</div>
					{urlError && (
						<p className="text-xs text-destructive flex items-center gap-1">
							<IconAlertCircle className="size-3" />
							{urlError}
						</p>
					)}
					<p className="text-xs text-muted-foreground">
						Paste a direct image URL — it will be used as-is without uploading to Cloudinary.
					</p>
				</div>
			)}
		</div>
	);
}
