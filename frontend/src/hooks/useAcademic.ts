import { useQuery } from "@tanstack/react-query";
import { api, type ItemResponse } from "../lib/api";

export type Semester = { _id: string; name: string; code?: string; order?: number };
export type Subject = { _id: string; name: string; semester: string; code?: string };
export type Topic = { _id: string; name: string; subject: string };
export type TreeSemester = Semester & { subjects: (Subject & { topics: Topic[] })[] };

export function useTree() {
  return useQuery({
    queryKey: ["academic-tree"],
    queryFn: () => api<ItemResponse<TreeSemester[]>>("/api/tree"),
  });
}

export function useSemesters() {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: () => api<ItemResponse<Semester[]>>("/api/semesters"),
  });
}

export function useSubjects(semester?: string) {
  return useQuery({
    queryKey: ["subjects", semester],
    queryFn: () => api<ItemResponse<Subject[]>>(`/api/subjects${semester ? `?semester=${semester}` : ""}`),
  });
}

export function useTopics(subject?: string) {
  return useQuery({
    queryKey: ["topics", subject],
    queryFn: () => api<ItemResponse<Topic[]>>(`/api/topics${subject ? `?subject=${subject}` : ""}`),
  });
}
