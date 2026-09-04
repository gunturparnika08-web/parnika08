import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Helper function to safely get language with fallback
function getLanguagePreference() {
  try {
    const lang = localStorage.getItem("preferred_language");
    return lang || "en"; // Fallback to English if not set
  } catch (e) {
    console.warn("localStorage access failed:", e);
    return "en"; // Fallback to English on error
  }
}

// Helper function to get language label
function getLanguageLabel(code) {
  const langs = {
    te: "తెలుగు",
    hi: "हिन्दी",
    ta: "தமிழ்",
    kn: "ಕನ್ನಡ",
    bn: "বাংলা",
    en: "English",
  };
  return langs[code] || "English";
}

export default function AddProduct() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentLanguage = getLanguagePreference();

  async function pickFile(e) {
    if (!e.target.files[0]) return;
    setFile(e.target.files[0]);
  }

  // Quick demo STT using Web Speech API
  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("SpeechRecognition not supported in this browser");
      return;
    }

    const r = new SpeechRecognition();
    r.lang = currentLanguage === "en" ? "en-US" : `${currentLanguage}-IN`;
    
    r.onstart = () => {
      setError(null);
    };

    r.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      setText((t) => (t ? t + " " : "") + transcript);
    };

    r.onerror = (ev) => {
      setError("Speech recognition error: " + ev.error);
    };

    r.start();
  }

  async function analyze() {
    try {
      setLoading(true);
      setError(null);

      if (!file && !text) {
        setError("Please upload an image or provide a description");
        return;
      }

      let imageUrl = null;
      if (file) {
        const id = `uploads/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, id);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      const res = await fetch("/api/analyze_listing", {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
          speech_text: text,
          language: currentLanguage,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to analyze product");
      }

      const js = await res.json();
      setDraft(js.product);
    } catch (e) {
      setError(e.message || "Analysis failed");
      console.error("Analysis error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    try {
      if (!draft) {
        setError("No draft to publish");
        return;
      }

      setLoading(true);
      setError(null);

      const doc = {
        name_localized: { [currentLanguage]: draft.name.text },
        name_en: draft.name_en.text,
        description_localized: { [currentLanguage]: draft.description.text },
        description_en: draft.description_en.text,
        price: draft.price.amount,
        currency: draft.price.currency,
        photos: draft.photos || [],
        seller_id: "demo_seller", // replace with auth uid
        created_at: serverTimestamp(),
        published: true,
      };

      await addDoc(collection(db, "products"), doc);
      alert("Product published successfully!");
      window.location.href = "/products";
    } catch (e) {
      setError(e.message || "Failed to publish product");
      console.error("Publish error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center">
      <h2>Add Product (photo → voice/text → AI → confirm)</h2>
      <p style={{ fontSize: 12, color: "#666 }}>
        Language: <strong>{getLanguageLabel(currentLanguage)}</strong>
      </p>

      <input 
        type="file" 
        accept="image/*" 
        onChange={pickFile}
        disabled={loading}
      />
      {file && <p style={{ fontSize: 12 }}>📄 {file.name}</p>}

      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        rows={4} 
        placeholder="Type or record product description"
        disabled={loading}
      />

      <div>
        <button onClick={startListening} disabled={loading}>
          🎤 Record Voice (browser STT)
        </button>
        <button onClick={analyze} disabled={loading || (!file && !text)}>
          {loading ? "Analyzing..." : "✨ AI Analyze"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginTop: "10px", fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {draft && (
        <div className="card" style={{ marginTop: "20px", maxWidth: "400px" }}>
          <h3>📝 AI Draft</h3>
          <p>
            <strong>Name:</strong> {draft.name.text} 
            <br />
            <em style={{ fontSize: 12, color: "#666 }}>EN: {draft.name_en.text}</em>
          </p>
          <p>
            <strong>Description:</strong> {draft.description.text}
          </p>
          <p>
            <strong>Price:</strong> ₹{draft.price.amount} {draft.price.currency}
          </p>
          <p style={{ fontSize: 12, color: "#999 }}>
            Category: {draft.category?.label_en || "N/A"}
          </p>
          <button 
            onClick={publish} 
            disabled={loading}
            style={{ background: "#28a745", color: "white" }}
          >
            ✅ Confirm & Publish
          </button>
        </div>
      )}
    </div>
  );
}
