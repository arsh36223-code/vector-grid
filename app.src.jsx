const { useState, useEffect, useMemo } = React;
const API = "";

const T = { paper:"#FBFAF6", card:"#FFFFFF", ink:"#191510", inkSoft:"#5C544A", muted:"#9A9085", line:"#E9E3D8", marigold:"#E8820C", marigoldDark:"#C96A00", teal:"#0E5C53", tint:"#FBF1E2", danger:"#B23B2E" };
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
const esc = (s) => String(s==null?"":s);

/* ===== EDIT YOUR DETAILS HERE (used across the policy pages) ===== */
const INFO = {
  legalName: "Vector Grid",                 // your seller / registered name
  email: "vectorgridsupport@gmail.com",     // your contact email
  phone: "+91 8439585938",                  // your contact number
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
    `${INFO.legalName} collects only the information needed to process and deliver your order: your name, phone number, email (optional), and delivery address.`,
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
    `Phone: ${INFO.phone}`,
    `Address: ${INFO.address}`,
    "We aim to respond to all queries within 1–2 business days.",
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

  const finishOrder=(form,paymentLabel,amount,orderId)=>{
    setConfirmed({ id:orderId||("VG"+Date.now().toString().slice(-8)), total:amount, payment:paymentLabel, customer:form });
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
        if(j.ok){ finishOrder(form,"COD",total,j.orderId); }
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
  return (<header style={S.header}><div style={S.headerInner}>
    <div onClick={onHome} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}><img src="/vectorgrid-mark.svg" alt="Vector Grid" width="34" height="34" style={{display:"block"}} /><span style={S.wordmark}>{storeName}</span><span style={S.tagline}>ships pan-India</span></div>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <button onClick={onTrack} style={S.trackLink}>Track order</button>
      <button onClick={onCart} style={S.cartBtn} aria-label="Open cart">Cart{cartCount>0 && <span style={S.cartBadge}>{cartCount}</span>}</button>
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
      <p style={S.heroEyebrow}>Curated goods · delivered across India ✈</p>
      <h1 style={S.heroTitle}>Things worth<br/><span style={S.heroAccent}>waiting</span> for.</h1>
      <p style={S.heroLede}>A handpicked collection, shipped to every pincode. Search, browse, and check out in a tap — Cash on Delivery or secure online payment.</p>
      <div style={S.heroBtns}>
        <button onClick={onShop} style={S.heroPrimary}>Shop the collection</button>
        <button onClick={onTrack} style={S.heroGhost}>Track your order</button>
      </div>
    </div>
    <button onClick={onShop} style={S.heroScroll} aria-label="Scroll to products">↓</button>
  </section>);
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
    <main style={S.main} id="shop">
    <div style={S.trustBar} className="vg-trust">
      {[["✈️","Ships pan-India"],["↩","Easy 7-day returns"],["₹","COD available"],["✓","Secure Razorpay checkout"]].map(([i,t])=>(
        <span key={t} style={S.trustItem}><span aria-hidden="true" style={S.trustIcon}>{i}</span>{t}</span>
      ))}
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
        <article key={p.id} style={S.prodCard} className="vg-card">
          <button style={S.imgWrap} onClick={()=>onQuick(p)} aria-label={"View "+esc(p.name)}>
            <img src={p.img} alt={esc(p.name)} style={S.img} loading="lazy" onError={(e)=>{e.currentTarget.style.opacity=0.25;}} />
            {out && <span style={S.soldOut}>Sold out</span>}
            {!out && p.mrp>p.price && <span style={S.discount}>{Math.round(100-(p.price/p.mrp)*100)}% off</span>}
            {p.category && <span style={S.catTag}>{p.category}</span>}
          </button>
          <div style={{padding:"14px 16px 16px",display:"flex",flexDirection:"column",flex:1}}>
            <h3 style={S.prodName}>{esc(p.name)}</h3>
            <p style={S.prodDesc}>{esc(p.desc)}</p>
            <div style={{...S.priceRow,marginTop:"auto"}}><span style={S.price}>{rupee(p.price)}</span>{p.mrp>p.price && <span style={S.mrp}>{rupee(p.mrp)}</span>}</div>
            <button disabled={out} onClick={()=>onAdd(p.id)} style={{...S.addBtn,...(out?S.addBtnDisabled:{})}}>{out?"Sold out":"Add to cart"}</button>
          </div>
        </article>); })}
    </div>
    )}
  </main></>);
}

