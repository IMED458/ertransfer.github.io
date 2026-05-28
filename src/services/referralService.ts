import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  deleteField,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { Referral } from "../types";

const COLLECTION = "referrals";

export function subscribeToReferrals(
  onUpdate: (referrals: Referral[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const referrals: Referral[] = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<Referral, "id">),
        id: d.id,
      }));
      onUpdate(referrals);
    },
    (err) => onError(err)
  );
}

export async function addReferral(
  data: Omit<Referral, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    emergencyComment: "",
    status: "აქტიური",
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateReferralStatus(
  id: string,
  status: Referral["status"],
  emergencyComment?: string
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const patch: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (emergencyComment !== undefined) {
    patch.emergencyComment = emergencyComment.trim();
  }
  if (status === "მოვიდა - დასრულებულია") {
    patch.completedAt = new Date().toISOString();
  } else if (status === "აქტიური") {
    // undo — remove completedAt when going back
    patch.completedAt = deleteField();
  }
  await updateDoc(ref, patch);
}

export async function deleteReferral(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
