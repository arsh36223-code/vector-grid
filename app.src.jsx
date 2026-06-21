const { useState, useEffect, useMemo } = React;
const API = "";

const T = { paper:"#13100D", card:"#1C1814", ink:"#F3EFE8", inkSoft:"#B9B0A3", muted:"#8A8175", line:"#2F2922", marigold:"#EF901E", marigoldDark:"#C96A00", teal:"#2CBBA9", tint:"#221A11", danger:"#E5685A" };
const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar"];
const SEED = [
  { id:"p1", name:"Minimalist Steel Water Bottle", price:549, mrp:899, stock:42, category:"Drinkware", img:"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80", desc:"Insulated 750ml bottle. Keeps cold 24h, hot 12h." },
  { id:"p2", name:"Linen Cushion Cover (Set of 2)", price:699, mrp:1199, stock:30, category:"Home", img:"https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80", desc:"16x16 inch, washed linen, hidden zip." },
  { id:"p3", name:"Wireless Earbuds — Bass Edition", price:1299, mrp:2499, stock:12, category:"Audio", img:"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80", desc:"ENC mic, 40h playback, IPX5." },
  { id:"p4", name:"Stoneware Coffee Mug (350ml)", price:399, mrp:649, stock:60, category:"Drinkware", img:"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80", desc:"Hand-glazed ceramic mug, microwave safe." },
  { id:"p5", name:"Woven Seagrass Storage Basket", price:849, mrp:1499, stock:18, category:"Home", img:"https://images.unsplash.com/photo-1595408076683-d0d8d5e8e0e9?w=600&q=80", desc:"Handwoven basket with handles. 30cm." },
  { id:"p6", name:"Portable Bluetooth Speaker", price:1599, mrp:2999, stock:9, category:"Audio", img:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", desc:"12h playtime, deep bass, IPX6 splash-proof." },
  { id:"p7", name:"Heavy Canvas Tote Bag", price:449, mrp:799, stock:75, category:"Accessories", img:"https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80", desc:"12oz cotton canvas, roomy, everyday carry." },
  { id:"p8", name:"Adjustable LED Desk Lamp", price:1099, mrp:1899, stock:22, category:"Tech", img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80", desc:"3 light modes, touch dimmer, USB-powered." },
  { id:"p9", name:"Cotton Bath Towel (Pack of 2)", price:749, mrp:1299, stock:0, category:"Home", img:"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80", desc:"500 GSM, quick-dry, soft combed cotton." },
];
const rupee = (n) => "₹" + Number(n||0).toLocaleString("en-IN");
const COD_FEE = 0; // Cash-on-Delivery fee (must match server COD_FEE). 0 = disabled.
const esc = (s) => String(s==null?"":s);
function Stars({value,size}){ const v=Number(value)||0; const sz=size||14;
  return (<span style={{display:"inline-flex",gap:1,lineHeight:1}} aria-label={v+" out of 5"}>
    {[1,2,3,4,5].map(n=>(<span key={n} style={{fontSize:sz,color:n<=Math.round(v)?"#F3A23E":"rgba(255,255,255,.22)"}}>★</span>))}
  </span>);
}
function StarPicker({value,onChange}){ return (<span style={{display:"inline-flex",gap:4}}>
  {[1,2,3,4,5].map(n=>(<button key={n} type="button" onClick={()=>onChange(n)} style={{background:"none",border:"none",cursor:"pointer",padding:2,fontSize:26,lineHeight:1,color:n<=value?"#F3A23E":"rgba(255,255,255,.25)"}} aria-label={n+" star"}>★</button>))}
</span>); }
function cardTilt(e){
  if(window.matchMedia && (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  const el=e.currentTarget, r=el.getBoundingClientRect();
  const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
  el.style.transition="transform .06s ease-out";
  el.style.transform=`perspective(900px) rotateY(${px*7}deg) rotateX(${-py*7}deg) translateY(-5px)`;
  el.style.boxShadow="0 18px 40px rgba(25,21,16,.16)";
}
function cardReset(e){ const el=e.currentTarget; el.style.transition=""; el.style.transform=""; el.style.boxShadow=""; }

/* ===== EDIT YOUR DETAILS HERE (used across the policy pages) ===== */
const INFO = {
  legalName: "Vector Grid",                 // your seller / registered name
  email: "vectorgridsupport@gmail.com",     // your contact email
  address: "P/3 Mayapur, Haridwar, Uttarakhand, India",  // your business address
  jurisdiction: "Bhopal, Madhya Pradesh",   // city/state for legal jurisdiction
  deliveryDays: "3–7 business days",        // typical delivery time
  returnWindow: "7 days",                   // return/replacement window
  refundDays: "5–7 business days",          // refund processing time
};

const POLICIES = {
  terms: { title: "Terms & Conditions", paras: [
    `Welcome to ${INFO.legalName}. By using this website and placing an order, you agree to these terms.`,
    "All products, prices, and availability are subject to change without notice. We make every effort to display products and prices accurately; in case of an error, we may cancel and refund any affected order.",
    "When you place an order you confirm that the details you provide (name, contact, delivery address) are accurate. You are responsible for keeping these correct.",
    `Online payments are processed securely by our payment partner, Razorpay. ${INFO.legalName} does not store your card or banking details.`,
    `To the extent permitted by law, ${INFO.legalName} is not liable for indirect or consequential losses arising from use of this site beyond the value of the order placed.`,
    `These terms are governed by the laws of India, and disputes are subject to the jurisdiction of courts in ${INFO.jurisdiction}.`,
  ]},
  privacy: { title: "Privacy Policy", paras: [
    `${INFO.legalName} collects only the information needed to process and deliver your order: your name, phone number, email, and delivery address.`,
    "We use this information solely to fulfil orders, arrange delivery, and contact you about your purchase. We do not sell or rent your personal information to anyone.",
    "Payment information is handled directly by Razorpay on their secure systems. We never see or store your card or UPI credentials.",
    "We may share delivery details with our courier partners only to deliver your order. We retain order records as required for accounting and legal compliance.",
    `You can ask us to access or delete your personal data by writing to ${INFO.email}.`,
  ]},
  refund: { title: "Refund & Cancellation Policy", paras: [
    `Orders can be cancelled before they are shipped. To cancel, contact us at ${INFO.email} with your order number as soon as possible.`,
    `If you receive a damaged, defective, or wrong item, notify us within ${INFO.returnWindow} of delivery with photos, and we will arrange a replacement or refund.`,
    `Approved refunds are processed to your original payment method within ${INFO.refundDays}. The exact time the amount reflects depends on your bank.`,
    "Certain items may be non-returnable for hygiene or safety reasons; this will be noted on the product where applicable.",
    `For any refund or cancellation request, email ${INFO.email}.`,
  ]},
  shipping: { title: "Shipping Policy", paras: [
    `We ship across India. Orders are typically delivered within ${INFO.deliveryDays} after dispatch, depending on your location.`,
    "Shipping is free on orders above ₹999. A flat ₹49 shipping fee applies to orders below ₹999.",
    "Cash on Delivery (COD) is available on eligible orders. Prepaid orders are confirmed once payment is verified.",
    "Once your order is dispatched, we will share tracking details so you can follow its progress.",
    `Delivery timelines are estimates and may vary due to courier or regional factors. For shipping queries, contact ${INFO.email}.`,
  ]},
  contact: { title: "Contact Us", paras: [
    `${INFO.legalName}`,
    `Email: ${INFO.email}`,
    `Address: ${INFO.address}`,
    "We aim to respond to all queries within 1–2 business days.",
  ]},
  about: { title: "About Vector Grid", paras: [
    `${INFO.legalName} is an independent online store on a simple mission: bring you genuinely good things, at fair prices, delivered to your doorstep anywhere in India.`,
    "We're not a giant marketplace stuffed with endless listings. Instead, every product is handpicked — we look for pieces that are well-made, useful, and worth owning, then make them easy to buy in just a few taps.",
    "From the moment you order to the moment it arrives, we keep things transparent: clear pricing, honest delivery estimates, Cash on Delivery if you prefer it, and order tracking so you always know where your package is.",
    `We're based in ${INFO.address}, and we ship to every pincode across the country. Whether it's home decor, daily essentials, or a little treat for yourself, we want Vector Grid to feel like a store that actually has your back.`,
    `Got a question or just want to say hi? Reach us anytime at ${INFO.email} — a real person will get back to you.`,
  ]},
};

function App(){
  const storeName = "Vector Grid";
  const [loading,setLoading]=useState(true);
  const [products,setProducts]=useState([]);
  const [cart,setCart]=useState({});
  const [cartOpen,setCartOpen]=useState(false);
  const [checkout,setCheckout]=useState(false);
  const [confirmed,setConfirmed]=useState(null);
  const [quick,setQuick]=useState(null);
  const [paying,setPaying]=useState(false);
  const [page,setPage]=useState(null);
  const go=(p)=>{ setPage(p); window.scrollTo(0,0); };

  useEffect(()=>{ (async()=>{
    let cat=SEED;
    try{ const r=await fetch(API+"/api/products"); if(r.ok){ const j=await r.json(); if(Array.isArray(j)&&j.length) cat=j; } }catch(e){}
    setProducts(cat); setLoading(false);
  })(); },[]);

  const addToCart=(id)=>{ setCart(c=>({...c,[id]:(c[id]||0)+1})); setCartOpen(true); };
  const setQty=(id,q)=>setCart(c=>{ const n={...c}; if(q<=0) delete n[id]; else n[id]=Math.min(50,q); return n; });
  const cartItems=useMemo(()=>Object.entries(cart).map(([id,qty])=>({...products.find(p=>p.id===id),qty})).filter(x=>x.id),[cart,products]);
  const cartCount=cartItems.reduce((s,i)=>s+i.qty,0);
  const subtotal=cartItems.reduce((s,i)=>s+i.qty*i.price,0);
  const shipping=subtotal===0?0:(subtotal>=999?0:49);
  const total=subtotal+shipping;

  const finishOrder=(form,paymentLabel,amount,orderId,codFee)=>{
    setConfirmed({ id:orderId||("VG"+Date.now().toString().slice(-8)), total:amount, payment:paymentLabel, customer:form, items:cartItems, subtotal, shipping, codFee:codFee||0 });
    setCart({}); setCheckout(false); setCartOpen(false);
  };

  const handlePlace=async(form)=>{
    const items=cartItems.map(i=>({id:i.id,qty:i.qty}));
    // ---- Cash on delivery: record order + notify seller ----
    if(form.pay==="COD"){
      setPaying(true);
      try{
        const r=await fetch(API+"/api/place-order",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ cod:true, items, customer:form }) });
        const j=await r.json(); setPaying(false);
        if(j.ok){ finishOrder(form,"COD",j.total!=null?j.total:(total+COD_FEE),j.orderId,COD_FEE); }
        else { alert(j.error||"Could not place the order. Please try again."); }
      }catch(e){ setPaying(false); alert("Couldn't place the order. Please try again."); }
      return;
    }
    // ---- Online payment ----
    setPaying(true);
    let data;
    try{
      const res=await fetch(API+"/api/create-order",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ items }) });
      data=await res.json();
    }catch(e){ setPaying(false); alert("Couldn't reach the payment server. Please try again."); return; }
    if(!data||!data.orderId){ setPaying(false); alert(data&&data.error?data.error:"Couldn't start payment."); return; }
    if(!window.Razorpay){ setPaying(false); alert("Payment library didn't load. Refresh and try again."); return; }
    const paidAmount=data.amount/100;
    const options={
      key:data.keyId, amount:data.amount, currency:data.currency||"INR",
      name:storeName, description:"Order payment", order_id:data.orderId,
      prefill:{ name:form.name, email:form.email, contact:form.phone },
      theme:{ color:T.marigold },
      handler:async(resp)=>{
        try{
          // verify payment AND record the order in one secure step
          const r=await fetch(API+"/api/place-order",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
            razorpay_order_id:resp.razorpay_order_id, razorpay_payment_id:resp.razorpay_payment_id, razorpay_signature:resp.razorpay_signature, items, customer:form }) });
          const j=await r.json();
          setPaying(false);
          if(j.ok){ finishOrder(form,"Paid online",paidAmount,j.orderId); }
          else { alert(j.error||"Payment could not be verified. If money was deducted it will be auto-refunded — please contact us."); }
        }catch(e){ setPaying(false); alert("Couldn't confirm your order. Please contact us with your payment id."); }
      },
      modal:{ ondismiss:()=>setPaying(false) }
    };
    try{ new window.Razorpay(options).open(); }catch(e){ setPaying(false); alert("Couldn't open payment window."); }
  };

  if(loading) return React.createElement("div",{style:{...S.page,display:"flex",alignItems:"center",justifyContent:"center"}}, React.createElement("div",{style:{color:T.muted}},"Opening the store…"));

  return (
    <div style={S.page}>
      <Header storeName={storeName} cartCount={cartCount} onCart={()=>setCartOpen(true)} onHome={()=>go(null)} onTrack={()=>go("track")} />
      {page==="track" ? <TrackOrder onBack={()=>go(null)} />
        : page==="admin" ? <AdminOrders onBack={()=>go(null)} />
        : page ? <Policy pageKey={page} onBack={()=>go(null)} />
        : <Store products={products} onAdd={addToCart} onQuick={setQuick} onTrack={()=>go("track")} />}
      <Footer storeName={storeName} onNav={go} />
      {cartOpen && !checkout && <CartDrawer items={cartItems} subtotal={subtotal} shipping={shipping} total={total} setQty={setQty} onClose={()=>setCartOpen(false)} onCheckout={()=>{ if(cartItems.length) setCheckout(true); }} />}
      {checkout && <Checkout items={cartItems} total={total} shipping={shipping} subtotal={subtotal} paying={paying} onBack={()=>{ if(!paying) setCheckout(false); }} onPlace={handlePlace} />}
      {confirmed && <Confirmation order={confirmed} onClose={()=>setConfirmed(null)} />}
      {quick && <QuickView product={quick} onClose={()=>setQuick(null)} onAdd={()=>{ addToCart(quick.id); setQuick(null); }} />}
    </div>
  );
}

