import { useEffect, useMemo, useState } from "react";
import { api, setToken } from "./api.js";

const BRAND = import.meta.env.VITE_BRAND || "YourBrand";
const FREE_ABOVE = 199, DELIVERY = 25, HANDLING = 5;
const STAGES = ["Confirmed", "Packing", "On the way", "Delivered"];
const inr = (n) => "₹" + n;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

function Stepper({ q, id, setQty }) {
  if (!q) return <button className="add" onClick={() => setQty(id, 1)}>ADD</button>;
  return (
    <div className="step">
      <button aria-label="Remove one" onClick={() => setQty(id, q - 1)}>−</button>
      <span>{q}</span>
      <button aria-label="Add one" onClick={() => setQty(id, q + 1)}>+</button>
    </div>
  );
}

function ProductCard({ p, q, setQty }) {
  return (
    <div className="p">
      <div className="im">{p.image ? <img src={p.image} alt={p.name} /> : p.emoji}</div>
      <span className="eta">⏱ 10 MINS</span>
      <div className="n">{p.name}</div>
      <div className="u">{p.unit}</div>
      <div className="row">
        <div className="price">{inr(p.price)}{p.mrp > p.price && <s>{inr(p.mrp)}</s>}</div>
        <Stepper q={q} id={p._id} setQty={setQty} />
      </div>
    </div>
  );
}

function Sheet({ title, onClose, onBack, children, foot }) {
  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sh">
          {onBack ? <button onClick={onBack} aria-label="Back">‹</button> : <span />}
          <span>{title}</span>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sb">{children}</div>
        {foot && <div className="foot">{foot}</div>}
      </div>
    </div>
  );
}

function CartSheet({ lines, bill, setQty, onClose, onNext }) {
  if (!lines.length)
    return <Sheet title="My cart" onClose={onClose}><div className="empty"><div className="big">🛒</div>Your cart is empty.<br />Add something to get started.</div></Sheet>;
  const left = Math.max(0, FREE_ABOVE - bill.sub);
  return (
    <Sheet title="My cart" onClose={onClose} foot={<button className="cta" onClick={onNext}>Continue to checkout</button>}>
      <div className="free">{left ? `Add ${inr(left)} more for free delivery` : "You get free delivery 🎉"}
        <i><b style={{ width: Math.min(100, (bill.sub / FREE_ABOVE) * 100) + "%" }} /></i></div>
      <div className="box">
        {lines.map(({ p, q }) => (
          <div className="ci" key={p._id}>
            <div className="e">{p.emoji}</div>
            <div className="t">{p.name}<div className="u">{p.unit} · {inr(p.price)}</div></div>
            <Stepper q={q} id={p._id} setQty={setQty} />
          </div>
        ))}
      </div>
      <div className="box bill">
        <div><span>Items total</span><span>{inr(bill.sub)}</span></div>
        <div><span>Delivery fee</span><span>{bill.delivery ? inr(bill.delivery) : "FREE"}</span></div>
        <div><span>Handling fee</span><span>{inr(bill.handling)}</span></div>
        <div className="tot"><span>To pay</span><span>{inr(bill.total)}</span></div>
      </div>
    </Sheet>
  );
}

function LoginSheet({ onClose, onBack, onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const body = mode === "login" ? { phone: f.phone, password: f.password } : f;
      const { token, user } = await api(`/api/auth/${mode}`, { method: "POST", body });
      onDone(token, user);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Sheet title={mode === "login" ? "Log in" : "Create account"} onClose={onClose} onBack={onBack}
      foot={<button className="cta" disabled={busy} onClick={submit}>{mode === "login" ? "Log in" : "Create account"}</button>}>
      <div className="box">
        {mode === "register" && <label className="f">Full name<input value={f.name} onChange={set("name")} autoComplete="name" /></label>}
        <label className="f">Phone number<input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} autoComplete="tel" /></label>
        <label className="f">Password<input type="password" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {err && <div className="err">{err}</div>}
        <button className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </div>
    </Sheet>
  );
}

