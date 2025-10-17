import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, File, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  courseId: string;
}

export const PDFUpload = ({ courseId }: Props) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; title: string; url: string }>>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload PDF files only");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error("Please provide both title and PDF file");
      return;
    }

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `course-materials/${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("course-materials")
        .getPublicUrl(filePath);

      const { data, error: dbError } = await supabase
        .from("files")
        .insert({
          course_id: courseId,
          title: title,
          file_path: filePath,
          url: publicUrl
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedFiles(prev => [...prev, { id: data.id, title: data.title, url: data.url }]);
      setTitle("");
      setFile(null);
      toast.success("PDF uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter content title..."
          required
          className="flex-1"
        />
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          required
          className="w-40"
        />
        <Button type="submit" disabled={loading}>
          <FileUp className="w-4 h-4 mr-2" />
          {loading ? "..." : "Upload"}
        </Button>
      </form>

      {uploadedFiles.length > 0 && (
        <div className="grid gap-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-blue-500" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  {file.title}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};