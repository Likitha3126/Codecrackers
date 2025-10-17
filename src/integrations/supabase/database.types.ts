export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          course_id: string
          due_date: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          course_id: string
          due_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          course_id?: string
          due_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      course_content: {
        Row: {
          id: string
          course_id: string
          title: string
          file_url: string
          file_path: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          file_url: string
          file_path: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          file_url?: string
          file_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          duration: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          duration: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          duration?: string
          teacher_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      grades: {
        Row: {
          id: string
          student_id: string
          assignment_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          assignment_id: string
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          assignment_id?: string
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          student_id: string
          assignment_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          assignment_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          assignment_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}