function CheckoutSheet({ user, lines, bill, onClose, onBack, onPlaced, onAuthExpired }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone, line: "", pincode: "" });
  const [pay, setPay] = useState("Cash on delivery");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const place = async () => {
    setBusy(true); setErr("");
    try {
      const order = await api("/api/orders", {
        method: "POST",
        body: { items: lines.map(({ p, q }) => ({ productId: p._id, qty: q })), address: f, paymentMethod: pay },
      });
      onPlaced(order);
    } catch (e) {
      if (e.status === 401) return onAuthExpired();
      setErr(e.message);
    }
    setBusy(false);
  };
  return (
    <Sheet title="Checkout" onClose={onClose} onBack={onBack}
      foot={<button className="cta" disabled={busy} onClick={place}>Place order · {inr(bill.total)}</button>}>
      <div className="box">
        <label className="f">Full name<input value={f.name} onChange={set("name")} autoComplete="name" /></label>
        <label className="f">Phone number<input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} autoComplete="tel" /></label>
        <label className="f">Delivery address<input value={f.line} onChange={set("line")} autoComplete="street-address" /></label>
        <label className="f">Pincode<input value={f.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} /></label>
      </div>
      <div className="box">
        <label className="f">Payment
          <select value={pay} onChange={(e) => setPay(e.target.value)}>
            <option>Cash on delivery</option><option>UPI (demo)</option><option>Card (demo)</option>
          </select>
        </label>
      </div>
      {err && <div className="err">{err}</div>}
    </Sheet>
  );
}

function TrackSheet({ orderId, initial, onClose }) {
  const [o, setO] = useState(initial);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try { const n = await api(`/api/orders/${orderId}`); if (!stop) setO(n); if (n.status === "Delivered") return; } catch {}
      if (!stop) setTimeout(tick, 4000);
    };
    tick();
    return () => { stop = true; };
  }, [orderId]);
  const idx = STAGES.indexOf(o.status);
  return (
    <Sheet title={`Order #${String(o._id).slice(-6).toUpperCase()}`} onClose={onClose}>
      <div className="box" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 54 }}>{idx === 3 ? "✅" : "🛵"}</div>
        <b>{idx === 3 ? "Delivered. Enjoy!" : "Arriving in about 10 minutes"}</b>
        <div className="u">{o.items.reduce((s, i) => s + i.qty, 0)} items · {inr(o.total)}</div>
        <div className="track">{STAGES.map((s, i) => <div key={s} className={i <= idx ? "on" : ""}><span>{i + 1}</span>{s}</div>)}</div>
      </div>
    </Sheet>
  );
}