function Header({storeName,cartCount,onCart,onHome,onTrack}){
  const [bounce,setBounce]=useState(false); const prev=React.useRef(cartCount);
  useEffect(()=>{ if(cartCount>prev.current){ setBounce(true); const t=setTimeout(()=>setBounce(false),520); prev.current=cartCount; return ()=>clearTimeout(t); } prev.current=cartCount; },[cartCount]);
  return (<header style={S.header}><div style={S.headerInner}>
    <div onClick={onHome} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}><img src="/vectorgrid-mark.svg" alt="Vector Grid" width="34" height="34" style={{display:"block"}} /><span style={S.wordmark}>{storeName}</span><span style={S.tagline}>ships pan-India</span></div>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <button onClick={onTrack} style={S.trackLink}>Track order</button>
      <button onClick={onCart} style={S.cartBtn} className={bounce?"vg-cart-bounce":""} aria-label="Open cart">Cart{cartCount>0 && <span style={S.cartBadge}>{cartCount}</span>}</button>
    </div>
  </div></header>);
}

function Hero({onShop,onTrack}){
  const ref=React.useRef(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx=cv.getContext("2d"); let w=0,h=0,dpr=Math.min(window.devicePixelRatio||1,2),raf=0,t=0;
    const COLORS=["#E8820C","#F3A23E","#27B3A3"];
    let pts=[];
    function size(){ const r=cv.getBoundingClientRect(); w=r.width; h=r.height; cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=Math.max(28,Math.min(70,Math.round(w/16)));
      pts=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.8+.6,c:COLORS[(Math.random()*COLORS.length)|0]}));
    }
    function orb(cx,cy,rad,col,a){ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad); g.addColorStop(0,col+a); g.addColorStop(1,"#00000000"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
    function frame(){ t+=0.004;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle="#161310"; ctx.fillRect(0,0,w,h);
      orb(w*(0.30+Math.sin(t)*0.05), h*(0.42+Math.cos(t*0.8)*0.06), Math.max(w,h)*0.45, "#E8820C","2e");
      orb(w*(0.74+Math.cos(t*0.7)*0.05), h*(0.62+Math.sin(t)*0.05), Math.max(w,h)*0.40, "#27B3A3","26");
      for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w)p.vx*=-1; if(p.y<0||p.y>h)p.vy*=-1; }
      for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const a=pts[i],b=pts[j]; const dx=a.x-b.x,dy=a.y-b.y; const d=dx*dx+dy*dy; if(d<11000){ ctx.strokeStyle="rgba(243,162,62,"+(0.10*(1-d/11000))+")"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
      for(const p of pts){ ctx.fillStyle=p.c; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); }
      ctx.globalAlpha=1;
      raf=requestAnimationFrame(frame);
    }
    function still(){ ctx.clearRect(0,0,w,h); ctx.fillStyle="#161310"; ctx.fillRect(0,0,w,h); orb(w*0.32,h*0.42,Math.max(w,h)*0.45,"#E8820C","2e"); orb(w*0.74,h*0.6,Math.max(w,h)*0.4,"#27B3A3","26"); for(const p of pts){ ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); } }
    size(); if(reduce){ still(); } else { frame(); }
    const onR=()=>{ size(); if(reduce) still(); };
    window.addEventListener("resize",onR);
    const onVis=()=>{ if(document.hidden){ cancelAnimationFrame(raf); } else if(!reduce){ cancelAnimationFrame(raf); raf=requestAnimationFrame(frame); } };
    document.addEventListener("visibilitychange",onVis);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",onR); document.removeEventListener("visibilitychange",onVis); };
  },[]);
  return (<section style={S.heroWrap}>
    <canvas ref={ref} style={S.heroCanvas} aria-hidden="true" />
    <div style={S.heroOverlay} />
    <div style={S.heroContent}>
      <p style={S.heroEyebrow}>✦ curated goods · delivered across india</p>
      <h1 style={S.heroTitle}>Things worth<br/><span style={S.heroAccent}>waiting</span> for.</h1>
      <p style={S.heroLede}>Handpicked drops shipped to every pincode. Browse, tap, done — Cash on Delivery or secure online pay. 🛒</p>
      <div style={S.heroBtns}>
        <button onClick={onShop} style={S.heroPrimary}>Shop the drop →</button>
        <button onClick={onTrack} style={S.heroGhost}>Track order</button>
      </div>
      <p style={S.heroProof}>⭐️⭐️⭐️⭐️⭐️ &nbsp;loved by shoppers across India</p>
    </div>
    <button onClick={onShop} style={S.heroScroll} aria-label="Scroll to products">↓</button>
  </section>);
}

function AddButton({onAdd,out,full,label}){
  const [done,setDone]=useState(false);
  const click=()=>{ if(out||done) return; onAdd(); setDone(true); setTimeout(()=>setDone(false),1100); };
  const base=full?{...S.addBtn,marginTop:18}:S.addBtn;
  return (<button disabled={out} onClick={click} className={done?"vg-added":""}
    style={{...base,...(out?S.addBtnDisabled:{}),...(done?{background:"linear-gradient(95deg,#1f9e57,#27B3A3)",color:"#fff",borderColor:"transparent"}:{})}}>
    {out?(label&&label.out||"Sold out"):done?"Added ✓":(label&&label.add||"Add to cart")}
  </button>);
}
function Store({products,onAdd,onQuick,onTrack}){
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("All");
  const [sort,setSort]=useState("featured");
  const cats=useMemo(()=>["All",...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))],[products]);
  const shown=useMemo(()=>{
    const needle=q.trim().toLowerCase();
    let list=products.filter(p=>{
      const inCat = cat==="All" || p.category===cat;
      const hay=(esc(p.name)+" "+esc(p.desc)+" "+esc(p.category)).toLowerCase();
      return inCat && (!needle || hay.includes(needle));
    });
    const disc=p=>p.mrp>p.price?(p.mrp-p.price)/p.mrp:0;
    if(sort==="low") list=[...list].sort((a,b)=>a.price-b.price);
    else if(sort==="high") list=[...list].sort((a,b)=>b.price-a.price);
    else if(sort==="discount") list=[...list].sort((a,b)=>disc(b)-disc(a));
    return list;
  },[products,q,cat,sort]);

  return (<>
    <Hero onShop={()=>{const e=document.getElementById("shop"); if(e) e.scrollIntoView({behavior:"smooth"});}} onTrack={onTrack} />
    <div style={S.marquee} className="vg-marquee" aria-hidden="true">
      <div style={S.marqueeTrack} className="vg-marquee-track">
        {Array.from({length:2}).map((_,k)=>(<span key={k} style={{display:"inline-flex"}}>
          {["FREE SHIPPING OVER ₹999","✦","CASH ON DELIVERY","✦","7-DAY EASY RETURNS","✦","SHIPS TO EVERY PINCODE","✦","SECURE RAZORPAY CHECKOUT","✦","HANDPICKED GOODS","✦"].map((t,i)=>(<span key={i} style={{padding:"0 18px",fontFamily:"var(--mono)",fontWeight:700,fontSize:13,letterSpacing:".08em",color:t==="✦"?"#13100D":"#13100D"}}>{t}</span>))}
        </span>))}
      </div>
    </div>
    <main style={S.main} id="shop">
    <div style={S.featRow} className="vg-feat">
      {[["🚚","Fast pan-India","Dispatched in 24–48h"],["💸","COD available","Pay when it lands"],["↩️","7-day returns","No-stress shopping"],["🔒","100% secure","Razorpay protected"]].map(([i,t,s])=>(
        <div key={t} style={S.featCard} className="vg-feat-card"><span style={S.featIcon}>{i}</span><div><div style={S.featTitle}>{t}</div><div style={S.featSub}>{s}</div></div></div>
      ))}
    </div>

    <div style={S.shopHead}>
      <h2 style={S.shopHeadTitle}>Shop the drop <span style={{fontStyle:"normal"}}>🛍️</span></h2>
      <p style={S.shopHeadSub}>Curated picks, fresh finds — tap any item to peek.</p>
    </div>

    <div style={S.toolbar} className="vg-toolbar">
      <div style={S.searchWrap}>
        <span aria-hidden="true" style={S.searchIcon}>⌕</span>
        <input style={S.searchInput} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" />
        {q && <button onClick={()=>setQ("")} style={S.searchClear} aria-label="Clear search">✕</button>}
      </div>
      <label style={S.sortWrap}><span style={S.sortLabel}>Sort</span>
        <select style={S.sortSelect} value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="discount">Biggest discount</option>
        </select>
      </label>
    </div>

    <div style={S.chipsRow} className="vg-chips">
      {cats.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{...S.chip,...(cat===c?S.chipOn:{})}}>{c}</button>
      ))}
    </div>

    <p style={S.countText}>{shown.length} {shown.length===1?"item":"items"}{cat!=="All"?" in "+cat:""}{q?` · “${q}”`:""}</p>

    {shown.length===0 ? (
      <div style={S.empty}>
        <p style={{fontFamily:"var(--display)",fontSize:22,margin:0}}>Nothing matched that.</p>
        <p style={{color:T.inkSoft,marginTop:8}}>Try a different word or category.</p>
        <button onClick={()=>{setQ("");setCat("All");}} style={{...S.addBtn,maxWidth:220,margin:"16px auto 0"}}>Show everything</button>
      </div>
    ) : (
    <div style={S.grid} className="vg-grid">
      {shown.map(p=>{ const out=p.stock<=0; return (
        <article key={p.id} style={S.prodCard} className="vg-card" onMouseMove={cardTilt} onMouseLeave={cardReset}>
          <button style={S.imgWrap} onClick={()=>onQuick(p)} aria-label={"View "+esc(p.name)}>
            <img src={p.img} alt={esc(p.name)} style={S.img} loading="lazy" onError={(e)=>{e.currentTarget.style.opacity=0.25;}} />
            {out && <span style={S.soldOut}>Sold out</span>}
            {!out && p.mrp>p.price && <span style={S.discount}>{Math.round(100-(p.price/p.mrp)*100)}% off</span>}
            {p.category && <span style={S.catTag}>{p.category}</span>}
          </button>
          <div style={{padding:"14px 16px 16px",display:"flex",flexDirection:"column",flex:1}}>
            <h3 style={S.prodName}>{esc(p.name)}</h3>
            {p.reviewCount>0 && <div style={{display:"flex",alignItems:"center",gap:6,margin:"2px 0 4px"}}><Stars value={p.rating} size={13} /><span style={{fontSize:11.5,color:T.muted,fontFamily:"var(--mono)"}}>{p.rating} ({p.reviewCount})</span></div>}
            <p style={S.prodDesc}>{esc(p.desc)}</p>
            <div style={{...S.priceRow,marginTop:"auto"}}><span style={S.price}>{rupee(p.price)}</span>{p.mrp>p.price && <span style={S.mrp}>{rupee(p.mrp)}</span>}</div>
            <AddButton onAdd={()=>onAdd(p.id)} out={out} />
          </div>
        </article>); })}
    </div>
    )}

    <section style={S.aboutBand}>
      <div style={S.aboutInner}>
        <p style={S.aboutEyebrow}>✦ why vector grid</p>
        <h2 style={S.aboutTitle}>Good stuff, fair prices,<br/><span style={S.heroAccent}>delivered to your door.</span></h2>
        <p style={S.aboutText}>We're a small, independent store — not a giant marketplace. Every product is handpicked to be well-made, useful, and worth owning. Clear pricing, honest delivery estimates, Cash on Delivery if you like, and order tracking so you always know where your package is.</p>
        <div style={S.aboutStats} className="vg-about-stats">
          {[["📦","Every pincode","We ship across all of India"],["🤝","Real humans","A person replies to every query"],["🔄","Easy returns","7-day no-stress return window"]].map(([i,t,s])=>(
            <div key={t} style={S.aboutStat}><span style={{fontSize:26}}>{i}</span><div style={{fontWeight:700,color:T.ink,marginTop:8,fontSize:15}}>{t}</div><div style={{fontSize:12.5,color:T.inkSoft,marginTop:3}}>{s}</div></div>
          ))}
        </div>
      </div>
    </section>
  </main></>);
}

