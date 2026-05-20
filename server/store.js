let firebaseStorePromise;

const memoryStore = new Map();

export async function savePrescription(prescriptionId, payload) {
  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    await firestore.collection("prescriptions").doc(prescriptionId).set(payload);
    return;
  }

  memoryStore.set(prescriptionId, {
    ...payload,
    createdAt: new Date(),
  });
}

export async function findPrescription(prescriptionId) {
  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    const snapshot = await firestore.collection("prescriptions").doc(prescriptionId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  return memoryStore.get(prescriptionId) ?? null;
}

export async function listPrescriptions() {
  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    const snapshot = await firestore
      .collection("prescriptions")
      .orderBy("createdAt", "desc")
      .limit(25)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  return [...memoryStore.values()]
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
    .slice(0, 25);
}

export function usesFirebase() {
  return Boolean(process.env.FIREBASE_PROJECT_ID);
}

async function getFirestoreIfConfigured() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  if (!firebaseStorePromise) {
    firebaseStorePromise = import("./firebase-admin.js").then((module) => module.db);
  }

  return firebaseStorePromise;
}

function toMillis(value) {
  if (value?.toMillis) {
    return value.toMillis();
  }

  return new Date(value).getTime();
}
