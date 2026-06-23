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
  { id:"p10", name:"Oversized Graphic Tee — Drop 01", price:699, mrp:1299, stock:100, category:"Clothing", img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", desc:"240 GSM oversized cotton tee, DTF print. Unisex.", sizes:"S,M,L,XL,XXL" },
  { id:"p11", name:"Heavyweight Hoodie — Night Edition", price:1199, mrp:2199, stock:100, category:"Clothing", img:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80", desc:"320 GSM fleece hoodie, soft brushed inside. Unisex.", sizes:"S,M,L,XL,XXL" },
  { id:"custom-tee", name:"Custom Photo T-Shirt", price:799, mrp:1299, stock:100, category:"Custom", img:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80", desc:"Your photo, printed on a premium cotton tee. Upload an image, pick a size — we design it and ship it to you. Prepaid only.", sizes:"S,M,L,XL,XXL", custom:true },
];
const rupee = (n) => "₹" + Number(n||0).toLocaleString("en-IN");
const COD_FEE = 0; // Cash-on-Delivery fee (must match server COD_FEE). 0 = disabled.
const COD_MAX = 2000; // Cash on Delivery is only allowed for orders up to this total (₹). Must match server.
const esc = (s) => String(s==null?"":s);
const parseSizes = (s) => (typeof s==="string" ? s.split(",").map(x=>x.trim()).filter(Boolean) : (Array.isArray(s) ? s.filter(Boolean) : []));
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
  instagram: "https://instagram.com/shopvectorgrid",  // your Instagram profile
  instagramHandle: "@shopvectorgrid",       // shown as the handle
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
    `A refund or return is available only if the product arrives damaged or defective, or the wrong item was sent because of a mistake on our side. In that case, email us within ${INFO.returnWindow} of delivery with a clear photo or a short unboxing video.`,
    `If your issue qualifies, you choose one of two options: (1) return the item for a refund, or (2) get a replacement of the same item (subject to availability). If you choose a refund, the amount is processed once the returned item has been received back at our end. This applies to prepaid orders as well.`,
    `Returns for any other reason are not automatically accepted and may be rejected. If you have a genuine reason (for example a sizing issue), email us within ${INFO.returnWindow} with a clear explanation and we will review your request case by case. If it is approved, we will confirm any return shipping cost or deduction before you send the item back. Requests without a valid reason, or made after the ${INFO.returnWindow} window, cannot be accepted.`,
    `For clothing, please check the size chart on the product page before ordering — size-related returns are reviewed case by case, so choosing the right size first avoids disappointment.`,
    `Approved refunds are processed to your original payment method within ${INFO.refundDays}. The exact time the amount reflects depends on your bank.`,
    "Certain items may be non-returnable for hygiene or safety reasons; this will be noted on the product where applicable.",
    `For any refund, return, or cancellation request, email ${INFO.email} with your order number and photos where relevant.`,
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
    `Instagram: ${INFO.instagramHandle} (${INFO.instagram})`,
    `Address: ${INFO.address}`,
    "We aim to respond to all queries within 1–2 business days. Follow us on Instagram for new drops and offers.",
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
  const [customDesigns,setCustomDesigns]=useState({});
  const [cartOpen,setCartOpen]=useState(false);
  const [checkout,setCheckout]=useState(false);
  const [confirmed,setConfirmed]=useState(null);
  const [quick,setQuick]=useState(null);
  const [paying,setPaying]=useState(false);
  const [page,setPage]=useState(null);
  const go=(p)=>{ setPage(p); window.scrollTo(0,0); };
  const PAGES=["track","help","admin","about","terms","privacy","refund","shipping","contact"];
  const navReady=React.useRef(false); const navPop=React.useRef(false); const navDepth=React.useRef(0);
  const navBack=()=>{ if(navDepth.current>0){ window.history.back(); } else { setPage(null); setQuick(null); window.scrollTo(0,0); } };

  useEffect(()=>{
    let pid=null, pg=null;
    try{ const sp=new URLSearchParams(window.location.search); pid=sp.get("p"); pg=sp.get("page"); }catch(e){}
    if(pg && PAGES.includes(pg)) setPage(pg);
    (async()=>{
      let cat=SEED;
      try{ const r=await fetch(API+"/api/products"); if(r.ok){ const j=await r.json(); if(Array.isArray(j)&&j.length) cat=j; } }catch(e){}
      setProducts(cat); setLoading(false);
      if(pid){ const found=cat.find(x=>String(x.id)===String(pid)); if(found) setQuick(found); }
    })();
  },[]);

  // Reflect the current page + open product in the URL so the browser Back/Forward buttons work,
  // and so a product link stays shareable. User navigations push a history entry; Back pops it. No reload.
  useEffect(()=>{
    if(navPop.current){ navPop.current=false; return; }
    try{
      const u=new URL(window.location.href);
      u.searchParams.delete("page"); u.searchParams.delete("p");
      if(page) u.searchParams.set("page",page);
      if(quick) u.searchParams.set("p",quick.id);
      const target=u.pathname+u.search; const current=window.location.pathname+window.location.search;
      if(target===current){ navReady.current=true; return; }
      if(!navReady.current){ window.history.replaceState({d:navDepth.current},"",target); navReady.current=true; }
      else { navDepth.current+=1; window.history.pushState({d:navDepth.current},"",target); }
    }catch(e){}
  },[page,quick]);

  // Browser Back/Forward (or our back shortcut) → restore page + product from the URL, no reload.
  useEffect(()=>{
    const onPop=(ev)=>{
      navPop.current=true;
      navDepth.current=(ev.state&&typeof ev.state.d==="number")?ev.state.d:0;
      try{
        const sp=new URLSearchParams(window.location.search);
        const pg=sp.get("page"); const pid=sp.get("p");
        setPage(pg&&PAGES.includes(pg)?pg:null);
        setQuick(pid?(products.find(x=>String(x.id)===String(pid))||null):null);
        window.scrollTo(0,0);
      }catch(e){ setPage(null); setQuick(null); }
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[products]);

  const addToCart=(id,size,design)=>{ const p=products.find(x=>x.id===id); if(!p) return; const max=(p.stock!=null&&p.stock>0)?Math.min(50,p.stock):(p.stock===0?0:50); if(max<=0) return;
    let key = size ? id+"::"+size : id;
    if(design){ const rid=Math.random().toString(36).slice(2,9); key=id+"::"+(size||"")+"::"+rid; setCustomDesigns(d=>({...d,[key]:design})); }
    setCart(c=>({...c,[key]:Math.min(max,(c[key]||0)+1)})); setCartOpen(true); };
  const setQty=(key,q)=>{ setCart(c=>{ const n={...c}; if(q<=0) delete n[key]; else n[key]=Math.min(50,q); return n; }); if(q<=0) setCustomDesigns(d=>{ if(!(key in d)) return d; const n={...d}; delete n[key]; return n; }); };
  const cartItems=useMemo(()=>Object.entries(cart).map(([key,qty])=>{ const parts=key.split("::"); const id=parts[0]; const size=parts[1]||""; const p=products.find(pp=>pp.id===id); if(!p) return null; const design=customDesigns[key]||null; return {...p,qty,size,key,design}; }).filter(Boolean),[cart,products,customDesigns]);
  const cartCount=cartItems.reduce((s,i)=>s+i.qty,0);
  const subtotal=cartItems.reduce((s,i)=>s+i.qty*i.price,0);
  const shipping=subtotal===0?0:(subtotal>=999?0:49);
  const total=subtotal+shipping;

  const finishOrder=(form,paymentLabel,amount,orderId,codFee)=>{
    setConfirmed({ id:orderId||("VG"+Date.now().toString().slice(-8)), total:amount, payment:paymentLabel, customer:form, items:cartItems, subtotal, shipping, codFee:codFee||0 });
    setCart({}); setCustomDesigns({}); setCheckout(false); setCartOpen(false);
  };

  const handlePlace=async(form)=>{
    const items=cartItems.map(i=>({id:i.id,qty:i.qty,size:i.size||"",...(i.design?{design:i.design}:{})}));
    const itemsLite=cartItems.map(i=>({id:i.id,qty:i.qty,size:i.size||""}));
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
      const res=await fetch(API+"/api/create-order",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ items:itemsLite }) });
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
      {page==="track" ? <TrackOrder onBack={navBack} />
        : page==="help" ? <HelpCenter onBack={navBack} />
        : page==="admin" ? <AdminOrders onBack={navBack} />
        : page ? <Policy pageKey={page} onBack={navBack} />
        : <Store products={products} onAdd={addToCart} onQuick={setQuick} onTrack={()=>go("track")} />}
      <Footer storeName={storeName} onNav={go} />
      {cartOpen && !checkout && <CartDrawer items={cartItems} subtotal={subtotal} shipping={shipping} total={total} setQty={setQty} onClose={()=>setCartOpen(false)} onCheckout={()=>{ if(cartItems.length) setCheckout(true); }} />}
      {checkout && <Checkout items={cartItems} total={total} shipping={shipping} subtotal={subtotal} paying={paying} onBack={()=>{ if(!paying) setCheckout(false); }} onPlace={handlePlace} />}
      {confirmed && <Confirmation order={confirmed} onClose={()=>setConfirmed(null)} />}
      {quick && <QuickView key={quick.id} product={quick} onClose={navBack} onAdd={(size,design)=>{ addToCart(quick.id,size,design); navBack(); }} />}
    </div>
  );
}

