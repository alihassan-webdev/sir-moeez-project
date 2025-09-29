import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

export type ExamType = "mcqs" | "qna" | "exam";

export const examTypeLabels: Record<ExamType, string> = {
  mcqs: "MCQ Generator",
  qna: "Questions Generator",
  exam: "Exam Generator",
};

export type ResultDoc = {
  id: string;
  userId: string;
  examType: ExamType;
  content: string;
  createdAt?: Timestamp | null;
  generatedDateTime?: number;
};

export async function saveResult(params: {
  examType: ExamType;
  content: string;
}): Promise<string | null> {
  const u = auth.currentUser;
  const userId = u?.uid || u?.email || null;
  if (!userId) return null;
  const payload = {
    userId,
    examType: params.examType,
    content: params.content,
    createdAt: serverTimestamp(),
    generatedDateTime: Date.now(),
  };
  const ref = await addDoc(collection(db, "results"), payload);
  return ref.id;
}

export async function fetchLastAttemptByType(examType: ExamType): Promise<
  ResultDoc | null
> {
  const u = auth.currentUser;
  const userId = u?.uid || u?.email || null;
  if (!userId) return null;
  const q = query(
    collection(db, "results"),
    where("userId", "==", userId),
    where("examType", "==", examType),
    orderBy("createdAt", "desc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as any;
  return {
    id: d.id,
    userId: String(data.userId || ""),
    examType: String(data.examType || "exam") as ExamType,
    content: String(data.content || ""),
    createdAt: data.createdAt ?? null,
    generatedDateTime: Number(data.generatedDateTime || 0) || undefined,
  };
}

export async function fetchAllResultsByType(examType: ExamType): Promise<
  ResultDoc[]
> {
  const u = auth.currentUser;
  const userId = u?.uid || u?.email || null;
  if (!userId) return [];
  const q = query(
    collection(db, "results"),
    where("userId", "==", userId),
    where("examType", "==", examType),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      userId: String(data.userId || ""),
      examType: String(data.examType || "exam") as ExamType,
      content: String(data.content || ""),
      createdAt: data.createdAt ?? null,
      generatedDateTime: Number(data.generatedDateTime || 0) || undefined,
    } as ResultDoc;
  });
}