function QuickView({product,onClose,onAdd}){ const out=product.stock<=0;
  const [reviews,setReviews]=useState(null);
  const [name,setName]=useState(""); const [rating,setRating]=useState(0); const [comment,setComment]=useState("");
  const [posting,setPosting]=useState(false); const [msg,setMsg]=useState(""); const [showForm,setShowForm]=useState(false);
  const loadReviews=async()=>{ try{ const r=await fetch(API+"/api/reviews?product="+encodeURIComponent(product.id)); const j=await r.json(); setReviews(j.reviews||[]); }catch(e){ setReviews([]); } };
  useEffect(()=>{ loadReviews(); },[]);
  const post=async()=>{ setMsg("");
    if(!name.trim()){ setMsg("Please add your name."); return; }
    if(!(rating>=1&&rating<=5)){ setMsg("Please pick a star rating."); return; }
    setPosting(true);
    try{ const r=await fetch(API+"/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:product.id,name,rating,comment})});
      const j=await r.json(); setPosting(false);
      if(r.ok){ setMsg("Thanks for your review!"); setName(""); setRating(0); setComment(""); setShowForm(false); loadReviews(); }
      else setMsg(j.error||"Couldn't save your review.");
    }catch(e){ setPosting(false); setMsg("Something went wrong. Please try again."); }
  };
  const avg = reviews&&reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : null;
  return (
  <Overlay onClose={onClose}><div style={{...S.modal,maxWidth:720,padding:0,overflow:"hidden",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>
    <button onClick={onClose} style={S.quickClose} aria-label="Close">✕</button>
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:320}}>
      <img src={product.img} alt={esc(product.name)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
      <div style={{padding:28}}>
        <button onClick={onClose} style={S.quickBack}>← Back to products</button>
        <h2 style={{...S.prodName,fontSize:22,margin:"10px 0 8px"}}>{esc(product.name)}</h2>
        {avg && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Stars value={avg} /><span style={{fontSize:12,color:T.muted,fontFamily:"var(--mono)"}}>{avg} · {reviews.length} review{reviews.length===1?"":"s"}</span></div>}
        <div style={S.priceRow}><span style={{...S.price,fontSize:22}}>{rupee(product.price)}</span>{product.mrp>product.price && <span style={S.mrp}>{rupee(product.mrp)}</span>}</div>
        <p style={{...S.prodDesc,marginTop:12,fontSize:14,lineHeight:1.6}}>{esc(product.desc)}</p>
        <p style={{fontFamily:"var(--mono)",fontSize:12,color:out?T.danger:T.teal,marginTop:14}}>{out?"Out of stock":"In stock · "+product.stock+" available"}</p>
        <AddButton onAdd={onAdd} out={out} full={true} label={{add:"Add to cart",out:"Unavailable"}} />
      </div>
    </div>
    <div style={{padding:"0 28px 28px",borderTop:"1px solid "+T.line,marginTop:4}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 12px",flexWrap:"wrap",gap:8}}>
        <h3 style={{fontFamily:"var(--display)",fontSize:18,fontWeight:700,margin:0}}>Customer reviews</h3>
        {!showForm && <button onClick={()=>{setShowForm(true);setMsg("");}} style={{...S.addBtn,width:"auto",marginTop:0,padding:"8px 16px",fontSize:13}}>Write a review</button>}
      </div>
      {showForm && <div style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:18,marginBottom:16}}>
        <div style={{marginBottom:10}}><div style={{fontSize:12.5,color:T.inkSoft,marginBottom:6}}>Your rating</div><StarPicker value={rating} onChange={setRating} /></div>
        <input style={{...S.input,marginBottom:10}} value={name} onChange={e=>setName(e.target.value)} maxLength={60} placeholder="Your name" />
        <textarea style={{...S.input,minHeight:70,resize:"vertical",fontFamily:"inherit",marginBottom:10}} value={comment} onChange={e=>setComment(e.target.value)} maxLength={600} placeholder="Share your experience (optional)" />
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={post} disabled={posting} style={{...S.primaryBtn,width:"auto",padding:"10px 20px",...(posting?S.addBtnDisabled:{})}}>{posting?"Posting…":"Submit review"}</button>
          <button onClick={()=>{setShowForm(false);setMsg("");}} disabled={posting} style={S.linkBtn}>Cancel</button>
        </div>
      </div>}
      {msg && <p style={{fontSize:13,color:msg.indexOf("Thanks")===0?T.teal:T.danger,margin:"0 0 12px"}}>{msg}</p>}
      {reviews===null ? <p style={{color:T.muted,fontSize:13}}>Loading reviews…</p>
        : reviews.length===0 ? <p style={{color:T.muted,fontSize:13.5}}>No reviews yet. Be the first to review this product!</p>
        : <div style={{display:"grid",gap:12}}>{reviews.map(rv=>(<div key={rv.id} style={{background:T.card,border:"1px solid "+T.line,borderRadius:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <strong style={{fontSize:13.5,color:T.ink}}>{esc(rv.name)}</strong>
              <Stars value={rv.rating} size={13} />
            </div>
            {rv.comment && <p style={{fontSize:13,color:T.inkSoft,margin:"8px 0 0",lineHeight:1.55}}>{esc(rv.comment)}</p>}
            <p style={{fontSize:11,color:T.muted,margin:"8px 0 0",fontFamily:"var(--mono)"}}>{new Date(rv.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
          </div>))}</div>}
    </div>
  </div></Overlay>); }

function CartDrawer({items,subtotal,shipping,total,setQty,onClose,onCheckout}){ return (
  <div style={S.drawerScrim} onClick={onClose}><aside style={S.drawer} onClick={e=>e.stopPropagation()}>
    <div style={S.drawerHead}><h2 style={S.drawerTitle}>Your cart</h2><button onClick={onClose} style={S.xBtn} aria-label="Close">✕</button></div>
    <div style={{flex:1,overflowY:"auto",padding:"8px 20px"}}>
      {items.length===0 && <p style={{color:T.muted,marginTop:24}}>Your cart is empty.</p>}
      {items.map(i=>(<div key={i.id} style={S.cartRow}>
        <img src={i.img} alt="" style={S.cartThumb} />
        <div style={{flex:1}}><p style={S.cartName}>{esc(i.name)}</p><p style={S.cartPrice}>{rupee(i.price)}</p>
          <div style={S.qtyRow}><button onClick={()=>setQty(i.id,i.qty-1)} style={S.qtyBtn} aria-label="Decrease">−</button><span style={S.qtyNum}>{i.qty}</span><button onClick={()=>setQty(i.id,i.qty+1)} style={S.qtyBtn} aria-label="Increase">+</button></div>
        </div><span style={S.cartLine}>{rupee(i.price*i.qty)}</span>
      </div>))}
    </div>
    <div style={S.drawerFoot}>
      <Row label="Subtotal" value={rupee(subtotal)} /><Row label="Shipping" value={shipping===0?"Free":rupee(shipping)} /><Row label="Total" value={rupee(total)} bold />
      <button onClick={onCheckout} disabled={items.length===0} style={{...S.primaryBtn,...(items.length===0?S.addBtnDisabled:{})}}>Checkout</button>
    </div>
  </aside></div>); }
function Row({label,value,bold}){ return <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:bold?16:14,color:bold?T.ink:T.inkSoft,fontWeight:bold?700:500}}><span>{label}</span><span>{value}</span></div>; }

function Checkout({items,total,shipping,subtotal,paying,onBack,onPlace}){
  const [f,setF]=useState({name:"",phone:"",email:"",line1:"",line2:"",city:"",state:"Maharashtra",pincode:"",pay:"Online"});
  const [err,setErr]=useState({});
  const up=(k)=>(e)=>setF({...f,[k]:e.target.value});
  const submit=()=>{ const e={};
    if(!f.name.trim()) e.name="Required";
    if(!/^[6-9]\d{9}$/.test(f.phone)) e.phone="Valid 10-digit mobile";
    if(!f.email.trim()) e.email="Required for order updates";
    else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email="Enter a valid email";
    if(!f.line1.trim()) e.line1="Required";
    if(!f.city.trim()) e.city="Required";
    if(!/^\d{6}$/.test(f.pincode)) e.pincode="6-digit pincode";
    setErr(e); if(Object.keys(e).length===0) onPlace(f);
  };
  return (<Overlay onClose={paying?()=>{}:onBack}><div style={{...S.modal,maxWidth:760}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={S.modalTitle}>Delivery details</h2><button onClick={onBack} style={S.linkBtn}>← Back</button>
    </div>
    <div style={S.coTrust}>
      <span style={S.coTrustItem}>🔒 Secure checkout</span>
      <span style={S.coTrustItem}>↩ 7-day returns</span>
      <span style={S.coTrustItem}>₹ COD available</span>
      <span style={S.coTrustItem}>✈ Ships pan-India</span>
    </div>
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:28}}>
      <div>
        <Field label="Full name" err={err.name}><input style={S.input} value={f.name} onChange={up("name")} maxLength={80} /></Field>
        <div style={S.two}><Field label="Mobile number" err={err.phone}><input style={S.input} value={f.phone} onChange={up("phone")} maxLength={10} inputMode="numeric" placeholder="10 digits" /></Field><Field label="Email" err={err.email}><input style={S.input} type="email" value={f.email} onChange={up("email")} maxLength={120} placeholder="you@example.com" /></Field></div>
        <p style={{fontSize:11.5,color:T.muted,margin:"-6px 0 12px",lineHeight:1.5}}>📧 We'll email your order ID and tracking link here, so please enter it correctly.</p>
        <Field label="Address line 1" err={err.line1}><input style={S.input} value={f.line1} onChange={up("line1")} maxLength={120} placeholder="House / flat, street" /></Field>
        <Field label="Address line 2"><input style={S.input} value={f.line2} onChange={up("line2")} maxLength={120} placeholder="Area, landmark" /></Field>
        <div style={S.two}><Field label="City" err={err.city}><input style={S.input} value={f.city} onChange={up("city")} maxLength={60} /></Field><Field label="Pincode" err={err.pincode}><input style={S.input} value={f.pincode} onChange={up("pincode")} maxLength={6} inputMode="numeric" placeholder="6 digits" /></Field></div>
        <Field label="State"><select style={S.input} value={f.state} onChange={up("state")}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="How would you like to pay?"><div className="vg-pay" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Online","Pay online","UPI · Cards · Netbanking"],["COD","Cash on Delivery","Pay when it arrives"]].map(([val,title,sub])=>(<button key={val} type="button" onClick={()=>setF({...f,pay:val})} style={{...S.payOpt,...(f.pay===val?S.payOptOn:{})}}><span style={{...S.payRadio,...(f.pay===val?S.payRadioOn:{})}}>{f.pay===val?"✓":""}</span><span style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}><span style={S.payTitle}>{title}</span><span style={S.paySub}>{sub}</span></span></button>))}</div></Field>
      </div>
      <div style={S.summary}>
        <h3 style={S.summaryTitle}>Order summary</h3>
        <p style={{fontSize:12,color:T.muted,margin:"-6px 0 12px",fontFamily:"var(--mono)"}}>{items.reduce((n,i)=>n+i.qty,0)} item{items.reduce((n,i)=>n+i.qty,0)===1?"":"s"} · {items.length} product{items.length===1?"":"s"}</p>
        {items.map(i=>(<div key={i.id} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:13,padding:"7px 0",color:T.inkSoft,borderBottom:"1px solid "+T.line}}>
          <span style={{flex:1}}>{esc(i.name)}<br/><span style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)"}}>{rupee(i.price)} × {i.qty}</span></span>
          <span style={{fontWeight:600,color:T.ink}}>{rupee(i.price*i.qty)}</span>
        </div>))}
        <div style={{height:8}} />
        <Row label="Subtotal" value={rupee(subtotal)} /><Row label="Shipping" value={shipping===0?"Free":rupee(shipping)} />
        {f.pay==="COD" && COD_FEE>0 && <Row label="COD fee" value={rupee(COD_FEE)} />}
        <Row label="Total" value={rupee(total+(f.pay==="COD"?COD_FEE:0))} bold />
        {f.pay==="COD" && COD_FEE>0 && <p style={{fontSize:11,color:T.muted,margin:"6px 0 0",lineHeight:1.5}}>A {rupee(COD_FEE)} fee applies to Cash on Delivery orders. Pay online to skip it.</p>}
        <button onClick={submit} disabled={paying} style={{...S.primaryBtn,marginTop:16,...(paying?S.addBtnDisabled:{})}}>{paying?"Opening payment…":(f.pay==="COD"?"Place order · "+rupee(total+COD_FEE):"Pay "+rupee(total))}</button>
        <p style={{fontSize:11,color:T.muted,marginTop:10,lineHeight:1.5}}>Online payments are processed securely by Razorpay. Your card details never touch this site.</p>
        <div style={S.coSecure}>
          <div style={S.coSecureRow}><span aria-hidden="true">🔒</span><span>Payments secured by <strong style={{color:T.ink}}>Razorpay</strong> — UPI, cards & netbanking. Your card details never touch this site.</span></div>
          <div style={S.coSecureRow}><span aria-hidden="true">↩</span><span>Easy <strong style={{color:T.ink}}>7-day returns</strong> on every order.</span></div>
          <div style={S.coSecureRow}><span aria-hidden="true">📦</span><span>Dispatched in 24–48h · delivered in 3–7 days, pan-India.</span></div>
        </div>
      </div>
    </div>
  </div></Overlay>);
}
function Field({label,err,children}){ return <label style={{display:"block",marginBottom:12}}><span style={S.fieldLabel}>{label}{err && <span style={{color:T.danger,marginLeft:6}}>· {err}</span>}</span>{children}</label>; }

