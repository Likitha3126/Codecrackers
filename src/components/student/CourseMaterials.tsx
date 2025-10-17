import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { File } from "lucide-react";

interface CourseMaterial {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

interface Props {
  courseId: string;
}

export const CourseMaterials = ({ courseId }: Props) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error("Error fetching course materials:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading course materials...</div>;
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No course materials available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {materials.map((material) => (
        <Card key={material.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-blue-500" />
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  {material.title}
                </a>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(material.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};