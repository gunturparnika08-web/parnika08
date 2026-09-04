import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import Link from "next/link";

export default function Checkout() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await getDoc(doc(db, "products", id));
        if (d.exists()) setProduct({ id: d.id, ...d.data() });
      } catch (e) {
        console.error("Product load error:", e);
      }
    })();
  }, [id]);

  async function processPayment() {
    try {
      setLoading(true);
      
      // Mock payment processing
      const order = {
        product_id: id,
        product_name: product.name_en || "Product",
        price: product.price,
        currency: product.currency,
        buyer_id: "demo_buyer",
        seller_id: product.seller_id,
        status: "pending",
        payment_status: "completed",
        created_at: serverTimestamp(),
        receipt_text: `Order confirmed for ₹${product.price}. Seller will contact you soon.`,
        receipt_language: localStorage.getItem("preferred_language") || "en",
      };

      const docRef = await addDoc(collection(db, "orders"), order);
      alert("Payment successful! Order created.");
      router.push(`/order/${docRef.id}`);
    } catch (e) {
      alert("Payment failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!product) return <div className="center">Loading...</div>;

  return (
    <div className="container">
      <h2>Checkout</h2>
      <div className="card" style={{ maxWidth: "500px" }}>
        <h3>{product.name_en || Object.values(product.name_localized || {})[0]}</h3>
        {product.photos?.[0] && (
          <img src={product.photos[0]} style={{ width: "100%", maxHeight: "300px", objectFit: "cover" }} />
        )}
        <p>{product.description_en || Object.values(product.description_localized || {})[0]}</p>
        <div style={{ fontSize: 24, fontWeight: "bold", margin: "20px 0" }}>
          Price: ₹{product.price}
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          Seller: {product.seller_id}
        </p>
        <button 
          onClick={processPayment} 
          disabled={loading}
          style={{ background: "#007bff", color: "white", width: "100%", padding: "12px" }}
        >
          {loading ? "Processing..." : "Confirm & Pay"}
        </button>
        <Link href="/products">
          <button style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
            Cancel
          </button>
        </Link>
      </div>
    </div>
  );
}
