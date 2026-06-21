import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMjXNfI3P9k68qT2rju0VuqkW9Gz2uZiY",
  authDomain: "focusflow-ext-101.firebaseapp.com",
  projectId: "focusflow-ext-101"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const querySnapshot = await getDocs(collection(db, "timeEntries"));
  const docs = [];
  querySnapshot.forEach((doc) => {
    docs.push(doc.data());
  });
  console.log("Documents in timeEntries:", JSON.stringify(docs, null, 2));
  process.exit(0);
}

main().catch(console.error);
