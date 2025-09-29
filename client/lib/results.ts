import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
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
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  let best: ResultDoc | null = null;
  for (const d of snap.docs) {
    const data = d.data() as any;
    const created = (data.createdAt as any)?.toMillis?.() || Number(data.generatedDateTime || 0) || 0;
    if (!best || created > ((best.createdAt as any)?.toMillis?.() || best.generatedDateTime || 0)) {
      best = {
        id: d.id,
        userId: String(data.userId || ""),
        examType: String(data.examType || "exam") as ExamType,
        content: String(data.content || ""),
        createdAt: data.createdAt ?? null,
        generatedDateTime: Number(data.generatedDateTime || 0) || undefined,
      };
    }
  }
  return best;
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
  );
  const snap = await getDocs(q);
  const arr = snap.docs.map((d) => {
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
  return arr.sort((a, b) => {
    const at = (a.createdAt as any)?.toMillis?.() || a.generatedDateTime || 0;
    const bt = (b.createdAt as any)?.toMillis?.() || b.generatedDateTime || 0;
    return bt - at;
  });
}
