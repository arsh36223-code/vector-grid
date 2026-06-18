const { useState, useEffect, useMemo } = React;
const API = "";

const T = { paper:"#FBFAF6", card:"#FFFFFF", ink:"#191510", inkSoft:"#5C544A", muted:"#9A9085", line:"#E9E3D8", marigold:"#E8820C", marigoldDark:"#C96A00", teal:"#0E5C53", tint:"#FBF1E2", danger:"#B23B2E" };
const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar"];
const SEED = [
  { id:"p1", name:"Minimalist Steel Water Bottle", price:549, mrp:899, stock:42, img:"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80", desc:"Insulated 750ml bottle. Keeps cold 24h, hot 12h." },
  { id:"p2", name:"Linen Cushion Cover (Set of 2)", price:699, mrp:1199, stock:30, img:"https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80", desc:"16x16 inch, washed linen, hidden zip." },
  { id:"p3", name:"Wireless Earbuds — Bass Edition", price:1299, mrp:2499, stock:12, img:"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80", desc:"ENC mic, 40h playback, IPX5." },
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
      <Header storeName={storeName} cartCount={cartCount} onCart={()=>setCartOpen(true)} onHome={()=>go(null)} />
      {page ? <Policy pageKey={page} onBack={()=>go(null)} /> : <Store products={products} onAdd={addToCart} onQuick={setQuick} />}
      <Footer storeName={storeName} onNav={go} />
      {cartOpen && !checkout && <CartDrawer items={cartItems} subtotal={subtotal} shipping={shipping} total={total} setQty={setQty} onClose={()=>setCartOpen(false)} onCheckout={()=>{ if(cartItems.length) setCheckout(true); }} />}
      {checkout && <Checkout items={cartItems} total={total} shipping={shipping} subtotal={subtotal} paying={paying} onBack={()=>{ if(!paying) setCheckout(false); }} onPlace={handlePlace} />}
      {confirmed && <Confirmation order={confirmed} onClose={()=>setConfirmed(null)} />}
      {quick && <QuickView product={quick} onClose={()=>setQuick(null)} onAdd={()=>{ addToCart(quick.id); setQuick(null); }} />}
    </div>
  );
}

function Header({storeName,cartCount,onCart,onHome}){
  return (<header style={S.header}><div style={S.headerInner}>
    <div onClick={onHome} style={{display:"flex",alignItems:"baseline",gap:10,cursor:"pointer"}}><span style={S.mark}>◆</span><span style={S.wordmark}>{storeName}</span><span style={S.tagline}>ships pan-India</span></div>
    <button onClick={onCart} style={S.cartBtn} aria-label="Open cart">Cart{cartCount>0 && <span style={S.cartBadge}>{cartCount}</span>}</button>
  </div></header>);
}

