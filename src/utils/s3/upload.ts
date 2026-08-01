import toast from "react-hot-toast";

let activeUploads = 0;

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = "An upload is currently in progress. If you leave now, it will be cancelled.";
  return e.returnValue;
};

const incrementUploads = () => {
  activeUploads++;
  if (activeUploads === 1 && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
};

const decrementUploads = () => {
  activeUploads = Math.max(0, activeUploads - 1);
  if (activeUploads === 0 && typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
};

export async function uploadToS3(file: File): Promise<string> {
  incrementUploads();

  try {
    const presignRes = await fetch('/api/upload/presign/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      }),
    }).catch(() => null)

    if (!presignRes || !presignRes.ok) {
      console.warn('S3 Presign API unconfigured, returning local Blob URL for demo.');
      return URL.createObjectURL(file);
    }

    const { presignedUrl, publicUrl } = await presignRes.json()

    const uploadRequest = fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || 'application/octet-stream',
      },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    });

    await toast.promise(
      uploadRequest,
      {
        loading: 'Uploading...',
        success: 'File successfully uploaded!',
        error: 'Upload pipeline failed.',
      },
      {
        style: {
          minWidth: '250px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
        },
      }
    );

    return publicUrl;

  } catch (error: any) {
    console.warn("S3 Upload Error, falling back to local URL:", error);
    return URL.createObjectURL(file);
  } finally {
    decrementUploads();
  }
}