function QuickView({product,onClose,onAdd}){ const out=product.stock<=0; return (
  <Overlay onClose={onClose}><div style={{...S.modal,maxWidth:720,padding:0,overflow:"hidden"}}>
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:320}}>
      <img src={product.img} alt={esc(product.name)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
      <div style={{padding:28}}>
        <h2 style={{...S.prodName,fontSize:22,marginBottom:8}}>{esc(product.name)}</h2>
        <div style={S.priceRow}><span style={{...S.price,fontSize:22}}>{rupee(product.price)}</span>{product.mrp>product.price && <span style={S.mrp}>{rupee(product.mrp)}</span>}</div>
        <p style={{...S.prodDesc,marginTop:12,fontSize:14,lineHeight:1.6}}>{esc(product.desc)}</p>
        <p style={{fontFamily:"var(--mono)",fontSize:12,color:out?T.danger:T.teal,marginTop:14}}>{out?"Out of stock":"In stock · "+product.stock+" available"}</p>
        <button disabled={out} onClick={onAdd} style={{...S.addBtn,...(out?S.addBtnDisabled:{}),marginTop:18}}>{out?"Unavailable":"Add to cart"}</button>
      </div>
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
    if(f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email="Invalid email";
    if(!f.line1.trim()) e.line1="Required";
    if(!f.city.trim()) e.city="Required";
    if(!/^\d{6}$/.test(f.pincode)) e.pincode="6-digit pincode";
    setErr(e); if(Object.keys(e).length===0) onPlace(f);
  };
  return (<Overlay onClose={paying?()=>{}:onBack}><div style={{...S.modal,maxWidth:760}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <h2 style={S.modalTitle}>Delivery details</h2><button onClick={onBack} style={S.linkBtn}>← Back</button>
    </div>
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:28}}>
      <div>
        <Field label="Full name" err={err.name}><input style={S.input} value={f.name} onChange={up("name")} maxLength={80} /></Field>
        <div style={S.two}><Field label="Mobile number" err={err.phone}><input style={S.input} value={f.phone} onChange={up("phone")} maxLength={10} inputMode="numeric" placeholder="10 digits" /></Field><Field label="Email (optional)" err={err.email}><input style={S.input} value={f.email} onChange={up("email")} maxLength={120} /></Field></div>
        <Field label="Address line 1" err={err.line1}><input style={S.input} value={f.line1} onChange={up("line1")} maxLength={120} placeholder="House / flat, street" /></Field>
        <Field label="Address line 2"><input style={S.input} value={f.line2} onChange={up("line2")} maxLength={120} placeholder="Area, landmark" /></Field>
        <div style={S.two}><Field label="City" err={err.city}><input style={S.input} value={f.city} onChange={up("city")} maxLength={60} /></Field><Field label="Pincode" err={err.pincode}><input style={S.input} value={f.pincode} onChange={up("pincode")} maxLength={6} inputMode="numeric" placeholder="6 digits" /></Field></div>
        <Field label="State"><select style={S.input} value={f.state} onChange={up("state")}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="How would you like to pay?"><div className="vg-pay" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Online","Pay online","UPI · Cards · Netbanking"],["COD","Cash on Delivery","Pay when it arrives"]].map(([val,title,sub])=>(<button key={val} type="button" onClick={()=>setF({...f,pay:val})} style={{...S.payOpt,...(f.pay===val?S.payOptOn:{})}}><span style={{...S.payRadio,...(f.pay===val?S.payRadioOn:{})}}>{f.pay===val?"✓":""}</span><span style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}><span style={S.payTitle}>{title}</span><span style={S.paySub}>{sub}</span></span></button>))}</div></Field>
      </div>
      <div style={S.summary}>
        <h3 style={S.summaryTitle}>Order summary</h3>
        {items.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",color:T.inkSoft}}><span>{esc(i.name)} × {i.qty}</span><span>{rupee(i.price*i.qty)}</span></div>)}
        <div style={{height:1,background:T.line,margin:"10px 0"}} />
        <Row label="Subtotal" value={rupee(subtotal)} /><Row label="Shipping" value={shipping===0?"Free":rupee(shipping)} /><Row label="Total" value={rupee(total)} bold />
        <button onClick={submit} disabled={paying} style={{...S.primaryBtn,marginTop:16,...(paying?S.addBtnDisabled:{})}}>{paying?"Opening payment…":(f.pay==="COD"?"Place order · "+rupee(total):"Pay "+rupee(total))}</button>
        <p style={{fontSize:11,color:T.muted,marginTop:10,lineHeight:1.5}}>Online payments are processed securely by Razorpay. Your card details never touch this site.</p>
      </div>
    </div>
  </div></Overlay>);
}
function Field({label,err,children}){ return <label style={{display:"block",marginBottom:12}}><span style={S.fieldLabel}>{label}{err && <span style={{color:T.danger,marginLeft:6}}>· {err}</span>}</span>{children}</label>; }

