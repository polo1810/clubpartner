const font = `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`;

// === PALETTE PREMIUM — tons sourds, pro ===
export const Cl = {
  bg: "#f8f9fb", wh: "#ffffff",
  pri: "#3b5998", priL: "#eef1f7", priD: "#2d4373",
  ok: "#2e7d5b", okL: "#e8f5ee",
  warn: "#c2710c", warnL: "#fdf5e8",
  err: "#b93a3a", errL: "#fdf0f0",
  pur: "#6b4fa0", purL: "#f0ecf7",
  txt: "#1a1d23", txtL: "#6b7280", txtXL: "#9ca3af",
  brd: "#e5e7eb", hov: "#f3f4f6",
  slate: "#1e293b", slateL: "#334155",
};

export const S = {
  // --- Layout ---
  app: { fontFamily: font, background: Cl.bg, minHeight: "100vh", color: Cl.txt, lineHeight: 1.55, WebkitFontSmoothing: "antialiased" },
  header: { background: `linear-gradient(135deg, ${Cl.slate} 0%, #0f172a 100%)`, color: "#fff", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  nav: { display: "flex", gap: 0, padding: "0 28px", background: Cl.wh, borderBottom: `1px solid ${Cl.brd}`, flexWrap: "wrap" },
  navB: (a) => ({ padding: "11px 16px", border: "none", borderBottom: a ? `2px solid ${Cl.slate}` : "2px solid transparent", cursor: "pointer", fontWeight: a ? 600 : 400, fontSize: 13, fontFamily: font, background: "transparent", color: a ? Cl.slate : Cl.txtL, letterSpacing: "-0.01em", transition: "all 0.15s" }),
  main: { padding: "24px 28px", maxWidth: 1200, margin: "0 auto" },

  // --- Cards ---
  card: { background: Cl.wh, borderRadius: 8, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginBottom: 12, border: `1px solid ${Cl.brd}` },
  cT: { fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "#374151", letterSpacing: "-0.01em" },

  // --- Tables ---
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${Cl.brd}`, fontWeight: 500, color: Cl.txtL, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" },
  thR: { textAlign: "right", padding: "8px 10px", borderBottom: `1px solid ${Cl.brd}`, fontWeight: 500, color: Cl.txtL, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" },
  td: { padding: "9px 10px", borderBottom: `1px solid ${Cl.brd}` },
  tdR: { padding: "9px 10px", borderBottom: `1px solid ${Cl.brd}`, textAlign: "right" },

  // --- Badge ---
  badge: (c, bg) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, color: c, background: bg, marginRight: 4 }),

  // --- Buttons ---
  btn: (v) => ({ padding: "7px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13, fontFamily: font, letterSpacing: "-0.01em", ...(v === "primary" ? { background: Cl.slate, color: "#fff" } : v === "success" ? { background: Cl.ok, color: "#fff" } : { background: Cl.wh, color: Cl.txt, border: `1px solid ${Cl.brd}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }) }),
  btnS: (v) => ({ padding: "4px 10px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, ...(v === "ghost" ? { background: "transparent", color: Cl.pri } : { background: Cl.priL, color: Cl.pri }) }),

  // Boutons contextuels UX
  btnConvert: { padding: "7px 16px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: font, background: Cl.ok, color: "#fff" },
  btnCall: { padding: "7px 16px", border: `1px solid ${Cl.ok}40`, borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13, fontFamily: font, background: Cl.okL, color: Cl.ok },
  btnDelete: { padding: "3px 8px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "transparent", color: Cl.err },

  // Boutons documents (zone dédiée)
  btnDoc: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `1px solid ${Cl.brd}`, background: Cl.wh, cursor: "pointer", fontFamily: font, fontSize: 13, color: Cl.txt, fontWeight: 450, textAlign: "left", width: "100%", boxSizing: "border-box" },
  btnDocAction: (c, bg) => ({ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `1px solid ${c}30`, background: bg, cursor: "pointer", fontFamily: font, fontSize: 13, color: c, fontWeight: 500, textAlign: "left", width: "100%", boxSizing: "border-box" }),
  docZone: { marginTop: 14 },
  docZoneTitle: { fontSize: 11, fontWeight: 600, color: Cl.txtL, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 },
  docGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  docDone: { display: "flex", alignItems: "center", gap: 6, padding: "5px 0", fontSize: 12, color: Cl.txtL },

  // --- Inputs ---
  inp: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", background: Cl.wh },
  sel: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, width: "100%", boxSizing: "border-box", background: Cl.wh, cursor: "pointer" },
  lbl: { fontSize: 11, fontWeight: 500, color: Cl.txtL, marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" },

  // --- Grid ---
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  g4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  g5: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 },
  fx: { display: "flex", justifyContent: "space-between", alignItems: "center" },

  // --- Stats (enrichies avec contexte) ---
  stat: { textAlign: "center", padding: 12 },
  statCard: { background: Cl.hov, borderRadius: 8, padding: 12, textAlign: "center" },
  statCardHighlight: (bg, borderC) => ({ background: bg, borderRadius: 8, padding: 12, textAlign: "center" }),
  statV: (c) => ({ fontSize: 22, fontWeight: 600, color: c || Cl.txt, letterSpacing: "-0.02em" }),
  statL: { fontSize: 11, color: Cl.txtL, marginBottom: 4 },
  statI: { fontSize: 18, marginBottom: 2 },
  statSub: (c) => ({ fontSize: 11, color: c || Cl.txtL, marginTop: 4 }),
  statBar: { height: 4, background: Cl.brd, borderRadius: 2, marginTop: 4, overflow: "hidden" },
  statBarFill: (w, c) => ({ height: "100%", width: `${Math.min(100, w)}%`, background: c, borderRadius: 2 }),
  inlineStatusSel: { fontSize: 11, padding: "3px 6px", borderRadius: 6, border: `1px solid ${Cl.brd}`, background: Cl.wh, cursor: "pointer", fontWeight: 600 },

  // --- Modals ---
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" },
  modalC: { background: Cl.wh, borderRadius: 10, padding: 24, width: "92%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.18)" },

  // --- Alerts (border-left accent) ---
  alert: (t) => ({ padding: "9px 12px", borderRadius: 0, marginBottom: 8, fontSize: 12, fontWeight: 500, borderLeft: "3px solid", ...(t === "danger" ? { background: Cl.errL, color: Cl.err, borderColor: Cl.err } : t === "warning" ? { background: Cl.warnL, color: Cl.warn, borderColor: Cl.warn } : { background: Cl.okL, color: Cl.ok, borderColor: Cl.ok }) }),

  // --- Bandeau contextuel (en haut de fiche) ---
  banner: (bg, borderC, textC) => ({ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: bg, borderBottom: `1px solid ${borderC}30`, borderRadius: 0 }),
  bannerText: (c) => ({ fontSize: 13, fontWeight: 500, color: c }),
  bannerBtn: (bg, c) => ({ background: bg, color: c, border: "none", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: font }),

  // --- Chips ---
  chip: (sel) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 500, border: `1px solid ${sel ? Cl.pri : Cl.brd}`, background: sel ? Cl.priL : Cl.wh, color: sel ? Cl.pri : Cl.txt, margin: 2 }),

  // --- Progress ---
  barBox: { height: 6, background: Cl.hov, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  bar: (p, c) => ({ height: "100%", width: `${Math.min(100, p)}%`, background: c, borderRadius: 3, transition: "width 0.3s" }),

  // --- Misc ---
  link: { color: Cl.pri, textDecoration: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  section: { marginTop: 14, padding: "12px 16px", background: Cl.hov, borderRadius: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: Cl.txtL, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },

  // --- Auth ---
  authBg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, #0f172a 0%, ${Cl.slate} 50%, ${Cl.slateL} 100%)` },
  authCard: { background: "#fff", borderRadius: 10, padding: 40, maxWidth: 400, width: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" },
  authCenter: { textAlign: "center", marginBottom: 28 },
  authIcon: { fontSize: 36 },
  authTitle: { fontSize: 22, fontWeight: 700, margin: "10px 0 4px", letterSpacing: "-0.02em" },
  authSub: { fontSize: 13, color: Cl.txtL },
  authInp: { padding: "10px 14px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 14, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", marginTop: 6 },
  authBtnMain: { padding: "11px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: font, width: "100%", marginTop: 14, background: Cl.slate, color: "#fff" },
  authLbl: { fontSize: 12, fontWeight: 500, color: Cl.txtL },
  authLblBlock: { fontSize: 12, fontWeight: 500, color: Cl.txtL, marginTop: 12, display: "block" },
  authErr: { marginTop: 10, padding: 10, background: Cl.errL, borderRadius: 6, fontSize: 12, color: Cl.err },
  authLinks: { marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 6 },
  authLinkBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontFamily: font, color: Cl.pri, fontWeight: 500, padding: 4 },
  authMsgIcon: { fontSize: 40, marginBottom: 12 },
  authMsgH: { fontSize: 16, fontWeight: 600 },
  authMsgP: { fontSize: 13, color: Cl.txtL, marginTop: 8 },

  // --- Header ---
  hdrLeft: { display: "flex", alignItems: "center", gap: 12 },
  hdrLogo: { height: 34, borderRadius: 6, background: "#fff", padding: 2 },
  hdrLogoFb: { fontSize: 22 },
  hdrClub: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" },
  hdrSeason: { fontSize: 11, background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 5, padding: "3px 10px", cursor: "pointer" },
  hdrRight: { display: "flex", gap: 6, alignItems: "center" },
  hdrUser: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginRight: 4 },
  hdrBtn: { padding: "6px 12px", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "rgba(255,255,255,0.2)", color: "#fff" },

  // --- Pages ---
  pageH: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827" },
  filterBar: { marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" },
  filterInp: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, flex: 1, minWidth: 140, boxSizing: "border-box", outline: "none" },
  filterSel: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 12, fontFamily: font, background: Cl.wh, cursor: "pointer", width: "auto" },
  empty: { textAlign: "center", padding: 40, color: Cl.txtL, fontSize: 13 },

  // --- Company cards (simplifiées : nom + contact + 1 badge + 1 bouton contextuel) ---
  coCard: (bc) => ({ background: Cl.wh, borderRadius: 0, padding: "12px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginBottom: 1, border: `1px solid ${Cl.brd}`, cursor: "pointer", borderLeft: `3px solid ${bc || Cl.brd}` }),
  coName: { fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em" },
  coSub: { fontSize: 12, color: Cl.txtL, marginTop: 3 },
  coRight: { display: "flex", gap: 6, alignItems: "center" },
  coActions: { display: "flex", gap: 4 },

  // --- Call modal ---
  callSplit: { display: "flex", gap: 20, flexWrap: "wrap" },
  callCol: { flex: 1, minWidth: 280 },
  callPhone: { display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "12px 18px", background: Cl.ok, color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 18 },
  callResult: (saved) => ({ borderRadius: 8, padding: 14, marginTop: 12, background: saved ? Cl.okL : Cl.wh, border: saved ? `1px solid ${Cl.ok}` : `1px solid ${Cl.brd}` }),
  callScript: { flex: 1, minWidth: 280, background: Cl.hov, borderRadius: 8, padding: 14, border: `1px solid ${Cl.brd}`, maxHeight: 600, overflowY: "auto" },

  // --- Notes ---
  noteList: { maxHeight: 160, overflowY: "auto", marginTop: 6 },
  noteItem: { padding: "5px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 12 },
  noteDate: { fontWeight: 600, color: Cl.pri, marginRight: 8 },

  // --- Actions ---
  actItem: (done) => ({ background: Cl.wh, borderRadius: 6, padding: "7px 10px", marginBottom: 3, border: `1px solid ${Cl.brd}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: done ? 0.4 : 1 }),
  actCheck: { width: 14, height: 14, cursor: "pointer" },
  actText: { flex: 1, fontSize: 13 },

  // --- Contracts ---
  ctAmt: { fontSize: 15, fontWeight: 600, color: Cl.pri },
  ctMeta: { marginTop: 5, fontSize: 12, color: Cl.txtL, display: "flex", gap: 12 },
  ctStatusSel: (signed) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 4, fontWeight: 600, fontFamily: font, border: "none", cursor: "pointer", background: signed ? Cl.okL : Cl.warnL, color: signed ? Cl.ok : Cl.warn }),

  // --- Invoices ---
  invNum: (c) => ({ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: c || "inherit" }),
  invAmt: (c) => ({ fontSize: 15, fontWeight: 600, color: c || Cl.pri }),
  invMeta: { marginTop: 3, fontSize: 12, color: Cl.txtL, display: "flex", gap: 12 },

  // --- Payments ---
  payRow: (s) => (s === "En retard" ? { background: Cl.errL } : s === "Payé" ? { opacity: 0.45 } : {}),
  paySel: (s) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 4, fontWeight: 600, fontFamily: font, border: "none", cursor: "pointer", ...(s === "Payé" ? { background: Cl.okL, color: Cl.ok } : s === "En retard" ? { background: Cl.errL, color: Cl.err } : { background: Cl.warnL, color: Cl.warn }) }),

  // --- Delete zone ---
  delZone: { background: Cl.errL, padding: 16, borderRadius: 6, border: `1px solid ${Cl.err}` },
  delTitle: { fontSize: 13, fontWeight: 600, color: Cl.err, marginBottom: 6 },
  delText: { fontSize: 12, color: Cl.err, marginBottom: 10, lineHeight: 1.5 },
  delInp: { padding: "8px 10px", border: `1px solid ${Cl.err}`, borderRadius: 6, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 3, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none" },

  // --- Mécénat ---
  mecCard: { background: Cl.purL, borderRadius: 8, padding: 14, border: `1px solid ${Cl.pur}`, marginTop: 12 },
  mecTitle: { fontSize: 11, fontWeight: 600, color: Cl.pur, textTransform: "uppercase", letterSpacing: "0.04em" },
  mecVal: { fontSize: 22, fontWeight: 600, color: Cl.pur },
  mecInp: { padding: "7px 10px", border: `1px solid ${Cl.pur}`, borderRadius: 6, fontSize: 16, fontFamily: font, fontWeight: 700, width: "100%", boxSizing: "border-box", outline: "none" },

  // --- Dashboard type cards ---
  typeCard: (c) => ({ background: Cl.wh, borderRadius: 8, padding: 16, border: `1px solid ${c}`, textAlign: "center", marginBottom: 0 }),
  typeTitle: (c) => ({ fontSize: 11, fontWeight: 600, color: c, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }),
  typeVal: (c) => ({ fontSize: 22, fontWeight: 600, color: c }),
  typeSub: { fontSize: 11, color: Cl.txtL, marginTop: 4 },

  // --- Stacked bar ---
  stackBar: { display: "flex", borderRadius: 3, overflow: "hidden", height: 8, marginTop: 10 },
  stackSeg: (w, c) => ({ height: "100%", width: `${w}%`, background: c }),

  // --- Repass ---
  repassZone: { background: Cl.warnL, padding: 14, borderRadius: 6, border: `1px solid ${Cl.warn}` },
  repassH: { fontSize: 13, fontWeight: 600, marginBottom: 8 },

  // --- Subtotals ---
  subT: { textAlign: "right", marginTop: 4, fontSize: 13, fontWeight: 600, color: Cl.pri },
  subTL: { textAlign: "right", marginTop: 3, fontSize: 12, color: Cl.txtL },

  // --- Select all ---
  selAll: { marginTop: 8, fontSize: 12, color: Cl.txtL, display: "flex", alignItems: "center", gap: 8 },
  selCount: { fontWeight: 600, color: Cl.pri },

  // --- Admin ---
  roleColor: (r) => ({ superadmin: Cl.err, admin: Cl.pur, commercial: Cl.pri, readonly: Cl.txtL }[r] || Cl.txtL),

  // --- Accounting ---
  acctTbl: { width: "100%", borderCollapse: "collapse", fontSize: 11 },

  // --- Input widths ---
  inpW: (w) => ({ padding: "5px 7px", border: `1px solid ${Cl.brd}`, borderRadius: 5, fontSize: 12, fontFamily: font, width: w, boxSizing: "border-box", outline: "none" }),

  // --- Export / Season tabs ---
  exportList: { display: "flex", flexDirection: "column", gap: 8 },
  seasonTabs: { display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" },

  // --- Nav "Plus" dropdown ---
  navMore: { position: "relative", display: "inline-block" },
  navMoreMenu: { position: "absolute", top: "100%", right: 0, background: Cl.wh, border: `1px solid ${Cl.brd}`, borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 160, padding: "4px 0" },
  navMoreItem: { padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "block", width: "100%", border: "none", background: "transparent", fontFamily: font, color: Cl.txt, textAlign: "left" },
};
