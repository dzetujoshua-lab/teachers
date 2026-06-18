"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, UploadCloud, CheckCircle, XCircle } from "lucide-react";
import { useFirebaseStorageUpload } from "@/components/dashboards/use-firebase-storage-upload";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/hooks/use-auth"; // Assuming a hook to get current user's UID

export function MenuUploadForm() {
  const { user } = useAuth(); // Get current user for uploaded_by
  const [file, setFile] = useState<File | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>(""); // YYYY-MM-DD format
  const { uploadFile, progress, isUploading, error, downloadUrl } = useFirebaseStorageUpload('menus/');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (!weekStartDate) {
      alert("Please select the week start date.");
      return;
    }
    if (!user?.uid) {
      alert("User not authenticated. Cannot upload menu.");
      return;
    }

    // Upload the file to Firebase Storage
    await uploadFile(file, `${weekStartDate}-${file.name}`);
  };

  // Effect to save metadata to Firestore once the file is uploaded and downloadUrl is available
  React.useEffect(() => {
    const saveMenuMetadata = async () => {
      if (downloadUrl && weekStartDate && user?.uid && !isSavingMetadata) {
        setIsSavingMetadata(true);
        try {
          await addDoc(collection(db, "menus"), {
            week_start: weekStartDate,
            menu_url: downloadUrl,
            uploaded_by: user.uid,
            uploaded_at: serverTimestamp(),
          });
          alert("Menu uploaded and metadata saved successfully!");
          // Reset form
          setFile(null);
          setWeekStartDate("");
        } catch (e) {
          console.error("Error saving menu metadata to Firestore:", e);
          alert("Failed to save menu metadata to Firestore.");
        } finally {
          setIsSavingMetadata(false);
        }
      }
    };
    saveMenuMetadata();
  }, [downloadUrl, weekStartDate, user?.uid, isSavingMetadata]);

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Upload Weekly Menu</h3>
      <p className="text-sm text-muted-foreground">Upload a PDF or image file for the weekly menu.</p>

      <div>
        <Label htmlFor="week-start-date" className="mb-2 block">Week Start Date</Label>
        <Input
          id="week-start-date"
          type="date"
          value={weekStartDate}
          onChange={(e) => setWeekStartDate(e.target.value)}
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="menu-file" className="mb-2 block">Menu File (PDF/Image)</Label>
        <Input
          id="menu-file"
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="w-full"
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !weekStartDate || isUploading || isSavingMetadata}
        className="w-full"
      >
        {isUploading || isSavingMetadata ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isUploading ? `Uploading... ${progress.toFixed(0)}%` : isSavingMetadata ? "Saving Menu..." : "Upload Menu"}
      </Button>

      {error && <p className="text-red-500 text-sm flex items-center"><XCircle className="mr-1 h-4 w-4" /> Error: {error.message}</p>}
      {downloadUrl && !isUploading && !isSavingMetadata && !error && <p className="text-green-500 text-sm flex items-center"><CheckCircle className="mr-1 h-4 w-4" /> Upload successful! <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="ml-1 underline">View Menu</a></p>}
    </Card>
  );
}