function Store({products,onAdd,onQuick}){
  return (<main style={S.main}>
    <section style={S.hero}>
      <p style={S.eyebrow}>Free shipping over ₹999 · COD available · 3–5 day delivery</p>
      <h1 style={S.heroH1}>Things worth<br/><em style={{color:T.marigold,fontStyle:"normal"}}>shipping</em> to your door.</h1>
      <p style={S.heroSub}>A small, sharp catalogue. Delivered to every pincode in the country.</p>
    </section>
    <div style={S.grid}>
      {products.map(p=>{ const out=p.stock<=0; return (
        <article key={p.id} style={S.prodCard}>
          <button style={S.imgWrap} onClick={()=>onQuick(p)} aria-label={"View "+esc(p.name)}>
            <img src={p.img} alt={esc(p.name)} style={S.img} loading="lazy" onError={(e)=>{e.currentTarget.style.opacity=0.25;}} />
            {out && <span style={S.soldOut}>Sold out</span>}
            {!out && p.mrp>p.price && <span style={S.discount}>{Math.round(100-(p.price/p.mrp)*100)}% off</span>}
          </button>
          <div style={{padding:"14px 16px 16px"}}>
            <h3 style={S.prodName}>{esc(p.name)}</h3>
            <p style={S.prodDesc}>{esc(p.desc)}</p>
            <div style={S.priceRow}><span style={S.price}>{rupee(p.price)}</span>{p.mrp>p.price && <span style={S.mrp}>{rupee(p.mrp)}</span>}</div>
            <button disabled={out} onClick={()=>onAdd(p.id)} style={{...S.addBtn,...(out?S.addBtnDisabled:{})}}>{out?"Sold out":"Add to cart"}</button>
          </div>
        </article>); })}
    </div>
  </main>);
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
        <Field label="Payment"><div style={{display:"flex",gap:10}}>{["Online","COD"].map(m=><button key={m} onClick={()=>setF({...f,pay:m})} style={{...S.payChip,...(f.pay===m?S.payChipOn:{})}}>{m==="Online"?"Pay online (UPI/Card)":"Cash on delivery"}</button>)}</div></Field>
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

function Footer({storeName,onNav}){
  const links=[["Terms","terms"],["Privacy","privacy"],["Refund","refund"],["Shipping","shipping"],["Contact","contact"]];
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
  header:{position:"sticky",top:0,zIndex:30,background:"rgba(251,250,246,.88)",backdropFilter:"blur(8px)",borderBottom:"1px solid "+T.line},
  headerInner:{maxWidth:1100,margin:"0 auto",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10},
  mark:{color:T.marigold,fontSize:18}, wordmark:{fontFamily:"var(--display)",fontWeight:700,fontSize:22,letterSpacing:"-.01em"}, tagline:{fontFamily:"var(--mono)",fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:".08em"},
  cartBtn:{position:"relative",border:"none",background:T.marigold,color:"#fff",borderRadius:999,padding:"8px 18px",fontSize:13,fontWeight:700}, cartBadge:{position:"absolute",top:-6,right:-6,background:T.ink,color:"#fff",borderRadius:999,fontSize:11,minWidth:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 4px"},
  main:{maxWidth:1100,margin:"0 auto",padding:"0 22px 60px"}, hero:{padding:"56px 0 36px",maxWidth:640}, eyebrow:{fontFamily:"var(--mono)",fontSize:12,color:T.teal,textTransform:"uppercase",letterSpacing:".06em",marginBottom:16}, heroH1:{fontFamily:"var(--display)",fontSize:"clamp(38px,6vw,62px)",lineHeight:1.02,fontWeight:700,letterSpacing:"-.02em",margin:0}, heroSub:{fontSize:16,color:T.inkSoft,marginTop:18,maxWidth:440,lineHeight:1.5},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:20}, prodCard:{background:T.card,border:"1px solid "+T.line,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}, imgWrap:{border:"none",padding:0,background:"#F2EEE5",position:"relative",aspectRatio:"4/3",overflow:"hidden",display:"block"}, img:{width:"100%",height:"100%",objectFit:"cover",display:"block"}, soldOut:{position:"absolute",inset:0,background:"rgba(25,21,16,.55)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontFamily:"var(--mono)",fontSize:13}, discount:{position:"absolute",top:10,left:10,background:T.teal,color:"#fff",fontSize:11,fontWeight:700,padding:"4px 9px",borderRadius:999,fontFamily:"var(--mono)"},
  prodName:{fontFamily:"var(--display)",fontSize:17,fontWeight:600,margin:0,lineHeight:1.2}, prodDesc:{fontSize:12.5,color:T.inkSoft,marginTop:6,lineHeight:1.45,minHeight:36}, priceRow:{display:"flex",alignItems:"baseline",gap:8,marginTop:10}, price:{fontSize:18,fontWeight:800,color:T.ink}, mrp:{fontSize:13,color:T.muted,textDecoration:"line-through"},
  addBtn:{width:"100%",marginTop:12,border:"1.5px solid "+T.ink,background:T.ink,color:T.paper,borderRadius:10,padding:"10px",fontWeight:700,fontSize:13.5}, addBtnDisabled:{background:"transparent",color:T.muted,borderColor:T.line,cursor:"not-allowed"},
  drawerScrim:{position:"fixed",inset:0,background:"rgba(25,21,16,.4)",zIndex:50,display:"flex",justifyContent:"flex-end"}, drawer:{width:"min(420px,100%)",background:T.paper,height:"100%",display:"flex",flexDirection:"column",boxShadow:"-20px 0 60px rgba(0,0,0,.18)"}, drawerHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid "+T.line}, drawerTitle:{fontFamily:"var(--display)",fontSize:20,margin:0}, xBtn:{border:"none",background:"transparent",fontSize:18,color:T.inkSoft},
  cartRow:{display:"flex",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.line}, cartThumb:{width:60,height:60,borderRadius:10,objectFit:"cover",background:"#eee"}, cartName:{fontSize:14,fontWeight:600,margin:0}, cartPrice:{fontSize:13,color:T.inkSoft,marginTop:2}, qtyRow:{display:"flex",alignItems:"center",gap:8,marginTop:8}, qtyBtn:{width:26,height:26,borderRadius:7,border:"1px solid "+T.line,background:T.card,fontSize:15,lineHeight:1}, qtyNum:{minWidth:18,textAlign:"center",fontWeight:600,fontSize:14}, cartLine:{fontWeight:700,fontSize:14}, drawerFoot:{padding:20,borderTop:"1px solid "+T.line,background:T.card},
  overlay:{position:"fixed",inset:0,background:"rgba(25,21,16,.45)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}, modal:{background:T.paper,borderRadius:18,padding:28,width:"100%",boxShadow:"0 30px 80px rgba(0,0,0,.25)"}, modalTitle:{fontFamily:"var(--display)",fontSize:24,margin:0}, linkBtn:{border:"none",background:"transparent",color:T.teal,fontWeight:600,fontSize:13},
  fieldLabel:{display:"block",fontSize:12,fontWeight:600,color:T.inkSoft,marginBottom:5,fontFamily:"var(--mono)",letterSpacing:".02em"}, input:{width:"100%",border:"1px solid "+T.line,borderRadius:9,padding:"9px 11px",fontSize:14,background:T.card,color:T.ink,fontFamily:"var(--body)"}, two:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}, payChip:{border:"1.5px solid "+T.line,background:T.card,borderRadius:9,padding:"9px 14px",fontSize:12.5,fontWeight:600,color:T.inkSoft}, payChipOn:{borderColor:T.teal,color:T.teal,background:"#EAF4F2"}, summary:{background:T.card,border:"1px solid "+T.line,borderRadius:14,padding:20,alignSelf:"start"}, summaryTitle:{fontFamily:"var(--display)",fontSize:16,margin:"0 0 12px"}, primaryBtn:{width:"100%",border:"none",background:T.marigold,color:"#fff",borderRadius:11,padding:"12px",fontWeight:700,fontSize:14.5},
  checkCircle:{width:56,height:56,borderRadius:999,background:T.teal,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto"}, stepper:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:22}, stepDot:{width:30,height:30,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,margin:"0 auto 5px"}, stepLine:{width:34,height:2,background:T.line,marginBottom:18},
  footer:{maxWidth:1100,margin:"0 auto",padding:"26px 22px 50px",display:"block",borderTop:"1px solid "+T.line,fontSize:12.5,color:T.inkSoft,fontFamily:"var(--mono)"}, footLink:{border:"none",background:"transparent",color:T.inkSoft,fontFamily:"var(--mono)",fontSize:12.5,padding:0,textDecoration:"underline",textUnderlineOffset:"3px"} };

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