function Confirmation({order,onClose}){ const steps=["Placed","Packed","Shipped","Delivered"]; const c=order.customer; const items=order.items||[]; return (
  <Overlay onClose={onClose}><div style={{...S.modal,maxWidth:580,textAlign:"center"}}>
    <div style={S.checkCircle}>✓</div>
    <h2 style={{...S.modalTitle,marginTop:14}}>Order placed</h2>
    <p style={{color:T.inkSoft,marginTop:4}}>Order <strong style={{fontFamily:"var(--mono)",color:T.ink}}>{order.id}</strong> · {rupee(order.total)} · {order.payment==="COD"?"Cash on delivery":"Paid online"}</p>
    {c&&c.email && <p style={{fontSize:12.5,color:T.teal,marginTop:8}}>📧 A confirmation with your tracking details has been sent to <strong>{esc(c.email)}</strong></p>}
    <div style={S.stepper}>{steps.map((s,idx)=>(<React.Fragment key={s}><div style={{textAlign:"center"}}><div style={{...S.stepDot,background:idx===0?T.teal:T.line,color:idx===0?"#fff":T.muted}}>{idx+1}</div><span style={{fontSize:11,color:idx===0?T.ink:T.muted,fontFamily:"var(--mono)"}}>{s}</span></div>{idx<steps.length-1 && <div style={S.stepLine} />}</React.Fragment>))}</div>
    {items.length>0 && <div style={{textAlign:"left",background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:16,marginTop:18}}>
      <p style={{fontSize:12,color:T.muted,margin:"0 0 8px",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>Order details</p>
      {items.map(i=>(<div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",color:T.inkSoft}}><span>{esc(i.name)} <span style={{color:T.muted,fontFamily:"var(--mono)",fontSize:11}}>× {i.qty}</span></span><span style={{color:T.ink}}>{rupee(i.price*i.qty)}</span></div>))}
      <div style={{height:1,background:T.line,margin:"8px 0"}} />
      {order.subtotal!=null && <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,padding:"2px 0"}}><span>Subtotal</span><span>{rupee(order.subtotal)}</span></div>}
      {order.shipping!=null && <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,padding:"2px 0"}}><span>Shipping</span><span>{order.shipping===0?"Free":rupee(order.shipping)}</span></div>}
      {order.codFee>0 && <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,padding:"2px 0"}}><span>COD fee</span><span>{rupee(order.codFee)}</span></div>}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:T.ink,padding:"6px 0 0"}}><span>Total</span><span>{rupee(order.total)}</span></div>
    </div>}
    {c && <div style={{textAlign:"left",background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:16,marginTop:12}}>
      <p style={{fontSize:12,color:T.muted,margin:"0 0 8px",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>Delivering to</p>
      <p style={{fontSize:13,color:T.ink,margin:0,lineHeight:1.6}}>{esc(c.name)}<br/>{esc(c.line1)}{c.line2?", "+esc(c.line2):""}<br/>{esc(c.city)}, {esc(c.state)} — {esc(c.pincode)}<br/><span style={{color:T.inkSoft}}>📱 {esc(c.phone)}{c.email?" · ✉ "+esc(c.email):""}</span></p>
    </div>}
    <p style={{fontSize:12.5,color:T.muted,marginTop:14,fontFamily:"var(--mono)"}}>Track anytime with order ID <strong style={{color:T.ink}}>{order.id}</strong> + your phone number, from the "Track order" link up top.</p>
    <button onClick={onClose} style={{...S.primaryBtn,marginTop:18}}>Continue shopping</button>
  </div></Overlay>); }

function Overlay({children,onClose}){ return <div style={S.overlay} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{animation:"pop .18s ease",width:"100%",display:"flex",justifyContent:"center"}}>{children}</div></div>; }
function Policy({pageKey,onBack}){
  const data = POLICIES[pageKey] || POLICIES.terms;
  return (<main style={{...S.main,maxWidth:760}}>
    <section style={{padding:"48px 0 8px"}}>
      <button onClick={onBack} style={S.linkBtn}>← Back to store</button>
      <h1 style={{fontFamily:"var(--display)",fontSize:34,fontWeight:700,letterSpacing:"-.02em",margin:"14px 0 18px"}}>{data.title}</h1>
      {data.paras.map((p,i)=>(<p key={i} style={{fontSize:14.5,color:T.inkSoft,lineHeight:1.65,margin:"0 0 14px"}}>{p}</p>))}
      <p style={{fontSize:12,color:T.muted,marginTop:24,borderTop:"1px solid "+T.line,paddingTop:14}}>Last updated on order. For questions, contact {INFO.email}.</p>
    </section>
  </main>);
}