function OrdersSheet({ onClose, onOpen }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/orders").then(setList).catch((e) => setErr(e.message)); }, []);
  return (
    <Sheet title="My orders" onClose={onClose}>
      {err && <div className="err">{err}</div>}
      {list && !list.length && <div className="empty"><div className="big">📦</div>No orders yet.</div>}
      {list && list.map((o) => (
        <button key={o._id} className="box" style={{ width: "100%", textAlign: "left" }} onClick={() => onOpen(o)}>
          <b>#{String(o._id).slice(-6).toUpperCase()}</b> · {inr(o.total)} · {o.status}
          <div className="u">{o.items.reduce((s, i) => s + i.qty, 0)} items · {new Date(o.createdAt).toLocaleString()}</div>
        </button>
      ))}
    </Sheet>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("All");
  const [term, setTerm] = useState("");
  const [cart, setCart] = useState(() => load("cart", {}));
  const [user, setUser] = useState(() => load("user", null));
  const [view, setView] = useState(null); // cart | login | checkout | track | orders
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { document.title = BRAND; }, []);
  useEffect(() => {
    api("/api/products").then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 1600); return () => clearTimeout(t); }, [toast]);

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p._id, p])), [products]);
  const cats = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);
  const lines = Object.entries(cart).filter(([id]) => byId[id]).map(([id, q]) => ({ p: byId[id], q }));
  const count = lines.reduce((s, l) => s + l.q, 0);
  const sub = lines.reduce((s, l) => s + l.p.price * l.q, 0);
  const bill = { sub, delivery: !sub || sub >= FREE_ABOVE ? 0 : DELIVERY, handling: sub ? HANDLING : 0 };
  bill.total = bill.sub + bill.delivery + bill.handling;

  const setQty = (id, q) => {
    if (q === 1 && !cart[id]) setToast("Added to cart");
    setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = Math.min(q, 20); return n; });
  };
  const login = (token, u) => {
    setToken(token); setUser(u);
    try { localStorage.setItem("user", JSON.stringify(u)); } catch {}
    setView(lines.length ? "checkout" : null);
  };
  const logout = () => { setToken(null); setUser(null); try { localStorage.removeItem("user"); } catch {} };
  const placed = (o) => { setCart({}); setOrder(o); setView("track"); };

  const q = term.trim().toLowerCase();
  const list = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q));
  const sections = cat === "All" && !q ? cats.slice(1) : null;
  const grid = (arr) => <div className="grid">{arr.map((p) => <ProductCard key={p._id} p={p} q={cart[p._id] || 0} setQty={setQty} />)}</div>;

  return (
    <>
      <header><div className="wrap">
        <div className="top">
          <div className="logo">{BRAND}</div>
          <div className="loc">Delivery in <b>10 minutes</b></div>
          <div className="hbtns">
            {user ? <button className="ghost" onClick={() => setView("orders")}>Orders</button>
                  : <button className="ghost" onClick={() => setView("login")}>Log in</button>}
            <button className="cartbtn" onClick={() => setView("cart")} aria-label="Open cart">🛒 <span>{count}</span></button>
          </div>
        </div>
        <label className="search"><span>🔍</span>
          <input type="search" placeholder="Search milk, chips, soap…" value={term} onChange={(e) => setTerm(e.target.value)} />
        </label>
      </div></header>

      <div className="wrap">
        <div className="hero"><div><h1>Groceries in<br />10 minutes</h1><p>Free delivery above {inr(FREE_ABOVE)}</p></div><div className="big">🛵</div></div>
        <div className="chips">{cats.map((c) => <button key={c} className={"chip" + (c === cat ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}</div>
        <main>
          {loading && <div className="empty">Loading products…</div>}
          {error && <div className="empty"><div className="big">⚠️</div>{error}</div>}
          {!loading && !error && !list.length && <div className="empty"><div className="big">🔎</div>No items match “{term}”. Try another word.</div>}
          {sections ? sections.map((c) => <section key={c}><h2>{c}</h2>{grid(products.filter((p) => p.category === c))}</section>)
                    : list.length > 0 && <section><h2>{q ? "Results" : cat}</h2>{grid(list)}</section>}
          {user && <p className="u" style={{ marginTop: 24 }}>Logged in as {user.name}. <button className="link" onClick={logout}>Log out</button></p>}
        </main>
      </div>

      {count > 0 && !view && <div className="bar"><button onClick={() => setView("cart")}><span>{count} {count === 1 ? "item" : "items"} · {inr(sub)}</span><span>View cart ›</span></button></div>}
      {toast && <div className="toast">{toast}</div>}

      {view === "cart" && <CartSheet lines={lines} bill={bill} setQty={setQty} onClose={() => setView(null)} onNext={() => setView(user ? "checkout" : "login")} />}
      {view === "login" && <LoginSheet onClose={() => setView(null)} onBack={lines.length ? () => setView("cart") : null} onDone={login} />}
      {view === "checkout" && user && <CheckoutSheet user={user} lines={lines} bill={bill} onClose={() => setView(null)} onBack={() => setView("cart")} onPlaced={placed} onAuthExpired={() => { logout(); setView("login"); }} />}
      {view === "track" && order && <TrackSheet orderId={order._id} initial={order} onClose={() => setView(null)} />}
      {view === "orders" && <OrdersSheet onClose={() => setView(null)} onOpen={(o) => { setOrder(o); setView("track"); }} />}
    </>
  );
}
