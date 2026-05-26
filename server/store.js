import { MongoClient } from "mongodb";

let firebaseStorePromise;
let mongoClientPromise;
let mongoIndexPromise;

const memoryStore = new Map();
const localDataFile = new URL("../data/prescriptions.json", import.meta.url);
const mongoDatabaseName = process.env.MONGODB_DB ?? "medflow";
const mongoCollectionName = process.env.MONGODB_COLLECTION ?? "prescriptions";

export async function savePrescription(prescriptionId, payload) {
  const mongoCollection = await getMongoCollectionIfConfigured();

  if (mongoCollection) {
    await mongoCollection.updateOne(
      { prescriptionId },
      { $set: { ...payload, prescriptionId } },
      { upsert: true },
    );
    return;
  }

  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    await firestore.collection("prescriptions").doc(prescriptionId).set(payload);
    return;
  }

  await loadLocalPrescriptions();
  memoryStore.set(prescriptionId, {
    ...payload,
    createdAt: new Date(),
  });
  await persistLocalPrescriptions();
}

export async function findPrescription(prescriptionId) {
  const mongoCollection = await getMongoCollectionIfConfigured();

  if (mongoCollection) {
    return mongoCollection.findOne({ prescriptionId });
  }

  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    const snapshot = await firestore.collection("prescriptions").doc(prescriptionId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  await loadLocalPrescriptions();
  return memoryStore.get(prescriptionId) ?? null;
}

export async function listPrescriptions() {
  const mongoCollection = await getMongoCollectionIfConfigured();

  if (mongoCollection) {
    return mongoCollection.find({}).sort({ createdAt: -1 }).limit(25).toArray();
  }

  const firestore = await getFirestoreIfConfigured();

  if (firestore) {
    const snapshot = await firestore
      .collection("prescriptions")
      .orderBy("createdAt", "desc")
      .limit(25)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  await loadLocalPrescriptions();
  return [...memoryStore.values()]
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
    .slice(0, 25);
}

export function usesFirebase() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && !process.env.MONGODB_URI);
}

export function getStorageInfo() {
  if (process.env.MONGODB_URI) {
    return {
      provider: "mongodb",
      database: mongoDatabaseName,
      collection: mongoCollectionName,
    };
  }

  if (usesFirebase()) {
    return {
      provider: "firebase",
      database: process.env.FIREBASE_PROJECT_ID,
      collection: "prescriptions",
    };
  }

  return {
    provider: "local",
    database: "data/prescriptions.json",
    collection: "prescriptions",
  };
}

export async function checkStorageConnection() {
  try {
    const mongoCollection = await getMongoCollectionIfConfigured();

    if (mongoCollection) {
      await mongoCollection.db.command({ ping: 1 });
      return {
        ok: true,
        provider: "mongodb",
      };
    }

    return {
      ok: true,
      provider: getStorageInfo().provider,
    };
  } catch (error) {
    return {
      ok: false,
      provider: getStorageInfo().provider,
      errorName: error.name,
      errorCode: error.codeName ?? error.code ?? null,
      message: sanitizeConnectionError(error.message),
    };
  }
}

async function getMongoCollectionIfConfigured() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    mongoClientPromise = client.connect().catch((error) => {
      mongoClientPromise = null;
      mongoIndexPromise = null;
      throw error;
    });
  }

  const client = await mongoClientPromise;
  const collection = client.db(mongoDatabaseName).collection(mongoCollectionName);

  if (!mongoIndexPromise) {
    mongoIndexPromise = collection.createIndex({ prescriptionId: 1 }, { unique: true }).catch((error) => {
      mongoIndexPromise = null;
      throw error;
    });
  }

  await mongoIndexPromise;
  return collection;
}

function sanitizeConnectionError(message = "") {
  return message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb$1://<credentials>@");
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

async function loadLocalPrescriptions() {
  if (memoryStore.size > 0) {
    return;
  }

  try {
    const fs = await import("node:fs/promises");
    const data = JSON.parse(await fs.readFile(localDataFile, "utf8"));

    if (!Array.isArray(data.prescriptions)) {
      return;
    }

    for (const prescription of data.prescriptions) {
      if (prescription.prescriptionId) {
        memoryStore.set(prescription.prescriptionId, prescription);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Unable to load local prescriptions", error);
    }
  }
}

async function persistLocalPrescriptions() {
  const fs = await import("node:fs/promises");
  await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await fs.writeFile(
    localDataFile,
    JSON.stringify({ prescriptions: [...memoryStore.values()] }, null, 2),
  );
}
