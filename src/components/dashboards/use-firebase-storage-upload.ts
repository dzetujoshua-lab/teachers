import { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, StorageReference } from 'firebase/storage';
import { app } from '@/lib/firebase'; // Your client-side Firebase app initialization

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: Error | null;
  downloadUrl: string | null;
  snapshot: UploadTaskSnapshot | null;
}

/**
 * Custom hook for uploading files to Firebase Storage.
 * @param storagePath The path in Firebase Storage where the file will be stored (e.g., 'menus/weekly/').
 * @returns An object containing upload state and an upload function.
 */
export function useFirebaseStorageUpload(storagePath: string) {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    downloadUrl: null,
    snapshot: null,
  });

  const storage = getStorage(app);

  const uploadFile = useCallback(async (file: File, fileName?: string) => {
    setUploadState({
      progress: 0,
      isUploading: true,
      error: null,
      downloadUrl: null,
      snapshot: null,
    });

    if (!file) {
      setUploadState((prev) => ({ ...prev, error: new Error("No file selected."), isUploading: false }));
      return;
    }

    const fileRef = ref(storage, `${storagePath}${fileName || file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadState((prev) => ({ ...prev, progress, snapshot }));
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploadState((prev) => ({ ...prev, error, isUploading: false }));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState((prev) => ({ ...prev, downloadUrl: url, isUploading: false, error: null }));
        } catch (error) {
          console.error("Failed to get download URL:", error);
          setUploadState((prev) => ({ ...prev, error: error as Error, isUploading: false }));
        }
      }
    );

    return uploadTask; // Return the task for external management if needed
  }, [storage, storagePath]);

  return {
    ...uploadState,
    uploadFile,
  };
}