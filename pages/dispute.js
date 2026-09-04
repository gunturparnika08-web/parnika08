import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { arrayUnion } from "firebase/firestore";

export default function Dispute() {
  const router = useRouter();
  const { id } = router.query; // dispute id
  const [dispute, setDispute] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        if (!db) return;
        const d = await getDoc(doc(db, "disputes", id));
        if (d.exists()) setDispute({ id: d.id, ...d.data() });
      } catch (e) {
        console.error("Dispute load error", e);
      }
    })();
  }, [id]);

  async function pickFile(e) {
    if (!e.target.files[0]) return;
    setFile(e.target.files[0]);
  }

  async function uploadEvidence() {
    if (!file) return alert("Pick a file first");
    if (!storage || !db) return alert("Storage or Firestore not initialized");
    setUploading(true);
    try {
      const path = `disputes/${id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // append evidence URL to dispute document using arrayUnion
      await updateDoc(doc(db, "disputes", id), {
        evidence: arrayUnion({ url, uploaded_at: new Date().toISOString() }),
        status: "evidence_submitted",
      });
      setResult("Evidence uploaded. Thanks.");
      // reload dispute
      const d = await getDoc(doc(db, "disputes", id));
      if (d.exists()) setDispute({ id: d.id, ...d.data() });
    } catch (e) {
      console.error("Upload evidence error", e);
      setResult("Upload failed: " + (e.message || e));
    } finally {
      setUploading(false);
    }
  }

  if (!dispute) return <div className="center">Loading...</div>;

  return (
    <div className="container">
      <h2>Dispute {dispute.id}</h2>
      <p>Status: {dispute.status}</p>
      <div>
        <input type="file" accept="image/*,video/*" onChange={pickFile} />
        <button onClick={uploadEvidence} disabled={uploading}>{uploading ? "Uploading..." : "Upload evidence"}</button>
      </div>
      {result && <p>{result}</p>}
      <div style={{marginTop:20}}>
        <button onClick={() => router.push("/products")}>Back to marketplace</button>
      </div>
      <div style={{marginTop:20}}>
        <h4>Existing evidence</h4>
        {(dispute.evidence || []).map((e, i) => (
          <div key={i}><a href={e.url} target="_blank" rel="noreferrer">Evidence #{i+1}</a></div>
        ))}
      </div>
    </div>
  );
}