function Header({storeName,cartCount,onCart,onHome,onTrack}){
  const [bounce,setBounce]=useState(false); const prev=React.useRef(cartCount);
  useEffect(()=>{ if(cartCount>prev.current){ setBounce(true); const t=setTimeout(()=>setBounce(false),520); prev.current=cartCount; return ()=>clearTimeout(t); } prev.current=cartCount; },[cartCount]);
  return (<header style={S.header}><div style={S.headerInner}>
    <div onClick={onHome} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}><img src="/vectorgrid-mark.svg" alt="Vector Grid" width="34" height="34" style={{display:"block"}} /><span style={S.wordmark}>{storeName}</span><span style={S.tagline} className="vg-tagline">ships pan-India</span></div>
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
    const isMobile = (window.matchMedia && window.matchMedia("(max-width:760px)").matches) || (window.matchMedia && window.matchMedia("(hover: none)").matches);
    const COLORS=["#E8820C","#F3A23E","#27B3A3"];
    let pts=[];
    function size(){ const r=cv.getBoundingClientRect(); w=r.width; h=r.height; cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=isMobile ? Math.max(14,Math.min(24,Math.round(w/22))) : Math.max(28,Math.min(70,Math.round(w/16)));
      pts=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.8+.6,c:COLORS[(Math.random()*COLORS.length)|0]}));
    }
    function orb(cx,cy,rad,col,a){ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad); g.addColorStop(0,col+a); g.addColorStop(1,"#00000000"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
    function frame(){ t+=0.004;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle="#161310"; ctx.fillRect(0,0,w,h);
      orb(w*(0.30+Math.sin(t)*0.05), h*(0.42+Math.cos(t*0.8)*0.06), Math.max(w,h)*0.45, "#E8820C","2e");
      orb(w*(0.74+Math.cos(t*0.7)*0.05), h*(0.62+Math.sin(t)*0.05), Math.max(w,h)*0.40, "#27B3A3","26");
      for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w)p.vx*=-1; if(p.y<0||p.y>h)p.vy*=-1; }
      if(!isMobile){ for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const a=pts[i],b=pts[j]; const dx=a.x-b.x,dy=a.y-b.y; const d=dx*dx+dy*dy; if(d<11000){ ctx.strokeStyle="rgba(243,162,62,"+(0.10*(1-d/11000))+")"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } } }
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
          {["FREE SHIPPING OVER ₹999","✦","CASH ON DELIVERY","✦","7-DAY RETURNS ON FAULTY ITEMS","✦","SHIPS TO EVERY PINCODE","✦","SECURE RAZORPAY CHECKOUT","✦","HANDPICKED GOODS","✦"].map((t,i)=>(<span key={i} style={{padding:"0 18px",fontFamily:"var(--mono)",fontWeight:700,fontSize:13,letterSpacing:".08em",color:t==="✦"?"#13100D":"#13100D"}}>{t}</span>))}
        </span>))}
      </div>
    </div>
    <main style={S.main} id="shop">
    <div style={S.featRow} className="vg-feat">
      {[["🚚","Fast pan-India","Dispatched in 24–48h"],["💸","COD available","Pay when it lands"],["↩️","7-day returns","On damaged or faulty items"],["🔒","100% secure","Razorpay protected"]].map(([i,t,s])=>(
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
            {!out && p.stock>0 && p.stock<10 && <p style={{fontSize:11.5,color:T.marigold,fontFamily:"var(--mono)",fontWeight:700,margin:"6px 0 0",letterSpacing:".02em"}}>🔥 Only {p.stock} left!</p>}
            {(parseSizes(p.sizes).length>0 || p.custom)
              ? <button onClick={()=>onQuick(p)} disabled={out} style={{...S.addBtn,marginTop:18,...(out?S.addBtnDisabled:{})}}>{out?"Sold out":(p.custom?"Customize →":"Select size")}</button>
              : <AddButton onAdd={()=>onAdd(p.id)} out={out} />}
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
          {[["📦","Every pincode","We ship across all of India"],["🤝","Real humans","A person replies to every query"],["🔄","Easy returns","7-day return on faulty items"]].map(([i,t,s])=>(
            <div key={t} style={S.aboutStat}><span style={{fontSize:26}}>{i}</span><div style={{fontWeight:700,color:T.ink,marginTop:8,fontSize:15}}>{t}</div><div style={{fontSize:12.5,color:T.inkSoft,marginTop:3}}>{s}</div></div>
          ))}
        </div>
      </div>
    </section>
  </main></>);
}

function SizeChart({onClose}){
  const [tab,setTab]=useState("tee");
  const data={
    tee:[["S",38,27],["M",40,28],["L",42,29],["XL",44,30],["XXL",46,31]],
    over:[["S",42,27],["M",44,28],["L",46,29],["XL",48,30],["XXL",50,31]],
    hood:[["S",40,26],["M",42,27],["L",44,28],["XL",46,29],["XXL",48,30]],
  };
  const tabs=[["tee","Regular tee"],["over","Oversized"],["hood","Hoodie"]];
  return (<Overlay onClose={onClose}><div style={{...S.modal,maxWidth:460}} className="vg-modal">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={S.modalTitle}>Size guide</h2><button onClick={onClose} style={S.linkBtn}>✕ Close</button>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {tabs.map(([k,l])=>(<button key={k} onClick={()=>setTab(k)} style={{padding:"7px 13px",borderRadius:999,fontWeight:700,fontSize:13,cursor:"pointer",border:"1px solid "+(tab===k?T.marigold:T.line),background:tab===k?T.marigold:"transparent",color:tab===k?"#13100D":T.ink}}>{l}</button>))}
    </div>
    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"var(--mono)",fontSize:14}}>
      <thead><tr>{["Size","Chest (in)","Length (in)"].map(h=>(<th key={h} style={{textAlign:h==="Size"?"left":"center",padding:"9px 10px",borderBottom:"1px solid "+T.line,color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:".05em"}}>{h}</th>))}</tr></thead>
      <tbody>{data[tab].map(r=>(<tr key={r[0]}><td style={{padding:"9px 10px",fontWeight:700,color:T.ink,borderBottom:"1px solid "+T.line}}>{r[0]}</td><td style={{padding:"9px 10px",textAlign:"center",color:T.inkSoft,borderBottom:"1px solid "+T.line}}>{r[1]}</td><td style={{padding:"9px 10px",textAlign:"center",color:T.inkSoft,borderBottom:"1px solid "+T.line}}>{r[2]}</td></tr>))}</tbody>
    </table>
    <p style={{fontSize:12,color:T.muted,marginTop:14,lineHeight:1.6}}><b style={{color:T.inkSoft}}>How to measure:</b> Chest — across the front armpit to armpit, ×2. Length — shoulder down to hem.</p>
    <p style={{fontSize:11.5,color:T.muted,marginTop:8,lineHeight:1.6,background:T.tint,border:"1px solid "+T.line,borderRadius:10,padding:"10px 12px"}}>Sizes are approximate — measurements can vary by about ±1 inch. If you're between two sizes, we suggest sizing up.</p>
  </div></Overlay>);
}
function QuickView({product,onClose,onAdd}){ const out=product.stock<=0;
  const [reviews,setReviews]=useState(null);
  const [name,setName]=useState(""); const [rating,setRating]=useState(0); const [comment,setComment]=useState("");
  const [posting,setPosting]=useState(false); const [msg,setMsg]=useState(""); const [showForm,setShowForm]=useState(false);
  const [notifyEmail,setNotifyEmail]=useState(""); const [notifyMsg,setNotifyMsg]=useState(""); const [notifying,setNotifying]=useState(false);
  const [shared,setShared]=useState("");
  const opts=parseSizes(product.sizes);
  const [selSize,setSelSize]=useState("");
  const [sizeChartOpen,setSizeChartOpen]=useState(false);
  const [sizeErr,setSizeErr]=useState(false);
  const isCustom=product.custom===true;
  const [customImg,setCustomImg]=useState("");
  const [customNotes,setCustomNotes]=useState("");
  const [imgErr,setImgErr]=useState(false);
  const onPickCustom=(e)=>{ const file=e.target.files&&e.target.files[0]; if(!file) return;
    if(!file.type.startsWith("image/")){ setImgErr(true); return; }
    const reader=new FileReader();
    reader.onload=()=>{ const im=new Image();
      im.onload=()=>{ const max=1500; let w=im.width,h=im.height;
        if(w>h&&w>max){ h=Math.round(h*max/w); w=max; } else if(h>=w&&h>max){ w=Math.round(w*max/h); h=max; }
        const cv=document.createElement("canvas"); cv.width=w; cv.height=h; cv.getContext("2d").drawImage(im,0,0,w,h);
        setCustomImg(cv.toDataURL("image/jpeg",0.85)); setImgErr(false);
      };
      im.onerror=()=>setImgErr(true);
      im.src=reader.result;
    };
    reader.readAsDataURL(file); e.target.value="";
  };
  const shareUrl=(typeof window!=="undefined"?window.location.origin:"https://shopvectorgrid.com")+"/?p="+encodeURIComponent(product.id);
  const doShare=async()=>{
    const data={ title:product.name, text:"Check out "+product.name+" on Vector Grid", url:shareUrl };
    if(navigator.share){ try{ await navigator.share(data); return; }catch(e){ if(e&&e.name==="AbortError") return; } }
    try{ await navigator.clipboard.writeText(shareUrl); }
    catch(e){ const t=document.createElement("textarea"); t.value=shareUrl; document.body.appendChild(t); t.select(); try{document.execCommand("copy");}catch(_){} document.body.removeChild(t); }
    setShared("Link copied!"); setTimeout(()=>setShared(""),1800);
  };
  const notifyMe=async()=>{ setNotifyMsg("");
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(notifyEmail.trim())){ setNotifyMsg("Please enter a valid email."); return; }
    setNotifying(true);
    try{ const r=await fetch(API+"/api/notify-restock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:product.id,email:notifyEmail.trim()})});
      const j=await r.json(); setNotifying(false);
      if(r.ok){ setNotifyMsg("✓ "+(j.message||"We'll email you when it's back!")); setNotifyEmail(""); } else setNotifyMsg(j.error||"Couldn't save that.");
    }catch(e){ setNotifying(false); setNotifyMsg("Something went wrong. Please try again."); }
  };
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
    {sizeChartOpen && <SizeChart onClose={()=>setSizeChartOpen(false)} />}
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:320}}>
      <img src={product.img} alt={esc(product.name)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
      <div style={{padding:28}}>
        <button onClick={onClose} style={S.quickBack}>← Back to products</button>
        <h2 style={{...S.prodName,fontSize:22,margin:"10px 0 8px"}}>{esc(product.name)}</h2>
        {avg && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Stars value={avg} /><span style={{fontSize:12,color:T.muted,fontFamily:"var(--mono)"}}>{avg} · {reviews.length} review{reviews.length===1?"":"s"}</span></div>}
        <div style={S.priceRow}><span style={{...S.price,fontSize:22}}>{rupee(product.price)}</span>{product.mrp>product.price && <span style={S.mrp}>{rupee(product.mrp)}</span>}</div>
        <p style={{...S.prodDesc,marginTop:12,fontSize:14,lineHeight:1.6}}>{esc(product.desc)}</p>
        <p style={{fontFamily:"var(--mono)",fontSize:12,color:out?T.danger:(product.stock<10?T.marigold:T.teal),marginTop:14,fontWeight:product.stock>0&&product.stock<10?700:400}}>{out?"Out of stock":product.stock<10?("🔥 Only "+product.stock+" left — order soon!"):("In stock · "+product.stock+" available")}</p>
        {isCustom && <div style={{marginTop:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:8}}>Upload your photo / design{imgErr&&!customImg?<span style={{color:T.danger,fontWeight:400,marginLeft:6,fontSize:12}}>· please add an image</span>:""}</div>
          <input type="file" accept="image/*" id="vg-custom-up" onChange={onPickCustom} style={{display:"none"}} />
          {!customImg
            ? <label htmlFor="vg-custom-up" style={{display:"block",border:"1.5px dashed "+T.line,borderRadius:12,padding:"22px 14px",textAlign:"center",cursor:"pointer",color:T.inkSoft,fontSize:13}}>📷 Tap to upload your image<br/><span style={{fontSize:11,color:T.muted}}>JPG or PNG — this is what we print on your tee</span></label>
            : <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <img src={customImg} alt="your design" style={{width:72,height:72,objectFit:"cover",borderRadius:10,border:"1px solid "+T.line}} />
                <label htmlFor="vg-custom-up" style={{...S.linkBtn,fontSize:12.5,cursor:"pointer"}}>Change photo</label>
                <button onClick={()=>setCustomImg("")} style={{...S.linkBtn,fontSize:12.5,color:T.danger}}>Remove</button>
              </div>}
          <textarea value={customNotes} onChange={e=>setCustomNotes(e.target.value)} maxLength={500} placeholder="Any instructions? e.g. center the photo, add the name 'Aarav' underneath, plain white background" style={{...S.input,minHeight:60,resize:"vertical",fontFamily:"inherit",marginTop:10}} />
          <p style={{fontSize:11.5,color:T.muted,margin:"8px 0 0",lineHeight:1.5}}>💳 Custom tees are prepaid only. We design your print and ship it to you.</p>
        </div>}
        {opts.length>0 && <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:T.ink}}>Select size{sizeErr&&!selSize?<span style={{color:T.danger,fontWeight:400,marginLeft:6,fontSize:12}}>· please pick one</span>:""}</span>
            <button onClick={()=>setSizeChartOpen(true)} style={{background:"none",border:"none",color:T.marigold,fontSize:12.5,fontWeight:700,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit"}}>📏 Size guide</button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {opts.map(sz=>(<button key={sz} onClick={()=>{setSelSize(sz);setSizeErr(false);}} style={{minWidth:46,padding:"9px 12px",borderRadius:10,fontFamily:"var(--mono)",fontWeight:700,fontSize:14,cursor:"pointer",border:"1.5px solid "+(selSize===sz?T.marigold:T.line),background:selSize===sz?T.marigold:"transparent",color:selSize===sz?"#13100D":T.ink}}>{sz}</button>))}
          </div>
        </div>}
        {(opts.length>0 || isCustom)
          ? <button onClick={()=>{ if(out)return; if(isCustom && !customImg){ setImgErr(true); return; } if(opts.length>0 && !selSize){ setSizeErr(true); return; } onAdd(selSize, isCustom?{image:customImg,notes:customNotes}:null); }} disabled={out} style={{...S.addBtn,marginTop:18,...(out?S.addBtnDisabled:{})}}>{out?"Unavailable":(isCustom?"Add custom tee to cart":"Add to cart")}</button>
          : <AddButton onAdd={onAdd} out={out} full={true} label={{add:"Add to cart",out:"Unavailable"}} />}
        <button onClick={doShare} style={{width:"100%",marginTop:10,padding:"11px 16px",fontSize:14,fontWeight:600,color:T.inkSoft,background:"transparent",border:"1px solid "+T.line,borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{shared?("✓ "+shared):"🔗 Share this product"}</button>
        {out && <div style={{marginTop:14,background:T.tint,border:"1px solid "+T.line,borderRadius:12,padding:14}}>
          <p style={{fontSize:13,color:T.inkSoft,margin:"0 0 10px",lineHeight:1.5}}>📬 Out of stock — get an email the moment it's back:</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input style={{...S.input,flex:1,minWidth:160}} type="email" value={notifyEmail} onChange={e=>setNotifyEmail(e.target.value)} placeholder="you@example.com" />
            <button onClick={notifyMe} disabled={notifying} style={{...S.addBtn,width:"auto",marginTop:0,padding:"9px 16px",fontSize:13}}>{notifying?"…":"Notify me"}</button>
          </div>
          {notifyMsg && <p style={{fontSize:12,margin:"8px 0 0",color:notifyMsg[0]==="✓"?T.teal:T.danger,fontFamily:"var(--mono)"}}>{notifyMsg}</p>}
        </div>}
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
      {items.map(i=>{ const max=(i.stock!=null&&i.stock>0)?Math.min(50,i.stock):50; const atMax=i.qty>=max; return (<div key={i.key} style={S.cartRow}>
        <img src={i.design?i.design.image:i.img} alt="" style={S.cartThumb} />
        <div style={{flex:1}}><p style={S.cartName}>{esc(i.name)}</p>{i.design && <p style={{fontSize:11,color:T.marigold,fontFamily:"var(--mono)",margin:"2px 0 0",fontWeight:700}}>🎨 Custom design</p>}{i.size && <p style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)",margin:"2px 0 0"}}>Size: {esc(i.size)}</p>}<p style={S.cartPrice}>{rupee(i.price)}</p>
          <div style={S.qtyRow}><button onClick={()=>setQty(i.key,i.qty-1)} style={S.qtyBtn} aria-label="Decrease">−</button><span style={S.qtyNum}>{i.qty}</span><button onClick={()=>{ if(!atMax) setQty(i.key,i.qty+1); }} disabled={atMax} style={{...S.qtyBtn,...(atMax?{opacity:.4,cursor:"not-allowed"}:{})}} aria-label="Increase">+</button></div>
          {atMax && i.stock!=null && i.stock>0 && i.stock<50 && <p style={{fontSize:11,color:T.muted,margin:"4px 0 0",fontFamily:"var(--mono)"}}>Only {i.stock} in stock</p>}
        </div><span style={S.cartLine}>{rupee(i.price*i.qty)}</span>
      </div>); })}
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
  const hasCustom = items.some(i=>i.custom || i.design);
  const codAllowed = total <= COD_MAX && !hasCustom;
  useEffect(()=>{ if(!codAllowed && f.pay==="COD") setF(prev=>({...prev,pay:"Online"})); },[codAllowed]);
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
  return (<Overlay onClose={paying?()=>{}:onBack}><div style={{...S.modal,maxWidth:760}} className="vg-modal">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={S.modalTitle}>Delivery details</h2><button onClick={onBack} style={S.linkBtn}>← Back</button>
    </div>
    <div style={S.coTrust}>
      <span style={S.coTrustItem}>🔒 Secure checkout</span>
      <span style={S.coTrustItem}>↩ Returns on faulty items</span>
      <span style={S.coTrustItem}>₹ COD available</span>
      <span style={S.coTrustItem}>✈ Ships pan-India</span>
    </div>
    <div className="vg-two" style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:28}}>
      <div>
        <Field label="Full name" err={err.name}><input style={S.input} value={f.name} onChange={up("name")} maxLength={80} /></Field>
        <div style={S.two} className="vg-pair"><Field label="Mobile number" err={err.phone}><input style={S.input} value={f.phone} onChange={up("phone")} maxLength={10} inputMode="numeric" placeholder="10 digits" /></Field><Field label="Email" err={err.email}><input style={S.input} type="email" value={f.email} onChange={up("email")} maxLength={120} placeholder="you@example.com" /></Field></div>
        <p style={{fontSize:11.5,color:T.muted,margin:"-6px 0 12px",lineHeight:1.5}}>📧 We'll email your order ID and tracking link here, so please enter it correctly.</p>
        <Field label="Address line 1" err={err.line1}><input style={S.input} value={f.line1} onChange={up("line1")} maxLength={120} placeholder="House / flat, street" /></Field>
        <Field label="Address line 2"><input style={S.input} value={f.line2} onChange={up("line2")} maxLength={120} placeholder="Area, landmark" /></Field>
        <div style={S.two} className="vg-pair"><Field label="City" err={err.city}><input style={S.input} value={f.city} onChange={up("city")} maxLength={60} /></Field><Field label="Pincode" err={err.pincode}><input style={S.input} value={f.pincode} onChange={up("pincode")} maxLength={6} inputMode="numeric" placeholder="6 digits" /></Field></div>
        <Field label="State"><select style={S.input} value={f.state} onChange={up("state")}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="How would you like to pay?"><div className="vg-pay" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Online","Pay online","UPI · Cards · Netbanking"],["COD","Cash on Delivery",codAllowed?"Pay when it arrives":(hasCustom?"Not available for custom orders":"Not available over "+rupee(COD_MAX))]].map(([val,title,sub])=>{ const disabled=(val==="COD"&&!codAllowed); return (<button key={val} type="button" disabled={disabled} onClick={()=>{ if(!disabled) setF({...f,pay:val}); }} style={{...S.payOpt,...(f.pay===val?S.payOptOn:{}),...(disabled?{opacity:.5,cursor:"not-allowed"}:{})}}><span style={{...S.payRadio,...(f.pay===val?S.payRadioOn:{})}}>{f.pay===val?"✓":""}</span><span style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}><span style={S.payTitle}>{title}</span><span style={S.paySub}>{sub}</span></span></button>); })}</div></Field>
        {!codAllowed && <p style={{fontSize:11.5,color:T.muted,margin:"6px 0 0",lineHeight:1.5}}>{hasCustom?"💳 Custom photo tees are prepaid only — please pay online. We start your design once payment is confirmed.":"💳 Orders above "+rupee(COD_MAX)+" are prepaid only (secure online payment). This keeps prices low for everyone."}</p>}
      </div>
      <div style={S.summary}>
        <h3 style={S.summaryTitle}>Order summary</h3>
        <p style={{fontSize:12,color:T.muted,margin:"-6px 0 12px",fontFamily:"var(--mono)"}}>{items.reduce((n,i)=>n+i.qty,0)} item{items.reduce((n,i)=>n+i.qty,0)===1?"":"s"} · {items.length} product{items.length===1?"":"s"}</p>
        {items.map(i=>(<div key={i.key} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:13,padding:"7px 0",color:T.inkSoft,borderBottom:"1px solid "+T.line}}>
          <span style={{flex:1}}>{esc(i.name)}{i.design?<span style={{color:T.marigold}}> · 🎨 custom</span>:""}{i.size?<span style={{color:T.muted}}> · {esc(i.size)}</span>:""}<br/><span style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)"}}>{rupee(i.price)} × {i.qty}</span></span>
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
          <div style={S.coSecureRow}><span aria-hidden="true">↩</span><span>Free <strong style={{color:T.ink}}>7-day replacement or refund</strong> on damaged or defective items. Other returns reviewed case by case.</span></div>
          <div style={S.coSecureRow}><span aria-hidden="true">📦</span><span>Dispatched in 24–48h · delivered in 3–7 days, pan-India.</span></div>
        </div>
      </div>
    </div>
  </div></Overlay>);
}
function Field({label,err,children}){ return <label style={{display:"block",marginBottom:12}}><span style={S.fieldLabel}>{label}{err && <span style={{color:T.danger,marginLeft:6}}>· {err}</span>}</span>{children}</label>; }

