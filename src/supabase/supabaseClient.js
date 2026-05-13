// supabaseConfig.js
// Centralized Supabase configuration for the entire app

import { createClient } from "@supabase/supabase-js";

// Supabase credentials
export const supabaseUrl = "https://tmgntqxinsfygfijwkor.supabase.co";
export const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ250cXhpbnNmeWdmaWp3a29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc2NzgsImV4cCI6MjA5NDIzMzY3OH0.kBnRcq3GEkHX4Uy639JZxNDUkzwZ6CBQnl7TitLzf-M";

// Create and export Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Bucket name for images
export const BUCKET_NAME = "device_images";

// Helper functions for image operations

/**
 * Upload image to Supabase Storage
 * @param {Blob|File} file - Image file to upload
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{success: boolean, url?: string, filePath?: string, error?: string}>}
 */
export const uploadImage = async (file, userId) => {
	try {
		// Generate unique filename
		const fileExt = file.type?.split('/')[1] || 'jpg';
		const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
		const filePath = `posts/${fileName}`;

		// Upload to Supabase
		const { data, error } = await supabaseClient.storage
			.from(BUCKET_NAME)
			.upload(filePath, file, {
				cacheControl: "3600",
				upsert: false,
			});

		if (error) {
			console.error("Supabase upload error:", error);
			return { success: false, error: error.message };
		}

		// Get public URL
		const { data: { publicUrl } } = supabaseClient.storage
			.from(BUCKET_NAME)
			.getPublicUrl(filePath);

		console.log("✅ Image uploaded:", publicUrl);

		return {
			success: true,
			url: publicUrl,
			filePath: filePath,
		};

	} catch (error) {
		console.error("Upload error:", error);
		return { success: false, error: error.message };
	}
};

/**
 * Delete image from Supabase Storage
 * @param {string} filePath - File path in storage (e.g., "posts/user123_1234567890.jpg")
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (filePath) => {
	try {
		const { error } = await supabaseClient.storage
			.from(BUCKET_NAME)
			.remove([filePath]);

		if (error) {
			console.error("Supabase delete error:", error);
			return { success: false, error: error.message };
		}

		console.log("✅ Image deleted:", filePath);
		return { success: true };

	} catch (error) {
		console.error("Delete error:", error);
		return { success: false, error: error.message };
	}
};

/**
 * Extract file path from Supabase URL
 * @param {string} url - Full Supabase public URL
 * @returns {string|null} - File path or null if extraction fails
 */
export const extractFilePathFromUrl = (url) => {
	try {
		const urlParts = url.split(`/${BUCKET_NAME}/`);
		return urlParts.length > 1 ? urlParts[1] : null;
	} catch (error) {
		console.error("Error extracting file path:", error);
		return null;
	}
};

/**
 * Get list of user's images
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export const getUserImages = async (userId) => {
	try {
		const { data, error } = await supabaseClient.storage
			.from(BUCKET_NAME)
			.list('posts', {
				limit: 100,
				offset: 0,
				sortBy: { column: 'created_at', order: 'desc' }
			});

		if (error) {
			console.error("List images error:", error);
			return [];
		}

		// Filter images by userId prefix
		const userImages = data
			.filter(file => file.name.startsWith(userId))
			.map(file => {
				const { data: { publicUrl } } = supabaseClient.storage
					.from(BUCKET_NAME)
					.getPublicUrl(`posts/${file.name}`);
				
				return {
					name: file.name,
					url: publicUrl,
					createdAt: file.created_at,
				};
			});

		return userImages;

	} catch (error) {
		console.error("Get user images error:", error);
		return [];
	}
};

export default supabaseClient;