import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, File, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CourseContent as CourseContentType } from "@/integrations/supabase/content.types";

interface CourseContentProps {
  courseId: string;
}

interface ContentItem {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  file_path: string;
  created_at: string;
}

export const CourseContent = ({ courseId }: CourseContentProps) => {
  // Supabase currently doesn't know about our new table, so we'll cast it
  const courseContentTable = "course_content" as "courses";
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);

  // Load existing content when component mounts
  useState(() => {
    fetchContent();
  }, [courseId]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("course_content")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error: any) {
      toast.error("Failed to load course content");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is PDF
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload PDF files only");
        return;
      }
      // Check file size (max 10MB)
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
      // 1. Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `course-content/${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("course-materials")
        .getPublicUrl(filePath);

      // 3. Save content metadata to database
      const { error: dbError } = await supabase.from("course_content").insert({
        course_id: courseId,
        title: title,
        file_url: publicUrl,
        file_path: filePath,
      });

      if (dbError) throw dbError;

      toast.success("Content uploaded successfully!");
      setTitle("");
      setFile(null);
      fetchContent(); // Refresh content list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId: string, filePath: string) => {
    try {
      // 1. Delete file from storage
      const { error: storageError } = await supabase.storage
        .from("course-materials")
        .remove([filePath]);

      if (storageError) throw storageError;

      // 2. Delete metadata from database
      const { error: dbError } = await supabase
        .from("course_content")
        .delete()
        .eq("id", contentId);

      if (dbError) throw dbError;

      toast.success("Content deleted successfully");
      fetchContent(); // Refresh content list
    } catch (error: any) {
      toast.error("Failed to delete content");
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Quick Upload Form */}
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

      {/* Content List */}
      <div className="space-y-2">
        {contents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No content uploaded yet.</p>
        ) : (
          <div className="grid gap-2">
            {contents.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File className="w-4 h-4 text-blue-500 shrink-0" />
                  <a
                    href={content.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline truncate"
                  >
                    {content.title}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(content.id, content.file_path)}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};