function TrackOrder({onBack}){
  const [id,setId]=useState(""); const [phone,setPhone]=useState("");
  const [res,setRes]=useState(null); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const [showCancel,setShowCancel]=useState(false); const [reason,setReason]=useState("");
  const [cancelBusy,setCancelBusy]=useState(false); const [cancelMsg,setCancelMsg]=useState("");
  const steps=["Placed","Packed","Shipped","Delivered"];
  const submit=async()=>{
    setErr(""); setRes(null); setShowCancel(false); setCancelMsg("");
    const cleanId=id.trim().replace(/^#/,"");
    if(!cleanId||phone.replace(/\D/g,"").length<10){ setErr("Enter your order ID and 10-digit phone number."); return; }
    setBusy(true);
    try{ const r=await fetch(API+"/api/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:cleanId,phone})});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setRes(j); } else { setErr(j.error||"Couldn't find that order."); }
    }catch(e){ setBusy(false); setErr("Something went wrong. Please try again."); }
  };
  const doCancel=async()=>{
    setCancelBusy(true); setCancelMsg("");
    try{ const r=await fetch(API+"/api/cancel-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:res.id,phone,reason})});
      const j=await r.json(); setCancelBusy(false);
      if(r.ok){ setCancelMsg(j.message||"Done."); setShowCancel(false);
        if(j.cancelled) setRes({...res,status:"Cancelled"});
      } else { setCancelMsg(j.error||"Couldn't process your request."); }
    }catch(e){ setCancelBusy(false); setCancelMsg("Something went wrong. Please try again."); }
  };
  const idx = res ? (res.status==="Cancelled"?-1:steps.indexOf(res.status)) : -1;
  return (<main style={{...S.main,maxWidth:620}}>
    <section style={{padding:"40px 0 8px"}}>
      <button onClick={onBack} style={S.linkBtn}>← Back to store</button>
      <h1 style={{fontFamily:"var(--display)",fontSize:32,fontWeight:700,letterSpacing:"-.02em",margin:"14px 0 6px"}}>Track your order</h1>
      <p style={{color:T.inkSoft,marginBottom:20,fontSize:14.5}}>Enter your order ID and the phone number you ordered with.</p>
      <div style={{display:"grid",gap:12,maxWidth:420}}>
        <input style={S.input} value={id} onChange={e=>setId(e.target.value)} placeholder="Order ID (e.g. VG12345678)" />
        <input style={S.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number (10 digits)" inputMode="numeric" maxLength={10} />
        <button onClick={submit} disabled={busy} style={{...S.primaryBtn,...(busy?S.addBtnDisabled:{})}}>{busy?"Checking…":"Track order"}</button>
        {err && <p style={{color:T.danger,fontSize:13}}>{err}</p>}
      </div>
      {res && (()=>{ let items=[]; try{ items=Array.isArray(res.items)?res.items:JSON.parse(res.items||"[]"); }catch(e){ items=[]; }
        const cancelled=res.status==="Cancelled";
        return (<div style={{marginTop:28,background:T.card,border:"1px solid "+T.line,borderRadius:16,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <strong style={{fontFamily:"var(--mono)",fontSize:15,color:T.ink}}>{esc(res.id)}</strong>
          <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,color:cancelled?T.muted:"#fff",background:cancelled?"transparent":T.teal,border:cancelled?"1px solid "+T.line:"none",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"}}>{res.status}</span>
        </div>
        <p style={{color:T.inkSoft,fontSize:13,marginTop:6}}>{res.itemCount} item{res.itemCount===1?"":"s"} · {rupee(res.total)}</p>
        {cancelled
          ? <p style={{color:T.danger,marginTop:16,fontWeight:600}}>This order was cancelled. Contact us if you need help.</p>
          : <div style={S.stepper}>{steps.map((s,i)=>(<React.Fragment key={s}><div style={{textAlign:"center"}}><div style={{...S.stepDot,background:i<=idx?T.teal:T.line,color:i<=idx?"#fff":T.muted}}>{i<=idx?"✓":i+1}</div><span style={{fontSize:11,color:i<=idx?T.ink:T.muted,fontFamily:"var(--mono)"}}>{s}</span></div>{i<steps.length-1 && <div style={{...S.stepLine,background:i<idx?T.teal:T.line}} />}</React.Fragment>))}</div>}
        {items.length>0 && <div style={{textAlign:"left",background:T.bg||"#0f0d0a",border:"1px solid "+T.line,borderRadius:12,padding:16,marginTop:18}}>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 8px",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>Order details</p>
          {items.map((i,idx2)=>(<div key={idx2} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color:T.inkSoft}}><span>{esc(i.name||"Item")} <span style={{color:T.muted,fontFamily:"var(--mono)",fontSize:11}}>× {i.qty||1}</span></span><span style={{color:T.ink}}>{rupee((i.price||0)*(i.qty||1))}</span></div>))}
          <div style={{height:1,background:T.line,margin:"8px 0"}} />
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:T.ink}}><span>Total</span><span>{rupee(res.total)}</span></div>
        </div>}
        {res.trackingUrl && <a href={res.trackingUrl} target="_blank" rel="noopener noreferrer" style={{...S.primaryBtn,display:"inline-block",textAlign:"center",textDecoration:"none",marginTop:18,padding:"11px 22px"}}>Track shipment{res.trackingCarrier?` · ${esc(res.trackingCarrier)}`:""}</a>}
        <p style={{fontSize:12,color:T.muted,marginTop:14,fontFamily:"var(--mono)"}}>Updated {new Date(res.updatedAt).toLocaleString("en-IN")}</p>
        {cancelMsg && <div style={{marginTop:14,background:"rgba(39,179,163,.1)",border:"1px solid "+T.teal,borderRadius:10,padding:"12px 14px",fontSize:13,color:T.ink,lineHeight:1.5}}>{cancelMsg}</div>}
        {!cancelled && !cancelMsg && (()=>{
          const beforeShip=(res.status==="Placed"||res.status==="Packed");
          return (<div style={{marginTop:18,borderTop:"1px solid "+T.line,paddingTop:16}}>
            {!showCancel ? (
              <button onClick={()=>setShowCancel(true)} style={{...S.linkBtn,color:T.danger,fontSize:13}}>{beforeShip?"Cancel this order":"Request a return / refund"}</button>
            ) : (
              <div>
                <p style={{fontSize:13,color:T.inkSoft,margin:"0 0 10px",lineHeight:1.55}}>
                  {beforeShip
                    ? "Your order hasn't shipped yet, so you can cancel it now. If you paid online, your refund will be processed to your original payment method."
                    : "This order has already been dispatched. You can request a return/refund and our team will review it as per our 7-day return policy."}
                </p>
                <textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={300} placeholder="Reason (optional) — e.g. ordered by mistake, wrong item, changed my mind" style={{...S.input,minHeight:64,resize:"vertical",fontFamily:"inherit"}} />
                <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
                  <button onClick={doCancel} disabled={cancelBusy} style={{...S.primaryBtn,background:T.danger,width:"auto",padding:"10px 20px",...(cancelBusy?S.addBtnDisabled:{})}}>{cancelBusy?"Submitting…":(beforeShip?"Confirm cancellation":"Submit request")}</button>
                  <button onClick={()=>{setShowCancel(false);setReason("");}} disabled={cancelBusy} style={S.linkBtn}>Keep my order</button>
                </div>
              </div>
            )}
          </div>);
        })()}
      </div>); })()}
    </section>
  </main>);
}

function AdminOrders({onBack}){
  const [key,setKey]=useState(""); const [authed,setAuthed]=useState(false);
  const [orders,setOrders]=useState([]); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const [remember,setRemember]=useState(true); const [booting,setBooting]=useState(true);
  const [tab,setTab]=useState("orders"); const [reviews,setReviews]=useState([]); const [revBusy,setRevBusy]=useState(false);
  const [prods,setProds]=useState([]); const [prodBusy,setProdBusy]=useState(false); const [editing,setEditing]=useState(null);
  const load=async(k,opts)=>{ setErr(""); setBusy(true);
    try{ const r=await fetch(API+"/api/admin/orders",{headers:{"x-admin-key":k}});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setOrders(j.orders||[]); setAuthed(true); setKey(k);
        if(opts&&opts.remember){ try{ localStorage.setItem("vg_admin_key",k); }catch(e){} }
        loadReviews(k); loadProds(k);
      } else { setErr(j.error||"That key didn't work. Please check and try again."); setAuthed(false);
        try{ localStorage.removeItem("vg_admin_key"); }catch(e){} }
    }catch(e){ setBusy(false); setErr("Something went wrong. Please try again."); }
  };
  const loadReviews=async(k)=>{ setRevBusy(true);
    try{ const r=await fetch(API+"/api/admin/reviews",{headers:{"x-admin-key":k||key}}); const j=await r.json(); setRevBusy(false); if(r.ok) setReviews(j.reviews||[]); }
    catch(e){ setRevBusy(false); }
  };
  const loadProds=async(k)=>{ setProdBusy(true);
    try{ const r=await fetch(API+"/api/admin/products",{headers:{"x-admin-key":k||key}}); const j=await r.json(); setProdBusy(false); if(r.ok) setProds(j.products||[]); }
    catch(e){ setProdBusy(false); }
  };
  const delReview=async(id)=>{ if(!window.confirm("Delete this review permanently?")) return;
    try{ const r=await fetch(API+"/api/admin/review-delete",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({id})});
      if(r.ok) setReviews(reviews.filter(rv=>rv.id!==id)); }catch(e){}
  };
  const delProduct=async(id)=>{ if(!window.confirm("Delete this product permanently? This can't be undone.")) return;
    try{ const r=await fetch(API+"/api/admin/product-delete",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({id})});
      if(r.ok) loadProds(key); }catch(e){}
  };
  const toggleStock=async(p)=>{ // quick out-of-stock / restock
    const body={...p,desc:p.descr,supplierUrl:p.supplier_url,stock:p.stock>0?0:10};
    try{ const r=await fetch(API+"/api/admin/product-save",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify(body)});
      if(r.ok) loadProds(key); }catch(e){}
  };
  useEffect(()=>{ let saved=""; try{ saved=localStorage.getItem("vg_admin_key")||""; }catch(e){}
    if(saved){ setKey(saved); load(saved,{remember:true}).finally(()=>setBooting(false)); }
    else setBooting(false);
  },[]);
  const logout=()=>{ try{ localStorage.removeItem("vg_admin_key"); }catch(e){} setAuthed(false); setKey(""); setOrders([]); setReviews([]); setErr(""); };
  const submit=()=>{ if(!key.trim()) return; load(key.trim(),{remember}); };
  return (<main style={{...S.main,maxWidth:960}}>
    <section style={{padding:"40px 0 8px"}}>
      <button onClick={onBack} style={S.linkBtn}>← Back to store</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:10,margin:"14px 0 6px"}}>
        <h1 style={{fontFamily:"var(--display)",fontSize:32,fontWeight:700,letterSpacing:"-.02em",margin:0}}>Seller dashboard</h1>
        {authed && <button onClick={logout} style={{...S.linkBtn,color:T.danger}}>Log out</button>}
      </div>
      {booting ? (
        <p style={{color:T.muted,marginTop:24}}>Loading…</p>
      ) : !authed ? (
        <div style={{maxWidth:380,marginTop:18,background:T.card,border:"1px solid "+T.line,borderRadius:16,padding:"26px 24px"}}>
          <div style={{width:44,height:44,borderRadius:12,background:T.tealSoft||"rgba(39,179,163,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:14}}>🔒</div>
          <h2 style={{fontFamily:"var(--display)",fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Seller login</h2>
          <p style={{color:T.inkSoft,fontSize:13.5,margin:"0 0 16px",lineHeight:1.5}}>Enter your admin key to view and manage orders. Only you have this key.</p>
          <input style={S.input} type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit();}} placeholder="Admin key" autoFocus />
          <label style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0 16px",fontSize:13.5,color:T.inkSoft,cursor:"pointer",userSelect:"none"}}>
            <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{width:16,height:16,accentColor:T.teal,cursor:"pointer"}} />
            Keep me logged in on this device
          </label>
          <button onClick={submit} disabled={busy} style={{...S.primaryBtn,width:"100%",...(busy?S.addBtnDisabled:{})}}>{busy?"Checking…":"Log in"}</button>
          {err && <p style={{color:T.danger,fontSize:13,marginTop:12,marginBottom:0}}>{err}</p>}
          <p style={{color:T.muted,fontSize:11.5,marginTop:16,marginBottom:0,lineHeight:1.5}}>Tip: only stay logged in on your own device. Use “Log out” on shared computers.</p>
        </div>
      ) : (
        <div style={{marginTop:18}}>
          <div style={{display:"flex",gap:6,marginBottom:18,borderBottom:"1px solid "+T.line,flexWrap:"wrap"}}>
            {[["orders","Orders"],["products","Products"],["reviews","Reviews"]].map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t?T.marigold:"transparent"),color:tab===t?T.ink:T.muted,padding:"8px 14px",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:-1}}>{label}{t==="products"&&prods.length>0?" ("+prods.length+")":""}{t==="reviews"&&reviews.length>0?" ("+reviews.length+")":""}</button>
            ))}
          </div>
          {tab==="orders" ? (<div>
          {(()=>{ const stat=(name)=>orders.filter(o=>(o.status||"Placed")===name).length;
            const revenue=orders.filter(o=>(o.status||"")!=="Cancelled").reduce((s,o)=>s+Number(o.total||0),0);
            const cards=[["Total orders",orders.length,T.ink],["New / Placed",stat("Placed"),T.marigold],["Shipped",stat("Shipped"),T.teal],["Delivered",stat("Delivered"),T.teal],["Revenue","₹"+revenue.toLocaleString("en-IN"),T.ink]];
            return (<div className="vg-stats" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
              {cards.map(([label,val,col])=>(<div key={label} style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"var(--display)",lineHeight:1.1}}>{val}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:3,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"}}>{label}</div>
              </div>))}
            </div>);
          })()}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10,flexWrap:"wrap"}}>
            <span style={{color:T.inkSoft,fontSize:13,fontFamily:"var(--mono)"}}>{orders.length} order{orders.length===1?"":"s"} · newest first</span>
            <button onClick={()=>load(key,{remember})} style={S.linkBtn}>↻ Refresh</button>
          </div>
          {orders.length===0 && <div style={{textAlign:"center",padding:"48px 20px",background:T.card,border:"1px dashed "+T.line,borderRadius:16}}><div style={{fontSize:32,marginBottom:8}}>📦</div><p style={{color:T.inkSoft,margin:0}}>No orders yet.</p><p style={{color:T.muted,fontSize:13,marginTop:4}}>When customers buy, their orders appear here.</p></div>}
          <div style={{display:"grid",gap:14}}>{orders.map(o=><AdminRow key={o.id} o={o} adminKey={key} prods={prods} onSaved={()=>load(key,{remember})} />)}</div>
          </div>) : tab==="products" ? (<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:10,flexWrap:"wrap"}}>
              <span style={{color:T.inkSoft,fontSize:13,fontFamily:"var(--mono)"}}>{prods.length} product{prods.length===1?"":"s"}</span>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>loadProds(key)} style={S.linkBtn}>↻ Refresh</button>
                <button onClick={()=>setEditing({_new:true,name:"",price:"",mrp:"",stock:"",category:"",img:"",descr:"",cost:"",supplier:"",supplier_url:"",active:true})} style={{...S.addBtn,width:"auto",marginTop:0,padding:"9px 18px",fontSize:13.5}}>+ Add product</button>
              </div>
            </div>
            {prodBusy && prods.length===0 && <p style={{color:T.muted}}>Loading products…</p>}
            {!prodBusy && prods.length===0 && <div style={{textAlign:"center",padding:"48px 20px",background:T.card,border:"1px dashed "+T.line,borderRadius:16}}><div style={{fontSize:32,marginBottom:8}}>🛍️</div><p style={{color:T.inkSoft,margin:0}}>No products yet.</p><p style={{color:T.muted,fontSize:13,marginTop:4}}>Click “Add product” to create your first one.</p></div>}
            <div style={{display:"grid",gap:12}}>{prods.map(p=>{ const oos=p.stock<=0; return (
              <div key={p.id} style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:14,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:T.bg||"#0f0d0a"}}>{p.img && <img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.currentTarget.style.opacity=0.2;}} />}</div>
                <div style={{flex:1,minWidth:160}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <strong style={{fontSize:14,color:T.ink}}>{esc(p.name)}</strong>
                    {p.active===false && <span style={{fontSize:10.5,padding:"2px 8px",borderRadius:999,background:"rgba(255,255,255,.06)",color:T.muted,fontFamily:"var(--mono)"}}>HIDDEN</span>}
                    <span style={{fontSize:10.5,padding:"2px 8px",borderRadius:999,background:oos?"rgba(232,130,12,.15)":"rgba(31,158,87,.15)",color:oos?T.marigold:"#34c77b",fontFamily:"var(--mono)",fontWeight:600}}>{oos?"OUT OF STOCK":p.stock+" in stock"}</span>
                  </div>
                  <div style={{fontSize:12.5,color:T.inkSoft,marginTop:4,fontFamily:"var(--mono)"}}>{rupee(p.price)}{p.mrp>p.price?" · MRP "+rupee(p.mrp):""}{p.category?" · "+esc(p.category):""}{p.cost!=null?" · cost "+rupee(p.cost):""}</div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>toggleStock(p)} style={{...S.linkBtn,fontSize:12.5}}>{oos?"Mark in stock":"Mark out of stock"}</button>
                  <button onClick={()=>setEditing({...p})} style={{...S.linkBtn,fontSize:12.5}}>Edit</button>
                  <button onClick={()=>delProduct(p.id)} style={{...S.linkBtn,color:T.danger,fontSize:12.5}}>Delete</button>
                </div>
              </div>); })}</div>
          </div>) : (<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10,flexWrap:"wrap"}}>
              <span style={{color:T.inkSoft,fontSize:13,fontFamily:"var(--mono)"}}>{reviews.length} review{reviews.length===1?"":"s"} · newest first</span>
              <button onClick={()=>loadReviews(key)} style={S.linkBtn}>↻ Refresh</button>
            </div>
            {revBusy && reviews.length===0 && <p style={{color:T.muted}}>Loading reviews…</p>}
            {!revBusy && reviews.length===0 && <div style={{textAlign:"center",padding:"48px 20px",background:T.card,border:"1px dashed "+T.line,borderRadius:16}}><div style={{fontSize:32,marginBottom:8}}>⭐</div><p style={{color:T.inkSoft,margin:0}}>No reviews yet.</p><p style={{color:T.muted,fontSize:13,marginTop:4}}>Customer reviews will appear here for you to manage.</p></div>}
            <div style={{display:"grid",gap:12}}>{reviews.map(rv=>(<div key={rv.id} style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <strong style={{fontSize:14,color:T.ink}}>{esc(rv.name)}</strong>
                    <Stars value={rv.rating} size={13} />
                    <span style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)"}}>on {esc(rv.product_id)}</span>
                  </div>
                  {rv.comment && <p style={{fontSize:13,color:T.inkSoft,margin:"8px 0 0",lineHeight:1.55}}>{esc(rv.comment)}</p>}
                  <p style={{fontSize:11,color:T.muted,margin:"8px 0 0",fontFamily:"var(--mono)"}}>{new Date(rv.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                </div>
                <button onClick={()=>delReview(rv.id)} style={{...S.linkBtn,color:T.danger,fontSize:12.5,flexShrink:0}}>Delete</button>
              </div>
            </div>))}</div>
          </div>)}
        </div>
      )}
      {editing && <ProductEditor product={editing} adminKey={key} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);loadProds(key);}} />}
    </section>
  </main>);
}
function ProductEditor({product,adminKey,onClose,onSaved}){
  const isNew=product._new;
  const [f,setF]=useState({
    id:product.id||"", name:product.name||"", price:product.price??"", mrp:product.mrp??"",
    stock:product.stock??"", category:product.category||"", img:product.img||"",
    desc:(product.descr!=null?product.descr:product.desc)||"",
    cost:product.cost??"", supplier:product.supplier||"", supplierUrl:(product.supplier_url!=null?product.supplier_url:product.supplierUrl)||"",
    active:product.active!==false,
  });
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState("");
  const up=(k)=>(e)=>setF({...f,[k]:e.target.value});
  const save=async()=>{ setMsg("");
    if(!f.name.trim()){ setMsg("Please enter a product name."); return; }
    if(f.price===""||isNaN(Number(f.price))||Number(f.price)<0){ setMsg("Please enter a valid price."); return; }
    setSaving(true);
    try{ const r=await fetch(API+"/api/admin/product-save",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({
        id:isNew?"":f.id, name:f.name, price:Number(f.price), mrp:Number(f.mrp)||0, stock:Number(f.stock)||0,
        category:f.category, img:f.img, desc:f.desc, cost:f.cost===""?"":Number(f.cost), supplier:f.supplier, supplierUrl:f.supplierUrl, active:f.active })});
      const j=await r.json(); setSaving(false);
      if(r.ok) onSaved(); else setMsg(j.error||"Couldn't save the product.");
    }catch(e){ setSaving(false); setMsg("Something went wrong. Please try again."); }
  };
  const L=({label,hint,children})=>(<label style={{display:"block",marginBottom:12}}><span style={{...S.fieldLabel,display:"block"}}>{label}{hint&&<span style={{color:T.muted,fontWeight:400}}> · {hint}</span>}</span>{children}</label>);
  return (<Overlay onClose={saving?()=>{}:onClose}><div style={{...S.modal,maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={S.modalTitle}>{isNew?"Add product":"Edit product"}</h2>
      <button onClick={onClose} style={S.linkBtn}>✕ Close</button>
    </div>
    <L label="Product name"><input style={S.input} value={f.name} onChange={up("name")} maxLength={120} placeholder="e.g. Brass Wall Clock" /></L>
    <div style={S.two}>
      <L label="Selling price (₹)"><input style={S.input} value={f.price} onChange={up("price")} inputMode="numeric" placeholder="699" /></L>
      <L label="MRP (₹)" hint="optional"><input style={S.input} value={f.mrp} onChange={up("mrp")} inputMode="numeric" placeholder="1299" /></L>
    </div>
    <div style={S.two}>
      <L label="Stock quantity"><input style={S.input} value={f.stock} onChange={up("stock")} inputMode="numeric" placeholder="15" /></L>
      <L label="Category" hint="e.g. Home"><input style={S.input} value={f.category} onChange={up("category")} maxLength={40} placeholder="Home" /></L>
    </div>
    <L label="Image URL" hint="paste a link to the product photo"><input style={S.input} value={f.img} onChange={up("img")} maxLength={500} placeholder="https://..." /></L>
    {f.img && <div style={{width:90,height:90,borderRadius:10,overflow:"hidden",marginBottom:12,background:T.bg||"#0f0d0a"}}><img src={f.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.currentTarget.style.opacity=0.2;}} /></div>}
    <L label="Description" hint="short, what makes it good"><textarea style={{...S.input,minHeight:64,resize:"vertical",fontFamily:"inherit"}} value={f.desc} onChange={up("desc")} maxLength={600} placeholder="Insulated 750ml bottle. Keeps cold 24h." /></L>
    <div style={{borderTop:"1px solid "+T.line,margin:"6px 0 14px",paddingTop:14}}>
      <p style={{fontSize:11.5,color:T.muted,margin:"0 0 10px",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>Private · only you see this</p>
      <div style={S.two}>
        <L label="Your cost (₹)" hint="what you pay supplier"><input style={S.input} value={f.cost} onChange={up("cost")} inputMode="numeric" placeholder="380" /></L>
        <L label="Supplier name"><input style={S.input} value={f.supplier} onChange={up("supplier")} maxLength={120} placeholder="Moradabad Metals" /></L>
      </div>
      <L label="Supplier link" hint="where you order it"><input style={S.input} value={f.supplierUrl} onChange={up("supplierUrl")} maxLength={300} placeholder="https://supplier..." /></L>
    </div>
    <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,fontSize:13.5,color:T.inkSoft,cursor:"pointer"}}>
      <input type="checkbox" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})} style={{width:16,height:16,accentColor:T.teal}} />
      Show this product on the store {f.active?"":"(currently hidden)"}
    </label>
    {msg && <p style={{color:T.danger,fontSize:13,marginBottom:10}}>{msg}</p>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <button onClick={save} disabled={saving} style={{...S.primaryBtn,width:"auto",padding:"11px 24px",...(saving?S.addBtnDisabled:{})}}>{saving?"Saving…":(isNew?"Add product":"Save changes")}</button>
      <button onClick={onClose} disabled={saving} style={S.linkBtn}>Cancel</button>
    </div>
  </div></Overlay>);
}
function AdminRow({o,adminKey,prods,onSaved}){
  const [status,setStatus]=useState(o.status||"Placed");
  const [carrier,setCarrier]=useState(o.tracking_carrier||"");
  const [url,setUrl]=useState(o.tracking_url||"");
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(""); const [open,setOpen]=useState(false);
  const [fulfill,setFulfill]=useState(false); const [copied,setCopied]=useState("");
  const [confirmOpen,setConfirmOpen]=useState(false);
  const save=async()=>{ setSaving(true); setMsg("");
    try{ const r=await fetch(API+"/api/admin/update",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({orderId:o.id,status,trackingCarrier:carrier,trackingUrl:url})});
      const j=await r.json(); setSaving(false);
      if(r.ok){ setMsg("Saved ✓"); onSaved&&onSaved(); } else { setMsg(j.error||"Failed"); }
    }catch(e){ setSaving(false); setMsg("Failed"); }
  };
  const copy=(text,label)=>{ try{ navigator.clipboard.writeText(text); setCopied(label); setTimeout(()=>setCopied(""),1800); }catch(e){
    const t=document.createElement("textarea"); t.value=text; document.body.appendChild(t); t.select(); try{document.execCommand("copy");}catch(_){} document.body.removeChild(t); setCopied(label); setTimeout(()=>setCopied(""),1800);
  } };
  const badge={Placed:["#fff",T.marigold],Packed:["#fff","#7c6cff"],Shipped:["#fff",T.teal],Delivered:["#fff","#1f9e57"],Cancelled:[T.muted,"transparent"]};
  const bc=badge[o.status||"Placed"]||badge.Placed;
  let items=[]; try{ items=Array.isArray(o.items)?o.items:JSON.parse(o.items||"[]"); }catch(e){ items=[]; }
  // supply info: prefer stored supply snapshot, else match current products by name
  let supply=[]; try{ supply=Array.isArray(o.supply)?o.supply:JSON.parse(o.supply||"[]"); }catch(e){ supply=[]; }
  const supplyFor=(it)=>{
    let s=supply.find(x=>x.name===it.name)||{};
    if((!s.supplier&&!s.supplierUrl)&&Array.isArray(prods)){
      const p=prods.find(pp=>pp.name===it.name)||{};
      s={supplier:p.supplier,supplierUrl:p.supplier_url,cost:p.cost};
    }
    return s;
  };
  const addressText=`${o.name}\n${o.line1}${o.line2?", "+o.line2:""}\n${o.city}, ${o.state} - ${o.pincode}\nPhone: ${o.phone}`;
  const fullOrderText=`Order ${o.id}\nShip to:\n${addressText}\n\nItems:\n`+items.map(i=>`- ${i.name} x${i.qty||1}`).join("\n");
  const itemSummary=items.map(i=>`${i.name} x${i.qty||1}`).join(", ");
  const confirmMsg=`Hi ${o.name}, this is Vector Grid 👋\n\nPlease confirm your Cash on Delivery order:\n• Order ID: ${o.id}\n• Items: ${itemSummary}\n• Amount to pay on delivery: ${rupee(o.total)}\n• Delivery address: ${o.line1}${o.line2?", "+o.line2:""}, ${o.city}, ${o.state} - ${o.pincode}\n\nReply YES to confirm and we'll ship it out. Thank you for shopping with us!`;
  const dt=o.created_at?new Date(o.created_at):null;
  const dstr=dt?dt.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
  return (<div style={{background:T.card,border:"1px solid "+T.line,borderRadius:14,overflow:"hidden"}}>
    <div style={{padding:"16px 18px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,alignItems:"flex-start"}}>
      <div style={{minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <strong style={{fontFamily:"var(--mono)",fontSize:14,color:T.ink}}>{esc(o.id)}</strong>
          <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,color:bc[0],background:bc[1],border:bc[1]==="transparent"?"1px solid "+T.line:"none",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"}}>{o.status||"Placed"}</span>
          <span style={{fontSize:11.5,padding:"3px 9px",borderRadius:999,background:o.paid?"rgba(31,158,87,.15)":"rgba(232,130,12,.15)",color:o.paid?"#34c77b":T.marigold,fontFamily:"var(--mono)",fontWeight:600}}>{o.paid?"PAID ONLINE":"COD"}</span>
          {o.status!=="Cancelled" && <span style={{fontSize:11.5,padding:"3px 9px",borderRadius:999,background:o.customer_confirmed?"rgba(31,158,87,.15)":"rgba(229,104,90,.15)",color:o.customer_confirmed?"#34c77b":"#e5685a",fontFamily:"var(--mono)",fontWeight:600}}>{o.customer_confirmed?"✓ CONFIRMED":"⏳ AWAITING CONFIRM"}</span>}
        </div>
        <div style={{fontSize:13,color:T.inkSoft,marginTop:7,lineHeight:1.6}}>
          <strong style={{color:T.ink}}>{esc(o.name)}</strong> · 📱 {esc(o.phone)}{o.email?" · ✉ "+esc(o.email):""}<br/>
          📍 {esc(o.line1)}{o.line2?", "+esc(o.line2):""}, {esc(o.city)}, {esc(o.state)} — {esc(o.pincode)}
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:"var(--display)"}}>{rupee(o.total)}</div>
        {dstr && <div style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)",marginTop:2}}>{dstr}</div>}
      </div>
    </div>
    {items.length>0 && <div style={{padding:"0 18px 14px"}}>
      <button onClick={()=>setOpen(!open)} style={{...S.linkBtn,fontSize:12.5}}>{open?"▾ Hide items":"▸ "+items.reduce((n,i)=>n+(i.qty||1),0)+" item"+(items.reduce((n,i)=>n+(i.qty||1),0)===1?"":"s")}</button>
      {open && <div style={{marginTop:8,background:T.bg||"#0f0d0a",borderRadius:10,padding:"10px 12px"}}>
        {items.map((i,idx)=>(<div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,padding:"3px 0"}}><span>{esc(i.name||"Item")} <span style={{color:T.muted,fontFamily:"var(--mono)"}}>× {i.qty||1}</span></span><span style={{color:T.ink}}>{rupee((i.price||0)*(i.qty||1))}</span></div>))}
      </div>}
    </div>}
    {(!o.paid && o.status!=="Cancelled") && <div style={{borderTop:"1px solid "+T.line,padding:"14px 18px",background:"rgba(232,130,12,.07)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:T.marigold,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>📞 Confirm COD order before shipping</div>
        <button onClick={()=>setConfirmOpen(!confirmOpen)} style={{...S.linkBtn,fontSize:12.5,color:T.marigold}}>{confirmOpen?"▾ Hide":"▸ Show"}</button>
      </div>
      {confirmOpen && <div style={{marginTop:12}}>
        <p style={{fontSize:12,color:T.muted,margin:"0 0 12px",lineHeight:1.55}}>COD orders can be refused at the door, which costs you shipping both ways. A quick confirmation message first prevents most refusals. Copy this and send it via SMS or WhatsApp to <strong style={{color:T.inkSoft}}>{esc(o.phone)}</strong> before you ship.</p>
        <div style={{background:T.card,border:"1px solid "+T.line,borderRadius:10,padding:14}}>
          <pre style={{margin:0,fontFamily:"inherit",fontSize:13,color:T.ink,whiteSpace:"pre-wrap",lineHeight:1.6}}>{confirmMsg}</pre>
          <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
            <button onClick={()=>copy(confirmMsg,"confirm")} style={{...S.addBtn,width:"auto",marginTop:0,padding:"9px 16px",fontSize:12.5}}>{copied==="confirm"?"✓ Copied":"Copy message"}</button>
            <a href={"tel:"+esc(o.phone)} style={{...S.linkBtn,fontSize:12.5,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>📱 Call customer</a>
          </div>
        </div>
        <p style={{fontSize:11,color:T.muted,marginTop:10,lineHeight:1.5}}>Tip: if they don't reply or confirm, hold the order or switch them to prepaid before shipping.</p>
      </div>}
    </div>}
    {(o.status!=="Cancelled") && <div style={{borderTop:"1px solid "+T.line,padding:"14px 18px",background:"rgba(124,108,255,.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:"#a99dff",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>📦 Fulfil this order (order from supplier)</div>
        <button onClick={()=>setFulfill(!fulfill)} style={{...S.linkBtn,fontSize:12.5,color:"#a99dff"}}>{fulfill?"▾ Hide":"▸ Show"}</button>
      </div>
      {fulfill && <div style={{marginTop:12}}>
        {!o.customer_confirmed && <div style={{background:"rgba(229,104,90,.12)",border:"1px solid rgba(229,104,90,.3)",borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12.5,color:"#e5685a",lineHeight:1.5}}>⏳ The customer hasn't confirmed this order yet. We recommend waiting for confirmation (or sending the confirm message above) before you ship.</div>}
        <p style={{fontSize:12,color:T.muted,margin:"0 0 12px",lineHeight:1.55}}>Order each item from your supplier and enter <strong style={{color:T.inkSoft}}>this customer's address</strong> as the delivery address. Then come back and mark it Shipped with the tracking link.</p>
        <div style={{display:"grid",gap:8,marginBottom:12}}>
          {items.map((it,idx)=>{ const s=supplyFor(it); return (
            <div key={idx} style={{background:T.card,border:"1px solid "+T.line,borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontSize:13,color:T.ink}}>{esc(it.name)} <span style={{color:T.muted,fontFamily:"var(--mono)"}}>× {it.qty||1}</span>
                <div style={{fontSize:11.5,color:T.muted,fontFamily:"var(--mono)",marginTop:3}}>{s.supplier?("Supplier: "+esc(s.supplier)):"Supplier: not set"}{s.cost!=null?" · your cost "+rupee(s.cost):""}</div>
              </div>
              {s.supplierUrl ? <a href={s.supplierUrl} target="_blank" rel="noopener noreferrer" style={{...S.addBtn,width:"auto",marginTop:0,padding:"8px 14px",fontSize:12.5,textDecoration:"none",textAlign:"center"}}>Open supplier ↗</a>
                : <span style={{fontSize:11.5,color:T.muted}}>No supplier link</span>}
            </div>); })}
        </div>
        <div style={{background:T.card,border:"1px solid "+T.line,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Ship to (paste at supplier)</div>
          <pre style={{margin:0,fontFamily:"inherit",fontSize:13,color:T.ink,whiteSpace:"pre-wrap",lineHeight:1.6}}>{addressText}</pre>
          <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
            <button onClick={()=>copy(addressText,"address")} style={{...S.addBtn,width:"auto",marginTop:0,padding:"9px 16px",fontSize:12.5}}>{copied==="address"?"✓ Copied":"Copy address"}</button>
            <button onClick={()=>copy(fullOrderText,"order")} style={{...S.linkBtn,fontSize:12.5}}>{copied==="order"?"✓ Copied":"Copy full order"}</button>
          </div>
        </div>
      </div>}
    </div>}
    <div style={{borderTop:"1px solid "+T.line,padding:"14px 18px",background:"rgba(255,255,255,.015)"}}>
      <div style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Update status & tracking</div>
      <div className="vg-admin" style={{display:"grid",gridTemplateColumns:"150px 1fr 1fr auto",gap:10,alignItems:"center"}}>
        <select style={S.input} value={status} onChange={e=>setStatus(e.target.value)}>{["Placed","Packed","Shipped","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select>
        <input style={S.input} value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="Carrier (e.g. Delhivery)" />
        <input style={S.input} value={url} onChange={e=>setUrl(e.target.value)} placeholder="Tracking link (optional)" />
        <button onClick={save} disabled={saving} style={{...S.addBtn,width:"auto",marginTop:0,padding:"10px 18px"}}>{saving?"…":"Save"}</button>
      </div>
      {msg && <p style={{fontSize:12,color:msg.indexOf("Saved")===0?T.teal:T.danger,marginTop:8,fontFamily:"var(--mono)"}}>{msg}</p>}
    </div>
  </div>);
}

function Footer({storeName,onNav}){
  const links=[["Track order","track"],["About","about"],["Terms","terms"],["Privacy","privacy"],["Refund","refund"],["Shipping","shipping"],["Contact","contact"],["Seller","admin"]];
  return (<footer style={S.footer}>
    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,alignItems:"center"}}>
      <span style={{fontWeight:600,color:T.ink}}>{storeName}</span>
      <nav style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        {links.map(([label,key])=>(<button key={key} onClick={()=>onNav(key)} style={S.footLink}>{label}</button>))}
      </nav>
    </div>
    <div style={{marginTop:14,color:T.muted}}>Delivered across India · payments secured by Razorpay</div>
  </footer>);
}

const S={ page:{minHeight:"100vh",background:T.paper,color:T.ink,fontFamily:"var(--body)"},
  header:{position:"sticky",top:0,zIndex:30,background:"rgba(20,17,14,.82)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(255,255,255,.08)"},
  headerInner:{maxWidth:1100,margin:"0 auto",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10},
  mark:{color:T.marigold,fontSize:18}, wordmark:{fontFamily:"var(--display)",fontWeight:700,fontSize:22,letterSpacing:"-.01em",color:T.ink}, tagline:{fontFamily:"var(--mono)",fontSize:11,color:"#9a9286",textTransform:"uppercase",letterSpacing:".08em"},
  trackLink:{border:"none",background:"transparent",color:T.ink,fontWeight:600,fontSize:13,padding:"6px 4px"},
  quickClose:{position:"absolute",top:12,right:12,zIndex:5,border:"none",background:"rgba(26,22,18,.6)",color:"#fff",width:34,height:34,borderRadius:999,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"},
  quickBack:{border:"none",background:"transparent",color:T.teal,fontWeight:600,fontSize:13,padding:0,marginBottom:2},
  cartBtn:{position:"relative",border:"none",background:T.marigold,color:"#fff",borderRadius:999,padding:"8px 18px",fontSize:13,fontWeight:700}, cartBadge:{position:"absolute",top:-6,right:-6,background:"#0F0C09",color:"#fff",borderRadius:999,fontSize:11,minWidth:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 4px"},
  main:{maxWidth:1100,margin:"0 auto",padding:"0 22px 60px"}, hero:{padding:"38px 0 18px",maxWidth:660}, eyebrow:{fontFamily:"var(--mono)",fontSize:12,color:T.teal,textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}, heroH1:{fontFamily:"var(--display)",fontSize:"clamp(30px,5vw,50px)",lineHeight:1.04,fontWeight:700,letterSpacing:"-.02em",margin:0}, heroSub:{fontSize:15.5,color:T.inkSoft,marginTop:16,maxWidth:460,lineHeight:1.5},
  heroWrap:{position:"relative",width:"100%",minHeight:"clamp(440px,76vh,640px)",display:"flex",alignItems:"center",overflow:"hidden",background:"#161310"},
  heroCanvas:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"},
  heroOverlay:{position:"absolute",inset:0,background:"radial-gradient(120% 90% at 50% 28%, rgba(22,19,16,0) 35%, rgba(22,19,16,.5) 100%)",pointerEvents:"none"},
  heroContent:{position:"relative",zIndex:2,maxWidth:1100,width:"100%",margin:"0 auto",padding:"0 24px"},
  heroEyebrow:{fontFamily:"var(--mono)",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"#F3A23E",margin:"0 0 16px"},
  heroTitle:{fontFamily:"var(--display)",fontWeight:700,fontSize:"clamp(40px,8vw,82px)",lineHeight:.98,letterSpacing:"-.025em",color:"#FBFAF6",margin:0,textShadow:"0 2px 40px rgba(0,0,0,.45)"},
  heroAccent:{background:"linear-gradient(90deg,#F3A23E,#E8820C 55%,#27B3A3)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",fontStyle:"italic"},
  heroLede:{color:"rgba(251,250,246,.74)",fontSize:"clamp(15px,1.6vw,18px)",lineHeight:1.55,maxWidth:520,margin:"22px 0 30px"},
  heroProof:{marginTop:22,fontFamily:"var(--mono)",fontSize:12.5,color:"rgba(251,250,246,.6)",letterSpacing:".02em"},
  heroBtns:{display:"flex",gap:12,flexWrap:"wrap"},
  heroPrimary:{border:"none",background:"linear-gradient(95deg,#F3A23E,#E8820C 60%,#27B3A3)",color:"#fff",fontWeight:800,fontSize:15,borderRadius:999,padding:"14px 28px",boxShadow:"0 12px 34px rgba(232,130,12,.45)",letterSpacing:".01em"},
  heroGhost:{border:"1.5px solid rgba(251,250,246,.3)",background:"rgba(251,250,246,.04)",color:"#FBFAF6",fontWeight:600,fontSize:15,borderRadius:999,padding:"13px 24px"},
  heroScroll:{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:2,border:"1px solid rgba(251,250,246,.25)",background:"rgba(251,250,246,.06)",color:"#FBFAF6",borderRadius:999,width:38,height:38,fontSize:16},
  trustBar:{display:"flex",flexWrap:"wrap",gap:"8px 18px",alignItems:"center",padding:"12px 16px",background:T.tint,border:"1px solid "+T.line,borderRadius:12,marginBottom:22},
  marquee:{overflow:"hidden",whiteSpace:"nowrap",background:"linear-gradient(90deg,#F3A23E,#E8820C 50%,#27B3A3)",padding:"11px 0"},
  marqueeTrack:{display:"inline-flex",whiteSpace:"nowrap"},
  featRow:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,margin:"26px 0 8px"},
  featCard:{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(180deg,#221C16,#191510)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"14px 16px"},
  featIcon:{fontSize:24,flexShrink:0},
  featTitle:{fontSize:14,fontWeight:700,color:T.ink}, featSub:{fontSize:11.5,color:T.muted,marginTop:2,fontFamily:"var(--mono)"},
  shopHead:{margin:"30px 0 14px"},
  shopHeadTitle:{fontFamily:"var(--display)",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,letterSpacing:"-.02em",margin:0,color:T.ink},
  shopHeadSub:{fontSize:14,color:T.inkSoft,marginTop:6},
  aboutBand:{marginTop:56,padding:"clamp(32px,5vw,56px)",borderRadius:24,background:"radial-gradient(120% 140% at 15% 10%, rgba(232,130,12,.14), transparent 55%), radial-gradient(120% 140% at 90% 90%, rgba(39,179,163,.14), transparent 55%), linear-gradient(180deg,#221C16,#191510)",border:"1px solid rgba(255,255,255,.08)"},
  aboutInner:{maxWidth:680},
  aboutEyebrow:{fontFamily:"var(--mono)",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"#F3A23E",margin:"0 0 14px"},
  aboutTitle:{fontFamily:"var(--display)",fontSize:"clamp(26px,4.4vw,42px)",fontWeight:700,letterSpacing:"-.02em",lineHeight:1.08,margin:0,color:T.ink},
  aboutText:{fontSize:"clamp(14px,1.5vw,16px)",color:T.inkSoft,lineHeight:1.65,margin:"18px 0 0",maxWidth:600},
  aboutStats:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginTop:28},
  aboutStat:{background:"rgba(0,0,0,.18)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"18px 16px"},
  trustItem:{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"var(--mono)",fontSize:12,color:T.inkSoft}, trustIcon:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:6,background:T.card,color:T.marigold,fontSize:11.5,fontWeight:700},
  toolbar:{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap"}, searchWrap:{position:"relative",flex:"1 1 260px",display:"flex",alignItems:"center"}, searchIcon:{position:"absolute",left:14,fontSize:18,color:T.muted,pointerEvents:"none"}, searchInput:{width:"100%",border:"1px solid "+T.line,borderRadius:999,padding:"11px 38px",fontSize:14.5,background:T.card,color:T.ink,fontFamily:"var(--body)"}, searchClear:{position:"absolute",right:12,border:"none",background:"transparent",color:T.muted,fontSize:13},
  sortWrap:{display:"inline-flex",alignItems:"center",gap:8}, sortLabel:{fontFamily:"var(--mono)",fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:".06em"}, sortSelect:{border:"1px solid "+T.line,borderRadius:999,padding:"9px 14px",fontSize:13.5,background:T.card,color:T.ink,fontFamily:"var(--body)",fontWeight:600},
  chipsRow:{display:"flex",gap:9,marginBottom:14,overflowX:"auto",paddingBottom:4}, chip:{flex:"0 0 auto",border:"1.5px solid "+T.line,background:T.card,color:T.inkSoft,borderRadius:999,padding:"8px 16px",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}, chipOn:{borderColor:"transparent",background:"linear-gradient(95deg,#F3A23E,#E8820C 60%,#27B3A3)",color:"#fff"},
  countText:{fontFamily:"var(--mono)",fontSize:12,color:T.muted,margin:"0 0 16px"}, empty:{textAlign:"center",padding:"60px 20px",border:"1px dashed "+T.line,borderRadius:16,background:T.card}, catTag:{position:"absolute",bottom:10,left:10,background:"rgba(15,12,9,.82)",backdropFilter:"blur(4px)",color:T.inkSoft,fontSize:10.5,fontWeight:700,padding:"3px 8px",borderRadius:999,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:20}, prodCard:{background:"linear-gradient(180deg,#221C16,#191510)",border:"1px solid rgba(255,255,255,.07)",borderRadius:18,overflow:"hidden",display:"flex",flexDirection:"column"}, imgWrap:{border:"none",padding:0,background:"#14110D",position:"relative",aspectRatio:"4/3",overflow:"hidden",display:"block"}, img:{width:"100%",height:"100%",objectFit:"cover",display:"block"}, soldOut:{position:"absolute",inset:0,background:"rgba(25,21,16,.55)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontFamily:"var(--mono)",fontSize:13}, discount:{position:"absolute",top:10,left:10,background:"linear-gradient(95deg,#27B3A3,#1f9e8c)",color:"#fff",fontSize:12,fontWeight:800,padding:"5px 11px",borderRadius:999,fontFamily:"var(--mono)",boxShadow:"0 4px 14px rgba(39,179,163,.4)"},
  prodName:{fontFamily:"var(--display)",fontSize:17,fontWeight:600,margin:0,lineHeight:1.2}, prodDesc:{fontSize:12.5,color:T.inkSoft,marginTop:6,lineHeight:1.45,minHeight:36}, priceRow:{display:"flex",alignItems:"baseline",gap:8,marginTop:10}, price:{fontSize:18,fontWeight:800,color:T.ink}, mrp:{fontSize:13,color:T.muted,textDecoration:"line-through"},
  addBtn:{width:"100%",marginTop:12,border:"1.5px solid "+T.ink,background:T.ink,color:T.paper,borderRadius:10,padding:"10px",fontWeight:700,fontSize:13.5}, addBtnDisabled:{background:"transparent",color:T.muted,borderColor:T.line,cursor:"not-allowed"},
  drawerScrim:{position:"fixed",inset:0,background:"rgba(6,5,3,.55)",zIndex:50,display:"flex",justifyContent:"flex-end"}, drawer:{width:"min(420px,100%)",background:T.paper,height:"100%",display:"flex",flexDirection:"column",boxShadow:"-20px 0 60px rgba(0,0,0,.18)"}, drawerHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid "+T.line}, drawerTitle:{fontFamily:"var(--display)",fontSize:20,margin:0}, xBtn:{border:"none",background:"transparent",fontSize:18,color:T.inkSoft},
  cartRow:{display:"flex",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.line}, cartThumb:{width:60,height:60,borderRadius:10,objectFit:"cover",background:"#221E18"}, cartName:{fontSize:14,fontWeight:600,margin:0}, cartPrice:{fontSize:13,color:T.inkSoft,marginTop:2}, qtyRow:{display:"flex",alignItems:"center",gap:8,marginTop:8}, qtyBtn:{width:26,height:26,borderRadius:7,border:"1px solid "+T.line,background:T.card,fontSize:15,lineHeight:1}, qtyNum:{minWidth:18,textAlign:"center",fontWeight:600,fontSize:14}, cartLine:{fontWeight:700,fontSize:14}, drawerFoot:{padding:20,borderTop:"1px solid "+T.line,background:T.card},
  overlay:{position:"fixed",inset:0,background:"rgba(6,5,3,.6)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}, modal:{background:T.paper,borderRadius:18,padding:28,width:"100%",boxShadow:"0 30px 80px rgba(0,0,0,.25)"}, modalTitle:{fontFamily:"var(--display)",fontSize:24,margin:0}, linkBtn:{border:"none",background:"transparent",color:T.teal,fontWeight:600,fontSize:13},
  fieldLabel:{display:"block",fontSize:12,fontWeight:600,color:T.inkSoft,marginBottom:5,fontFamily:"var(--mono)",letterSpacing:".02em"}, input:{width:"100%",border:"1px solid "+T.line,borderRadius:9,padding:"9px 11px",fontSize:14,background:T.card,color:T.ink,fontFamily:"var(--body)"}, two:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}, payChip:{border:"1.5px solid "+T.line,background:T.card,borderRadius:9,padding:"9px 14px",fontSize:12.5,fontWeight:600,color:T.inkSoft}, payChipOn:{borderColor:T.teal,color:T.teal,background:"rgba(44,187,169,.14)"},
  payOpt:{display:"flex",alignItems:"center",gap:10,textAlign:"left",border:"1.5px solid "+T.line,background:T.card,borderRadius:12,padding:"12px 14px",color:T.ink}, payOptOn:{borderColor:T.teal,background:"rgba(44,187,169,.12)"}, payRadio:{flex:"0 0 auto",width:20,height:20,borderRadius:999,border:"2px solid "+T.line,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}, payRadioOn:{borderColor:T.teal,background:T.teal}, payTitle:{fontSize:14,fontWeight:700,color:T.ink}, paySub:{fontSize:11.5,color:T.inkSoft,marginTop:2,fontFamily:"var(--mono)"}, summary:{background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:20,alignSelf:"start"}, summaryTitle:{fontFamily:"var(--display)",fontSize:16,margin:"0 0 12px"}, primaryBtn:{width:"100%",border:"none",background:T.marigold,color:"#fff",borderRadius:11,padding:"12px",fontWeight:700,fontSize:14.5},
  checkCircle:{width:56,height:56,borderRadius:999,background:T.teal,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto"}, stepper:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:22}, stepDot:{width:30,height:30,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,margin:"0 auto 5px"}, stepLine:{width:34,height:2,background:T.line,marginBottom:18},
  footer:{maxWidth:1100,margin:"0 auto",padding:"26px 22px 50px",display:"block",borderTop:"1px solid "+T.line,fontSize:12.5,color:T.inkSoft,fontFamily:"var(--mono)"}, footLink:{border:"none",background:"transparent",color:T.inkSoft,fontFamily:"var(--mono)",fontSize:12.5,padding:0,textDecoration:"underline",textUnderlineOffset:"3px"},
  coTrust:{display:"flex",flexWrap:"wrap",gap:"8px 16px",padding:"10px 14px",background:T.tint,border:"1px solid "+T.line,borderRadius:10,marginBottom:18},
  coTrustItem:{fontFamily:"var(--mono)",fontSize:11.5,color:T.inkSoft,display:"inline-flex",alignItems:"center",gap:6},
  coSecure:{marginTop:14,display:"grid",gap:9,paddingTop:14,borderTop:"1px solid "+T.line},
  coSecureRow:{display:"flex",gap:9,alignItems:"flex-start",fontSize:11.5,color:T.muted,lineHeight:1.5} };

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