function Confirmation({order,onClose}){ const steps=["Placed","Packed","Shipped","Delivered"]; const c=order.customer; const items=order.items||[]; return (
  <Overlay onClose={onClose}><div style={{...S.modal,maxWidth:580,textAlign:"center"}} className="vg-modal">
    <div style={S.checkCircle}>✓</div>
    <h2 style={{...S.modalTitle,marginTop:14}}>Order placed</h2>
    <p style={{color:T.inkSoft,marginTop:4}}>Order <strong style={{fontFamily:"var(--mono)",color:T.ink}}>{order.id}</strong> · {rupee(order.total)} · {order.payment==="COD"?"Cash on delivery":"Paid online"}</p>
    {c&&c.email && <p style={{fontSize:12.5,color:T.teal,marginTop:8}}>📧 A confirmation with your tracking details has been sent to <strong>{esc(c.email)}</strong></p>}
    <div style={S.stepper}>{steps.map((s,idx)=>(<React.Fragment key={s}><div style={{textAlign:"center"}}><div style={{...S.stepDot,background:idx===0?T.teal:T.line,color:idx===0?"#fff":T.muted}}>{idx+1}</div><span style={{fontSize:11,color:idx===0?T.ink:T.muted,fontFamily:"var(--mono)"}}>{s}</span></div>{idx<steps.length-1 && <div style={S.stepLine} />}</React.Fragment>))}</div>
    {items.length>0 && <div style={{textAlign:"left",background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:16,marginTop:18}}>
      <p style={{fontSize:12,color:T.muted,margin:"0 0 8px",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em"}}>Order details</p>
      {items.map((i,ix)=>(<div key={i.key||i.id||ix} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",color:T.inkSoft}}><span>{esc(i.name)}{i.design?" · 🎨 custom":""}{i.size?" · "+esc(i.size):""} <span style={{color:T.muted,fontFamily:"var(--mono)",fontSize:11}}>× {i.qty}</span></span><span style={{color:T.ink}}>{rupee(i.price*i.qty)}</span></div>))}
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

function Overlay({children,onClose}){ return <div style={S.overlay} className="vg-overlay" onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{animation:"pop .18s ease",width:"100%",display:"flex",justifyContent:"center"}}>{children}</div></div>; }
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
          {items.map((i,idx2)=>(<div key={idx2} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color:T.inkSoft}}><span>{esc(i.name||"Item")}{i.custom?" · 🎨 custom":""}{i.size?" · "+esc(i.size):""} <span style={{color:T.muted,fontFamily:"var(--mono)",fontSize:11}}>× {i.qty||1}</span></span><span style={{color:T.ink}}>{rupee((i.price||0)*(i.qty||1))}</span></div>))}
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

function HelpCenter({onBack}){
  const [id,setId]=useState(""); const [phone,setPhone]=useState("");
  const [thread,setThread]=useState(null);
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(""); const [sending,setSending]=useState(false);
  const open=async()=>{ setErr("");
    const cleanId=id.trim().replace(/^#/,"");
    if(!cleanId||phone.replace(/\D/g,"").length<10){ setErr("Enter your order ID and 10-digit phone number."); return; }
    setBusy(true);
    try{ const r=await fetch(API+"/api/support/thread",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:cleanId,phone})});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setThread(j); } else { setErr(j.error||"Couldn't find that order."); }
    }catch(e){ setBusy(false); setErr("Something went wrong. Please try again."); }
  };
  const send=async()=>{ const text=msg.trim(); if(!text||sending) return; setSending(true); setErr("");
    try{ const r=await fetch(API+"/api/support/message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:thread.order.id,phone,body:text})});
      const j=await r.json(); setSending(false);
      if(r.ok){ setThread(t=>t?{...t,messages:j.messages}:t); setMsg(""); } else { setErr(j.error||"Couldn't send your message."); }
    }catch(e){ setSending(false); setErr("Something went wrong. Please try again."); }
  };
  const oid=thread&&thread.order?thread.order.id:null;
  useEffect(()=>{ if(!oid) return;
    const t=setInterval(async()=>{
      try{ const r=await fetch(API+"/api/support/thread",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:oid,phone})});
        const j=await r.json(); if(r.ok&&Array.isArray(j.messages)) setThread(prev=>prev?{...prev,messages:j.messages}:prev);
      }catch(e){}
    },5000);
    return ()=>clearInterval(t);
  },[oid]);
  return (<main style={{...S.main,maxWidth:620}}>
    <section style={{padding:"40px 0 8px"}}>
      <button onClick={onBack} style={S.linkBtn}>← Back to store</button>
      <h1 style={{fontFamily:"var(--display)",fontSize:32,fontWeight:700,letterSpacing:"-.02em",margin:"14px 0 6px"}}>Help center</h1>
      {!thread ? (<>
        <p style={{color:T.inkSoft,marginBottom:20,fontSize:14.5}}>Have a question or a problem with an order? Enter your order ID and the phone number you ordered with, and we'll help you right here.</p>
        <div style={{display:"grid",gap:12,maxWidth:420}}>
          <input style={S.input} value={id} onChange={e=>setId(e.target.value)} placeholder="Order ID (e.g. VG12345678)" />
          <input style={S.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number (10 digits)" inputMode="numeric" maxLength={10} />
          <button onClick={open} disabled={busy} style={{...S.primaryBtn,...(busy?S.addBtnDisabled:{})}}>{busy?"Opening…":"Start chat"}</button>
          {err && <p style={{color:T.danger,fontSize:13}}>{err}</p>}
        </div>
      </>) : (<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:"12px 16px",marginBottom:14}}>
          <div><strong style={{fontFamily:"var(--mono)",fontSize:14,color:T.ink}}>{esc(thread.order.id)}</strong><span style={{fontSize:12,color:T.inkSoft,marginLeft:10,fontFamily:"var(--mono)"}}>{esc(thread.order.status||"Placed")} · {rupee(thread.order.total)}</span></div>
          <button onClick={()=>{ setThread(null); setMsg(""); setErr(""); }} style={{...S.linkBtn,fontSize:12.5}}>Use a different order</button>
        </div>
        <div style={{background:T.bg||"#0f0d0a",border:"1px solid "+T.line,borderRadius:14,padding:16,minHeight:200,maxHeight:380,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
          {(!thread.messages||thread.messages.length===0)
            ? <p style={{color:T.muted,fontSize:13.5,textAlign:"center",margin:"auto",lineHeight:1.6,maxWidth:320}}>👋 Describe your issue or request below and we'll get back to you here. You'll also receive our reply by email.</p>
            : thread.messages.map(m=>{ const mine=m.sender==="customer"; return (
              <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"82%"}}>
                {!mine && <div style={{fontSize:10.5,color:T.muted,fontFamily:"var(--mono)",margin:"0 0 3px 4px",textTransform:"uppercase",letterSpacing:".04em"}}>Vector Grid</div>}
                <div style={{background:mine?T.marigold:T.card,color:mine?"#fff":T.ink,border:mine?"none":"1px solid "+T.line,borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 13px",fontSize:13.5,lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{esc(m.body)}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:"var(--mono)",margin:mine?"3px 4px 0 0":"3px 0 0 4px",textAlign:mine?"right":"left"}}>{new Date(m.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              </div>); })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:12,alignItems:"flex-end"}}>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type your message…" rows={2} style={{...S.input,flex:1,resize:"vertical",fontFamily:"inherit",minHeight:44}} onKeyDown={e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); send(); } }} />
          <button onClick={send} disabled={sending||!msg.trim()} style={{...S.primaryBtn,width:"auto",padding:"11px 20px",...((sending||!msg.trim())?S.addBtnDisabled:{})}}>{sending?"…":"Send"}</button>
        </div>
        {err && <p style={{color:T.danger,fontSize:13,marginTop:8}}>{err}</p>}
        <p style={{fontSize:11.5,color:T.muted,marginTop:10,lineHeight:1.5}}>This chat updates automatically. We reply as soon as we can — our reply also arrives by email.</p>
      </>)}
    </section>
  </main>);
}

function AdminSupportThread({thread,adminKey,onReplied}){
  const [reply,setReply]=useState(""); const [busy,setBusy]=useState(false); const [open,setOpen]=useState(thread.unseen>0);
  const send=async()=>{ const text=reply.trim(); if(!text||busy) return; setBusy(true);
    try{ const r=await fetch(API+"/api/admin/support-reply",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({orderId:thread.orderId,body:text})});
      const j=await r.json(); setBusy(false); if(r.ok){ setReply(""); onReplied&&onReplied(); } }
    catch(e){ setBusy(false); }
  };
  const last=thread.messages[thread.messages.length-1];
  return (<div style={{background:T.card,border:"1px solid "+(thread.unseen>0?T.marigold:T.line),borderRadius:14,padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",cursor:"pointer"}} onClick={()=>setOpen(!open)}>
      <div style={{minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <strong style={{fontFamily:"var(--mono)",fontSize:14,color:T.ink}}>{esc(thread.orderId)}</strong>
          {thread.unseen>0 && <span style={{fontSize:10.5,fontWeight:700,background:T.marigold,color:"#fff",borderRadius:999,padding:"1px 8px",fontFamily:"var(--mono)"}}>{thread.unseen} new</span>}
          <span style={{fontSize:11.5,color:T.inkSoft}}>{esc(thread.name)}{thread.phone?" · "+esc(thread.phone):""}</span>
        </div>
        <p style={{fontSize:12.5,color:T.muted,margin:"6px 0 0",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?((last.sender==="seller"?"You: ":"")+esc(last.body)):""}</p>
      </div>
      <span style={{fontSize:12,color:T.muted,fontFamily:"var(--mono)",flexShrink:0}}>{open?"▲":"▼"}</span>
    </div>
    {open && <>
      <div style={{background:T.bg||"#0f0d0a",border:"1px solid "+T.line,borderRadius:12,padding:14,margin:"12px 0",display:"flex",flexDirection:"column",gap:9,maxHeight:300,overflowY:"auto"}}>
        {thread.messages.map(m=>{ const seller=m.sender==="seller"; return (
          <div key={m.id} style={{alignSelf:seller?"flex-end":"flex-start",maxWidth:"85%"}}>
            <div style={{fontSize:10,color:T.muted,fontFamily:"var(--mono)",margin:seller?"0 4px 2px 0":"0 0 2px 4px",textAlign:seller?"right":"left"}}>{seller?"You":esc(thread.name)} · {new Date(m.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
            <div style={{background:seller?T.teal:T.card,color:seller?"#fff":T.ink,border:seller?"none":"1px solid "+T.line,borderRadius:12,padding:"8px 12px",fontSize:13,lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{esc(m.body)}</div>
          </div>); })}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
        <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply / solution…" rows={2} style={{...S.input,flex:1,resize:"vertical",fontFamily:"inherit",minHeight:42}} />
        <button onClick={send} disabled={busy||!reply.trim()} style={{...S.primaryBtn,width:"auto",padding:"10px 18px",...((busy||!reply.trim())?S.addBtnDisabled:{})}}>{busy?"…":"Reply"}</button>
      </div>
      <p style={{fontSize:11,color:T.muted,marginTop:8}}>Your reply is saved to this conversation and emailed to the customer (if they left an email).</p>
    </>}
  </div>);
}

function AdminOrders({onBack}){
  const [key,setKey]=useState(""); const [authed,setAuthed]=useState(false);
  const [orders,setOrders]=useState([]); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const [remember,setRemember]=useState(true); const [booting,setBooting]=useState(true);
  const [tab,setTab]=useState("orders"); const [reviews,setReviews]=useState([]); const [revBusy,setRevBusy]=useState(false);
  const [prods,setProds]=useState([]); const [prodBusy,setProdBusy]=useState(false); const [editing,setEditing]=useState(null);
  const [support,setSupport]=useState([]); const [supBusy,setSupBusy]=useState(false);
  const load=async(k,opts)=>{ setErr(""); setBusy(true);
    try{ const r=await fetch(API+"/api/admin/orders",{headers:{"x-admin-key":k}});
      const j=await r.json(); setBusy(false);
      if(r.ok){ setOrders(j.orders||[]); setAuthed(true); setKey(k);
        if(opts&&opts.remember){ try{ localStorage.setItem("vg_admin_key",k); }catch(e){} }
        loadReviews(k); loadProds(k); loadSupport(k);
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
  const loadSupport=async(k)=>{ setSupBusy(true);
    try{ const r=await fetch(API+"/api/admin/support",{headers:{"x-admin-key":k||key}}); const j=await r.json(); setSupBusy(false); if(r.ok) setSupport(j.threads||[]); }
    catch(e){ setSupBusy(false); }
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
  const supUnseen=support.reduce((s,t)=>s+(t.unseen||0),0);
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
            {[["orders","Orders"],["products","Products"],["reviews","Reviews"],["support","Support"]].map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t?T.marigold:"transparent"),color:tab===t?T.ink:T.muted,padding:"8px 14px",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:-1}}>{label}{t==="products"&&prods.length>0?" ("+prods.length+")":""}{t==="reviews"&&reviews.length>0?" ("+reviews.length+")":""}{t==="support"&&supUnseen>0?" ("+supUnseen+")":""}</button>
            ))}
          </div>
          {tab==="orders" ? (<div>
          {(()=>{ const stat=(name)=>orders.filter(o=>(o.status||"Placed")===name).length;
            const active=orders.filter(o=>(o.status||"")!=="Cancelled");
            const revenue=active.reduce((s,o)=>s+Number(o.total||0),0);
            // product (supplier) cost per order — from stored supply, fallback to current product catalogue
            const orderCost=(o)=>{
              let supply=[]; try{ supply=Array.isArray(o.supply)?o.supply:JSON.parse(o.supply||"[]"); }catch(e){ supply=[]; }
              let items=[]; try{ items=Array.isArray(o.items)?o.items:JSON.parse(o.items||"[]"); }catch(e){ items=[]; }
              const src=supply.length?supply:items; let cost=0, known=src.length>0;
              for(const it of src){ let c=(it.cost!=null)?it.cost:null;
                if(c==null){ const p=(prods||[]).find(pp=>pp.name===it.name); c=(p&&p.cost!=null)?p.cost:null; }
                if(c==null){ known=false; } else { cost+=c*(it.qty||1); } }
              return {cost,known};
            };
            let productCost=0, allKnown=true;
            active.forEach(o=>{ const c=orderCost(o); productCost+=c.cost; if(!c.known) allKnown=false; });
            const delivery=active.reduce((s,o)=>s+Number(o.shipping||0),0);
            const profit=revenue-productCost;
            const cards=[["Total orders",orders.length,T.ink],["New / Placed",stat("Placed"),T.marigold],["Shipped",stat("Shipped"),T.teal],["Delivered",stat("Delivered"),T.teal],["Revenue","₹"+revenue.toLocaleString("en-IN"),T.ink]];
            return (<div style={{marginBottom:18}}>
              <div className="vg-stats" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:10}}>
                {cards.map(([label,val,col])=>(<div key={label} style={{background:T.card,border:"1px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"var(--display)",lineHeight:1.1}}>{val}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:3,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".04em"}}>{label}</div>
                </div>))}
              </div>
              <div style={{background:profit>=0?"rgba(31,158,87,.10)":"rgba(229,104,90,.10)",border:"1px solid "+(profit>=0?"rgba(31,158,87,.35)":"rgba(229,104,90,.35)"),borderRadius:14,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em",color:profit>=0?"#34c77b":"#e5685a",marginBottom:4}}>{profit>=0?"📈 Estimated profit":"📉 Estimated loss"}</div>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--display)",color:profit>=0?"#34c77b":"#e5685a",lineHeight:1}}>{profit<0?"−":""}₹{Math.abs(profit).toLocaleString("en-IN")}</div>
                </div>
                <div style={{fontSize:12.5,color:T.inkSoft,fontFamily:"var(--mono)",lineHeight:1.7,textAlign:"right"}}>
                  Revenue ₹{revenue.toLocaleString("en-IN")} <span style={{color:T.muted}}>(incl. ₹{delivery.toLocaleString("en-IN")} delivery)</span><br/>– Product cost ₹{productCost.toLocaleString("en-IN")}
                </div>
              </div>
              <p style={{fontSize:11,color:T.muted,margin:"8px 2px 0",lineHeight:1.5}}>Gross figure from your supplier costs. <strong style={{color:T.inkSoft}}>Before</strong> your courier/shipping, Razorpay fees, and any RTO/return losses. Cancelled orders excluded.{!allKnown && " Some orders are missing supplier cost, so actual cost may be higher."}</p>
            </div>);
          })()}
          {orders.length>0 && (()=>{ 
            const active=orders.filter(o=>(o.status||"")!=="Cancelled");
            // best sellers by qty
            const tally={};
            active.forEach(o=>{ let items=[]; try{ items=Array.isArray(o.items)?o.items:JSON.parse(o.items||"[]"); }catch(e){ items=[]; } items.forEach(it=>{ const k=it.name||"Item"; tally[k]=(tally[k]||0)+(Number(it.qty)||1); }); });
            const top=Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,5);
            const maxQty=top.length?top[0][1]:1;
            // orders over last 7 days
            const days=[]; const now=new Date();
            for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); days.push({key:d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}),ds:d.toDateString(),n:0}); }
            active.forEach(o=>{ if(!o.created_at) return; const ds=new Date(o.created_at).toDateString(); const slot=days.find(x=>x.ds===ds); if(slot) slot.n++; });
            const maxDay=Math.max(1,...days.map(d=>d.n));
            return (<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}} className="vg-two">
              <div style={{background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:"16px 18px"}}>
                <div style={{fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em",color:T.muted,marginBottom:12}}>🏆 Best sellers</div>
                {top.length===0 ? <p style={{fontSize:13,color:T.muted,margin:0}}>No sales yet.</p> : top.map(([name,qty])=>(
                  <div key={name} style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,marginBottom:3}}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"75%"}}>{esc(name)}</span><span style={{color:T.ink,fontWeight:600}}>{qty}</span></div>
                    <div style={{height:6,background:T.tint,borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(qty/maxQty*100)+"%",background:"linear-gradient(90deg,#F3A23E,#27B3A3)"}} /></div>
                  </div>
                ))}
              </div>
              <div style={{background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:"16px 18px"}}>
                <div style={{fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".05em",color:T.muted,marginBottom:12}}>📅 Orders · last 7 days</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
                  {days.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:11,color:T.ink,fontWeight:600,fontFamily:"var(--mono)"}}>{d.n||""}</div>
                    <div style={{width:"100%",height:Math.round((d.n/maxDay)*60)+"px",minHeight:d.n?4:2,background:d.n?"linear-gradient(180deg,#F3A23E,#E8820C)":T.tint,borderRadius:"4px 4px 0 0"}} />
                    <div style={{fontSize:9.5,color:T.muted,fontFamily:"var(--mono)",whiteSpace:"nowrap",transform:"scale(.85)"}}>{d.key.split(" ")[0]}</div>
                  </div>))}
                </div>
              </div>
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
          </div>) : tab==="reviews" ? (<div>
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
          </div>) : (<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10,flexWrap:"wrap"}}>
              <span style={{color:T.inkSoft,fontSize:13,fontFamily:"var(--mono)"}}>{support.length} conversation{support.length===1?"":"s"}{supUnseen>0?" · "+supUnseen+" new":""}</span>
              <button onClick={()=>loadSupport(key)} style={S.linkBtn}>↻ Refresh</button>
            </div>
            {supBusy && support.length===0 && <p style={{color:T.muted}}>Loading conversations…</p>}
            {!supBusy && support.length===0 && <div style={{textAlign:"center",padding:"48px 20px",background:T.card,border:"1px dashed "+T.line,borderRadius:16}}><div style={{fontSize:32,marginBottom:8}}>💬</div><p style={{color:T.inkSoft,margin:0}}>No customer messages yet.</p><p style={{color:T.muted,fontSize:13,marginTop:4}}>When a customer contacts you from the Help Center, the conversation appears here.</p></div>}
            <div style={{display:"grid",gap:12}}>{support.map(th=><AdminSupportThread key={th.orderId} thread={th} adminKey={key} onReplied={()=>loadSupport(key)} />)}</div>
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
    sizes:(product.sizes!=null?product.sizes:"")||"",
    custom:product.custom===true,
    active:product.active!==false,
  });
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState("");
  const up=(k)=>(e)=>setF({...f,[k]:e.target.value});
  const onPickImg=(e)=>{
    const file=e.target.files&&e.target.files[0]; if(!file) return;
    if(!file.type.startsWith("image/")){ setMsg("Please choose an image file."); return; }
    const reader=new FileReader();
    reader.onload=()=>{ const im=new Image();
      im.onload=()=>{ const max=800; let w=im.width,h=im.height;
        if(w>h&&w>max){ h=Math.round(h*max/w); w=max; } else if(h>=w&&h>max){ w=Math.round(w*max/h); h=max; }
        const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
        cv.getContext("2d").drawImage(im,0,0,w,h);
        setF(prev=>({...prev,img:cv.toDataURL("image/jpeg",0.78)})); setMsg("");
      };
      im.onerror=()=>setMsg("Couldn't read that image. Try another photo.");
      im.src=reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value="";
  };
  const save=async()=>{ setMsg("");
    if(!f.name.trim()){ setMsg("Please enter a product name."); return; }
    if(f.price===""||isNaN(Number(f.price))||Number(f.price)<0){ setMsg("Please enter a valid price."); return; }
    setSaving(true);
    try{ const r=await fetch(API+"/api/admin/product-save",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({
        id:isNew?"":f.id, name:f.name, price:Number(f.price), mrp:Number(f.mrp)||0, stock:Number(f.stock)||0,
        category:f.category, img:f.img, desc:f.desc, cost:f.cost===""?"":Number(f.cost), supplier:f.supplier, supplierUrl:f.supplierUrl, sizes:f.sizes, custom:f.custom, active:f.active })});
      const j=await r.json(); setSaving(false);
      if(r.ok) onSaved(); else setMsg(j.error||"Couldn't save the product.");
    }catch(e){ setSaving(false); setMsg("Something went wrong. Please try again."); }
  };
  const L=({label,hint,children})=>(<label style={{display:"block",marginBottom:12}}><span style={{...S.fieldLabel,display:"block"}}>{label}{hint&&<span style={{color:T.muted,fontWeight:400}}> · {hint}</span>}</span>{children}</label>);
  return (<Overlay onClose={saving?()=>{}:onClose}><div style={{...S.modal,maxWidth:560,maxHeight:"90vh",overflowY:"auto"}} className="vg-modal">
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
    <L label="Sizes" hint="clothing only — comma-separated. Leave blank for non-clothing."><input style={S.input} value={f.sizes} onChange={up("sizes")} maxLength={120} placeholder="S,M,L,XL,XXL" /></L>
    <label style={{display:"flex",alignItems:"flex-start",gap:8,margin:"0 0 12px",fontSize:13.5,color:T.inkSoft,cursor:"pointer",lineHeight:1.5}}>
      <input type="checkbox" checked={f.custom} onChange={e=>setF({...f,custom:e.target.checked})} style={{width:16,height:16,marginTop:2,accentColor:T.marigold,flexShrink:0}} />
      <span>Custom photo product · customer uploads their own image and it's <strong style={{color:T.inkSoft}}>prepaid only</strong>. Turn this on for "design your own" tees.</span>
    </label>
    <L label="Image URL" hint="paste a link, or upload below"><input style={S.input} value={f.img.startsWith("data:")?"":f.img} onChange={up("img")} maxLength={500} placeholder={f.img.startsWith("data:")?"✓ Photo uploaded below":"https://..."} /></L>
    <div style={{marginBottom:12}}>
      <span style={{...S.fieldLabel,display:"block",marginBottom:6}}>Or upload a photo <span style={{color:T.muted,fontWeight:400}}>· from your phone or computer</span></span>
      <input type="file" accept="image/*" id={"imgup-"+(f.id||"new")} onChange={onPickImg} style={{display:"none"}} />
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <label htmlFor={"imgup-"+(f.id||"new")} style={{...S.addBtn,width:"auto",marginTop:0,padding:"9px 16px",fontSize:12.5,cursor:"pointer",display:"inline-block"}}>📷 Choose photo</label>
        {f.img && <img src={f.img} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,border:"1px solid "+T.line}} onError={(e)=>{e.currentTarget.style.opacity=.3;}} />}
        {f.img && <button type="button" onClick={()=>setF({...f,img:""})} style={{...S.linkBtn,fontSize:12}}>Remove</button>}
      </div>
      <p style={{fontSize:11,color:T.muted,margin:"6px 0 0",lineHeight:1.5}}>Photos are auto-shrunk so your store loads fast.</p>
    </div>
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
  const [askDel,setAskDel]=useState(false); const [deleting,setDeleting]=useState(false);
  const [designs,setDesigns]=useState(null);
  const loadDesigns=async()=>{ try{ const r=await fetch(API+"/api/admin/order-designs?orderId="+encodeURIComponent(o.id),{headers:{"x-admin-key":adminKey}}); const j=await r.json(); setDesigns(Array.isArray(j.designs)?j.designs:[]); }catch(e){ setDesigns([]); } };
  const save=async()=>{ setSaving(true); setMsg("");
    try{ const r=await fetch(API+"/api/admin/update",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({orderId:o.id,status,trackingCarrier:carrier,trackingUrl:url})});
      const j=await r.json(); setSaving(false);
      if(r.ok){ setMsg("Saved ✓"); onSaved&&onSaved(); } else { setMsg(j.error||"Failed"); }
    }catch(e){ setSaving(false); setMsg("Failed"); }
  };
  const del=async()=>{ setDeleting(true);
    try{ const r=await fetch(API+"/api/admin/order-delete",{method:"POST",headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify({orderId:o.id})});
      const j=await r.json(); setDeleting(false);
      if(r.ok){ onSaved&&onSaved(); } else { setDeleting(false); setAskDel(false); alert(j.error||"Could not delete the order."); }
    }catch(e){ setDeleting(false); setAskDel(false); alert("Could not delete the order. Please try again."); }
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
  const fullOrderText=`Order ${o.id}\nShip to:\n${addressText}\n\nItems:\n`+items.map(i=>`- ${i.name}${i.size?" ["+i.size+"]":""} x${i.qty||1}`).join("\n");
  const itemSummary=items.map(i=>`${i.name}${i.size?" ("+i.size+")":""} x${i.qty||1}`).join(", ");
  const confirmMsg=`Hi ${o.name}, this is Vector Grid 👋\n\nPlease confirm your Cash on Delivery order:\n• Order ID: ${o.id}\n• Items: ${itemSummary}\n• Amount to pay on delivery: ${rupee(o.total)}\n• Delivery address: ${o.line1}${o.line2?", "+o.line2:""}, ${o.city}, ${o.state} - ${o.pincode}\n\nReply YES to confirm and we'll ship it out. Thank you for shopping with us!`;
  const dt=o.created_at?new Date(o.created_at):null;
  const dstr=dt?dt.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
  // per-order product cost + gross profit (before shipping/fees)
  let oCost=0, costKnown=(supply.length||items.length)>0;
  (supply.length?supply:items).forEach(it=>{ let c=(it.cost!=null)?it.cost:null; if(c==null){ const s=supplyFor(it); c=(s&&s.cost!=null)?s.cost:null; } if(c==null){ costKnown=false; } else { oCost+=c*(it.qty||1); } });
  const oProfit=Number(o.total||0)-oCost;
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
        {o.status!=="Cancelled" && costKnown && <div style={{fontSize:11.5,fontFamily:"var(--mono)",marginTop:3,color:oProfit>=0?"#34c77b":"#e5685a"}}>{oProfit>=0?"profit ":"loss "}{oProfit<0?"−":""}{rupee(Math.abs(oProfit))}</div>}
        {dstr && <div style={{fontSize:11,color:T.muted,fontFamily:"var(--mono)",marginTop:2}}>{dstr}</div>}
      </div>
    </div>
    {items.length>0 && <div style={{padding:"0 18px 14px"}}>
      <button onClick={()=>setOpen(!open)} style={{...S.linkBtn,fontSize:12.5}}>{open?"▾ Hide items":"▸ "+items.reduce((n,i)=>n+(i.qty||1),0)+" item"+(items.reduce((n,i)=>n+(i.qty||1),0)===1?"":"s")}</button>
      {open && <div style={{marginTop:8,background:T.bg||"#0f0d0a",borderRadius:10,padding:"10px 12px"}}>
        {items.map((i,idx)=>(<div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.inkSoft,padding:"3px 0"}}><span>{esc(i.name||"Item")}{i.custom?" · 🎨 custom":""}{i.size?" · "+esc(i.size):""} <span style={{color:T.muted,fontFamily:"var(--mono)"}}>× {i.qty||1}</span></span><span style={{color:T.ink}}>{rupee((i.price||0)*(i.qty||1))}</span></div>))}
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
        <button onClick={()=>{ const nx=!fulfill; setFulfill(nx); if(nx && designs===null && items.some(i=>i.custom)) loadDesigns(); }} style={{...S.linkBtn,fontSize:12.5,color:"#a99dff"}}>{fulfill?"▾ Hide":"▸ Show"}</button>
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
              {it.custom && <div style={{width:"100%",marginTop:8,borderTop:"1px dashed "+T.line,paddingTop:8}}>
                {it.notes && <div style={{fontSize:12,color:T.inkSoft,marginBottom:6,lineHeight:1.5}}>📝 {esc(it.notes)}</div>}
                {(()=>{ const d=designs&&designs.find(x=>x.idx===idx); return d&&d.image
                  ? <a href={d.image} download={"design-"+o.id+"-"+idx+".jpg"} style={{display:"inline-block",textDecoration:"none"}}><img src={d.image} alt="customer design" style={{maxWidth:140,maxHeight:140,borderRadius:8,border:"1px solid "+T.line,display:"block"}} /><span style={{fontSize:11.5,color:T.marigold,fontFamily:"var(--mono)",marginTop:5,display:"inline-block"}}>⬇ Download design</span></a>
                  : <button onClick={loadDesigns} style={{...S.addBtn,width:"auto",marginTop:0,padding:"7px 14px",fontSize:12}}>📎 Load customer's design</button>; })()}
              </div>}
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
      <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+T.line}}>
        {!askDel ? (
          <button onClick={()=>setAskDel(true)} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",padding:"4px 0",textDecoration:"underline"}}>🗑 Delete this order</button>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:12.5,color:"#e5685a"}}>Delete order {esc(o.id)} permanently? This can't be undone.</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={del} disabled={deleting} style={{border:"none",background:"#e5685a",color:"#fff",fontWeight:700,fontSize:12.5,borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>{deleting?"Deleting…":"Yes, delete"}</button>
              <button onClick={()=>setAskDel(false)} disabled={deleting} style={{...S.linkBtn,fontSize:12.5}}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>);
}

function Footer({storeName,onNav}){
  const links=[["Track order","track"],["Help center","help"],["About","about"],["Terms","terms"],["Privacy","privacy"],["Refund","refund"],["Shipping","shipping"],["Contact","contact"],["Seller","admin"]];
  return (<footer style={S.footer}>
    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,alignItems:"center"}}>
      <span style={{fontWeight:600,color:T.ink}}>{storeName}</span>
      <nav style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        {links.map(([label,key])=>(<button key={key} onClick={()=>onNav(key)} style={S.footLink}>{label}</button>))}
      </nav>
    </div>
    <div style={{marginTop:16,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,alignItems:"center"}}>
      <a href={INFO.instagram} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,color:T.ink,textDecoration:"none",fontSize:13.5,fontWeight:600,border:"1px solid "+T.line,borderRadius:999,padding:"8px 16px"}}>
        <span aria-hidden="true" style={{fontSize:16}}>📸</span> Follow us on Instagram <span style={{color:T.marigold,fontFamily:"var(--mono)"}}>{INFO.instagramHandle}</span>
      </a>
      <span style={{color:T.muted,fontSize:12.5}}>Delivered across India · payments secured by Razorpay</span>
    </div>
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