function Confirmation({order,onClose}){ const steps=["Placed","Packed","Shipped","Delivered"]; return (
  <Overlay onClose={onClose}><div style={{...S.modal,maxWidth:560,textAlign:"center"}}>
    <div style={S.checkCircle}>✓</div>
    <h2 style={{...S.modalTitle,marginTop:14}}>Order placed</h2>
    <p style={{color:T.inkSoft,marginTop:4}}>Order <strong style={{fontFamily:"var(--mono)",color:T.ink}}>#{order.id}</strong> · {rupee(order.total)} · {order.payment==="COD"?"Cash on delivery":"Paid online"}</p>
    <div style={S.stepper}>{steps.map((s,idx)=>(<React.Fragment key={s}><div style={{textAlign:"center"}}><div style={{...S.stepDot,background:idx===0?T.teal:T.line,color:idx===0?"#fff":T.muted}}>{idx+1}</div><span style={{fontSize:11,color:idx===0?T.ink:T.muted,fontFamily:"var(--mono)"}}>{s}</span></div>{idx<steps.length-1 && <div style={S.stepLine} />}</React.Fragment>))}</div>
    <p style={{fontSize:13,color:T.inkSoft,marginTop:16}}>Shipping to {esc(order.customer.name)}, {esc(order.customer.city)}, {esc(order.customer.state)} — {esc(order.customer.pincode)}</p>
    <p style={{fontSize:12.5,color:T.muted,marginTop:10,fontFamily:"var(--mono)"}}>Track anytime with order ID <strong style={{color:T.ink}}>#{order.id}</strong> + your phone number, from the “Track order” link up top.</p>
    <button onClick={onClose} style={{...S.primaryBtn,marginTop:20}}>Continue shopping</button>
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
  const steps=["Placed","Packed","Shipped","Delivered"];
  const submit=async()=>{
    setErr(""); setRes(null);
    if(!id.trim()||phone.replace(/\D/g,"").length<10){ setErr("Enter your order ID and 10-digit phone number."); return; }
    setBusy(true);
    try{ const r=await fetch(API+"/api/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:id,phone})});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setRes(j); } else { setErr(j.error||"Couldn't find that order."); }
    }catch(e){ setBusy(false); setErr("Something went wrong. Please try again."); }
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
      {res && (<div style={{marginTop:28,background:T.card,border:"1px solid "+T.line,borderRadius:16,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <strong style={{fontFamily:"var(--mono)"}}>#{esc(res.id)}</strong>
          <span style={{color:T.inkSoft,fontSize:13}}>{res.itemCount} item{res.itemCount===1?"":"s"} · {rupee(res.total)}</span>
        </div>
        {res.status==="Cancelled"
          ? <p style={{color:T.danger,marginTop:16,fontWeight:600}}>This order was cancelled. Contact us if you need help.</p>
          : <div style={S.stepper}>{steps.map((s,i)=>(<React.Fragment key={s}><div style={{textAlign:"center"}}><div style={{...S.stepDot,background:i<=idx?T.teal:T.line,color:i<=idx?"#fff":T.muted}}>{i<=idx?"✓":i+1}</div><span style={{fontSize:11,color:i<=idx?T.ink:T.muted,fontFamily:"var(--mono)"}}>{s}</span></div>{i<steps.length-1 && <div style={{...S.stepLine,background:i<idx?T.teal:T.line}} />}</React.Fragment>))}</div>}
        {res.trackingUrl && <a href={res.trackingUrl} target="_blank" rel="noopener noreferrer" style={{...S.primaryBtn,display:"inline-block",textAlign:"center",textDecoration:"none",marginTop:18,padding:"11px 22px"}}>Track shipment{res.trackingCarrier?` · ${esc(res.trackingCarrier)}`:""}</a>}
        <p style={{fontSize:12,color:T.muted,marginTop:14,fontFamily:"var(--mono)"}}>Updated {new Date(res.updatedAt).toLocaleString("en-IN")}</p>
      </div>)}
    </section>
  </main>);
}

function AdminOrders({onBack}){
  const [key,setKey]=useState(""); const [authed,setAuthed]=useState(false);
  const [orders,setOrders]=useState([]); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const load=async(k)=>{ setErr(""); setBusy(true);
    try{ const r=await fetch(API+"/api/admin/orders",{headers:{"x-admin-key":k}});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setOrders(j.orders||[]); setAuthed(true); } else { setErr(j.error||"Could not load orders."); setAuthed(false); }
    }catch(e){ setBusy(false); setErr("Something went wrong. Please try again."); }
  };
  return (<main style={{...S.main,maxWidth:840}}>
    <section style={{padding:"40px 0 8px"}}>
      <button onClick={onBack} style={S.linkBtn}>← Back to store</button>
      <h1 style={{fontFamily:"var(--display)",fontSize:32,fontWeight:700,letterSpacing:"-.02em",margin:"14px 0 6px"}}>Manage orders</h1>
      {!authed ? (
        <div style={{display:"grid",gap:12,maxWidth:360,marginTop:12}}>
          <p style={{color:T.inkSoft,fontSize:14}}>Enter your admin key to view and update orders.</p>
          <input style={S.input} type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Admin key" />
          <button onClick={()=>load(key)} disabled={busy} style={{...S.primaryBtn,...(busy?S.addBtnDisabled:{})}}>{busy?"Checking…":"Open"}</button>
          {err && <p style={{color:T.danger,fontSize:13}}>{err}</p>}
        </div>
      ) : (
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{color:T.inkSoft,fontSize:13}}>{orders.length} order{orders.length===1?"":"s"}</span><button onClick={()=>load(key)} style={S.linkBtn}>Refresh</button></div>
          {orders.length===0 && <p style={{color:T.muted}}>No orders yet.</p>}
          <div style={{display:"grid",gap:12}}>{orders.map(o=><AdminRow key={o.id} o={o} adminKey={key} onSaved={()=>load(key)} />)}</div>
        </div>
      )}
    </section>
  </main>);
}
function AdminRow({o,adminKey,onSaved}){
  const [status,setStatus]=useState(o.status||"Placed");
  const [carrier,setCarrier]=useState(o.tracking_carrier||"");
  const [url,setUrl]=useState(o.tracking_url||"");
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState("");
  const save=async()=>{ setSaving(true); setMsg("");
    try{ const r=await fetch(API+"/api/admin/update",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({orderId:o.id,status,trackingCarrier:carrier,trackingUrl:url})});
      const j=await r.json(); setSaving(false);
      if(r.ok){ setMsg("Saved ✓"); onSaved&&onSaved(); } else { setMsg(j.error||"Failed"); }
    }catch(e){ setSaving(false); setMsg("Failed"); }
  };
  return (<div style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
      <strong style={{fontFamily:"var(--mono)",fontSize:13}}>#{esc(o.id)}</strong>
      <span style={{fontSize:13,color:T.inkSoft}}>{esc(o.name)} · {esc(o.city)}, {esc(o.state)} · {rupee(o.total)} · {o.paid?"Paid":"COD"}</span>
    </div>
    <div className="vg-admin" style={{display:"grid",gridTemplateColumns:"150px 1fr 1fr auto",gap:10,marginTop:12,alignItems:"center"}}>
      <select style={S.input} value={status} onChange={e=>setStatus(e.target.value)}>{["Placed","Packed","Shipped","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select>
      <input style={S.input} value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="Carrier (e.g. Delhivery)" />
      <input style={S.input} value={url} onChange={e=>setUrl(e.target.value)} placeholder="Tracking link (optional)" />
      <button onClick={save} disabled={saving} style={{...S.addBtn,width:"auto",marginTop:0,padding:"10px 18px"}}>{saving?"…":"Save"}</button>
    </div>
    {msg && <p style={{fontSize:12,color:msg.indexOf("Saved")===0?T.teal:T.danger,marginTop:8,fontFamily:"var(--mono)"}}>{msg}</p>}
  </div>);
}

function Footer({storeName,onNav}){
  const links=[["Track order","track"],["Terms","terms"],["Privacy","privacy"],["Refund","refund"],["Shipping","shipping"],["Contact","contact"],["Seller","admin"]];
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
  mark:{color:T.marigold,fontSize:18}, wordmark:{fontFamily:"var(--display)",fontWeight:700,fontSize:22,letterSpacing:"-.01em",color:T.paper}, tagline:{fontFamily:"var(--mono)",fontSize:11,color:"#9a9286",textTransform:"uppercase",letterSpacing:".08em"},
  trackLink:{border:"none",background:"transparent",color:T.paper,fontWeight:600,fontSize:13,padding:"6px 4px"},
  cartBtn:{position:"relative",border:"none",background:T.marigold,color:"#fff",borderRadius:999,padding:"8px 18px",fontSize:13,fontWeight:700}, cartBadge:{position:"absolute",top:-6,right:-6,background:T.ink,color:"#fff",borderRadius:999,fontSize:11,minWidth:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 4px"},
  main:{maxWidth:1100,margin:"0 auto",padding:"0 22px 60px"}, hero:{padding:"38px 0 18px",maxWidth:660}, eyebrow:{fontFamily:"var(--mono)",fontSize:12,color:T.teal,textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}, heroH1:{fontFamily:"var(--display)",fontSize:"clamp(30px,5vw,50px)",lineHeight:1.04,fontWeight:700,letterSpacing:"-.02em",margin:0}, heroSub:{fontSize:15.5,color:T.inkSoft,marginTop:16,maxWidth:460,lineHeight:1.5},
  heroWrap:{position:"relative",width:"100%",minHeight:"clamp(440px,76vh,640px)",display:"flex",alignItems:"center",overflow:"hidden",background:"#161310"},
  heroCanvas:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"},
  heroOverlay:{position:"absolute",inset:0,background:"radial-gradient(120% 90% at 50% 28%, rgba(22,19,16,0) 35%, rgba(22,19,16,.5) 100%)",pointerEvents:"none"},
  heroContent:{position:"relative",zIndex:2,maxWidth:1100,width:"100%",margin:"0 auto",padding:"0 24px"},
  heroEyebrow:{fontFamily:"var(--mono)",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"#F3A23E",margin:"0 0 16px"},
  heroTitle:{fontFamily:"var(--display)",fontWeight:700,fontSize:"clamp(40px,8vw,82px)",lineHeight:.98,letterSpacing:"-.025em",color:"#FBFAF6",margin:0,textShadow:"0 2px 40px rgba(0,0,0,.45)"},
  heroAccent:{background:"linear-gradient(90deg,#F3A23E,#E8820C 55%,#27B3A3)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",fontStyle:"italic"},
  heroLede:{color:"rgba(251,250,246,.74)",fontSize:"clamp(15px,1.6vw,18px)",lineHeight:1.55,maxWidth:520,margin:"22px 0 30px"},
  heroBtns:{display:"flex",gap:12,flexWrap:"wrap"},
  heroPrimary:{border:"none",background:"#E8820C",color:"#fff",fontWeight:700,fontSize:15,borderRadius:999,padding:"13px 26px",boxShadow:"0 10px 30px rgba(232,130,12,.35)"},
  heroGhost:{border:"1.5px solid rgba(251,250,246,.3)",background:"rgba(251,250,246,.04)",color:"#FBFAF6",fontWeight:600,fontSize:15,borderRadius:999,padding:"13px 24px"},
  heroScroll:{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:2,border:"1px solid rgba(251,250,246,.25)",background:"rgba(251,250,246,.06)",color:"#FBFAF6",borderRadius:999,width:38,height:38,fontSize:16},
  trustBar:{display:"flex",flexWrap:"wrap",gap:"8px 18px",alignItems:"center",padding:"12px 16px",background:T.tint,border:"1px solid "+T.line,borderRadius:12,marginBottom:22},
  trustItem:{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"var(--mono)",fontSize:12,color:T.inkSoft}, trustIcon:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:6,background:T.card,color:T.marigoldDark,fontSize:11.5,fontWeight:700},
  toolbar:{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap"}, searchWrap:{position:"relative",flex:"1 1 260px",display:"flex",alignItems:"center"}, searchIcon:{position:"absolute",left:14,fontSize:18,color:T.muted,pointerEvents:"none"}, searchInput:{width:"100%",border:"1px solid "+T.line,borderRadius:999,padding:"11px 38px",fontSize:14.5,background:T.card,color:T.ink,fontFamily:"var(--body)"}, searchClear:{position:"absolute",right:12,border:"none",background:"transparent",color:T.muted,fontSize:13},
  sortWrap:{display:"inline-flex",alignItems:"center",gap:8}, sortLabel:{fontFamily:"var(--mono)",fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:".06em"}, sortSelect:{border:"1px solid "+T.line,borderRadius:999,padding:"9px 14px",fontSize:13.5,background:T.card,color:T.ink,fontFamily:"var(--body)",fontWeight:600},
  chipsRow:{display:"flex",gap:9,marginBottom:14,overflowX:"auto",paddingBottom:4}, chip:{flex:"0 0 auto",border:"1.5px solid "+T.line,background:T.card,color:T.inkSoft,borderRadius:999,padding:"8px 16px",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}, chipOn:{borderColor:T.ink,background:T.ink,color:T.paper},
  countText:{fontFamily:"var(--mono)",fontSize:12,color:T.muted,margin:"0 0 16px"}, empty:{textAlign:"center",padding:"60px 20px",border:"1px dashed "+T.line,borderRadius:16,background:T.card}, catTag:{position:"absolute",bottom:10,left:10,background:"rgba(251,250,246,.92)",color:T.inkSoft,fontSize:10.5,fontWeight:700,padding:"3px 8px",borderRadius:999,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:20}, prodCard:{background:T.card,border:"1px solid "+T.line,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}, imgWrap:{border:"none",padding:0,background:"#F2EEE5",position:"relative",aspectRatio:"4/3",overflow:"hidden",display:"block"}, img:{width:"100%",height:"100%",objectFit:"cover",display:"block"}, soldOut:{position:"absolute",inset:0,background:"rgba(25,21,16,.55)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontFamily:"var(--mono)",fontSize:13}, discount:{position:"absolute",top:10,left:10,background:T.teal,color:"#fff",fontSize:11,fontWeight:700,padding:"4px 9px",borderRadius:999,fontFamily:"var(--mono)"},
  prodName:{fontFamily:"var(--display)",fontSize:17,fontWeight:600,margin:0,lineHeight:1.2}, prodDesc:{fontSize:12.5,color:T.inkSoft,marginTop:6,lineHeight:1.45,minHeight:36}, priceRow:{display:"flex",alignItems:"baseline",gap:8,marginTop:10}, price:{fontSize:18,fontWeight:800,color:T.ink}, mrp:{fontSize:13,color:T.muted,textDecoration:"line-through"},
  addBtn:{width:"100%",marginTop:12,border:"1.5px solid "+T.ink,background:T.ink,color:T.paper,borderRadius:10,padding:"10px",fontWeight:700,fontSize:13.5}, addBtnDisabled:{background:"transparent",color:T.muted,borderColor:T.line,cursor:"not-allowed"},
  drawerScrim:{position:"fixed",inset:0,background:"rgba(25,21,16,.4)",zIndex:50,display:"flex",justifyContent:"flex-end"}, drawer:{width:"min(420px,100%)",background:T.paper,height:"100%",display:"flex",flexDirection:"column",boxShadow:"-20px 0 60px rgba(0,0,0,.18)"}, drawerHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid "+T.line}, drawerTitle:{fontFamily:"var(--display)",fontSize:20,margin:0}, xBtn:{border:"none",background:"transparent",fontSize:18,color:T.inkSoft},
  cartRow:{display:"flex",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.line}, cartThumb:{width:60,height:60,borderRadius:10,objectFit:"cover",background:"#eee"}, cartName:{fontSize:14,fontWeight:600,margin:0}, cartPrice:{fontSize:13,color:T.inkSoft,marginTop:2}, qtyRow:{display:"flex",alignItems:"center",gap:8,marginTop:8}, qtyBtn:{width:26,height:26,borderRadius:7,border:"1px solid "+T.line,background:T.card,fontSize:15,lineHeight:1}, qtyNum:{minWidth:18,textAlign:"center",fontWeight:600,fontSize:14}, cartLine:{fontWeight:700,fontSize:14}, drawerFoot:{padding:20,borderTop:"1px solid "+T.line,background:T.card},
  overlay:{position:"fixed",inset:0,background:"rgba(25,21,16,.45)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}, modal:{background:T.paper,borderRadius:18,padding:28,width:"100%",boxShadow:"0 30px 80px rgba(0,0,0,.25)"}, modalTitle:{fontFamily:"var(--display)",fontSize:24,margin:0}, linkBtn:{border:"none",background:"transparent",color:T.teal,fontWeight:600,fontSize:13},
  fieldLabel:{display:"block",fontSize:12,fontWeight:600,color:T.inkSoft,marginBottom:5,fontFamily:"var(--mono)",letterSpacing:".02em"}, input:{width:"100%",border:"1px solid "+T.line,borderRadius:9,padding:"9px 11px",fontSize:14,background:T.card,color:T.ink,fontFamily:"var(--body)"}, two:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}, payChip:{border:"1.5px solid "+T.line,background:T.card,borderRadius:9,padding:"9px 14px",fontSize:12.5,fontWeight:600,color:T.inkSoft}, payChipOn:{borderColor:T.teal,color:T.teal,background:"#EAF4F2"},
  payOpt:{display:"flex",alignItems:"center",gap:10,textAlign:"left",border:"1.5px solid "+T.line,background:T.card,borderRadius:12,padding:"12px 14px",color:T.ink}, payOptOn:{borderColor:T.teal,background:"#EAF4F2"}, payRadio:{flex:"0 0 auto",width:20,height:20,borderRadius:999,border:"2px solid "+T.line,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}, payRadioOn:{borderColor:T.teal,background:T.teal}, payTitle:{fontSize:14,fontWeight:700,color:T.ink}, paySub:{fontSize:11.5,color:T.inkSoft,marginTop:2,fontFamily:"var(--mono)"}, summary:{background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:20,alignSelf:"start"}, summaryTitle:{fontFamily:"var(--display)",fontSize:16,margin:"0 0 12px"}, primaryBtn:{width:"100%",border:"none",background:T.marigold,color:"#fff",borderRadius:11,padding:"12px",fontWeight:700,fontSize:14.5},
  checkCircle:{width:56,height:56,borderRadius:999,background:T.teal,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto"}, stepper:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:22}, stepDot:{width:30,height:30,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,margin:"0 auto 5px"}, stepLine:{width:34,height:2,background:T.line,marginBottom:18},
  footer:{maxWidth:1100,margin:"0 auto",padding:"26px 22px 50px",display:"block",borderTop:"1px solid "+T.line,fontSize:12.5,color:T.inkSoft,fontFamily:"var(--mono)"}, footLink:{border:"none",background:"transparent",color:T.inkSoft,fontFamily:"var(--mono)",fontSize:12.5,padding:0,textDecoration:"underline",textUnderlineOffset:"3px"} };

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
