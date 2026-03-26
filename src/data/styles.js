const font = `'Segoe UI', system-ui, -apple-system, sans-serif`;

// === PALETTE DE COULEURS ===
export const Cl = {
  bg: "#f4f6f9", wh: "#ffffff",
  pri: "#2563eb", priL: "#dbeafe", priD: "#1d4ed8",
  ok: "#16a34a", okL: "#dcfce7",
  warn: "#ea580c", warnL: "#fff7ed",
  err: "#dc2626", errL: "#fef2f2",
  pur: "#7c3aed", purL: "#ede9fe",
  txt: "#1e293b", txtL: "#64748b", txtXL: "#94a3b8",
  brd: "#e2e8f0", hov: "#f1f5f9",
};

export const S = {
  // --- Layout ---
  app: { fontFamily: font, background: Cl.bg, minHeight: "100vh", color: Cl.txt, lineHeight: 1.5 },
  header: { background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  nav: { display: "flex", gap: 2, padding: "8px 24px", background: Cl.wh, borderBottom: `1px solid ${Cl.brd}`, flexWrap: "wrap" },
  navB: (a) => ({ padding: "8px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: a ? 700 : 500, fontSize: 13, fontFamily: font, background: a ? Cl.priL : "transparent", color: a ? Cl.pri : Cl.txtL }),
  main: { padding: "20px 24px", maxWidth: 1200, margin: "0 auto" },

  // --- Cards ---
  card: { background: Cl.wh, borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 14, border: `1px solid ${Cl.brd}` },
  cT: { fontSize: 15, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 },

  // --- Tables ---
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px", borderBottom: `2px solid ${Cl.brd}`, fontWeight: 600, color: Cl.txtL, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3px" },
  thR: { textAlign: "right", padding: "10px", borderBottom: `2px solid ${Cl.brd}`, fontWeight: 600, color: Cl.txtL, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3px" },
  td: { padding: "10px", borderBottom: `1px solid ${Cl.brd}` },
  tdR: { padding: "10px", borderBottom: `1px solid ${Cl.brd}`, textAlign: "right" },

  // --- Badge ---
  badge: (c, bg) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600, color: c, background: bg, marginRight: 4 }),

  // --- Buttons ---
  btn: (v) => ({ padding: "8px 16px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: font, ...(v === "primary" ? { background: Cl.pri, color: "#fff" } : v === "success" ? { background: Cl.ok, color: "#fff" } : { background: Cl.hov, color: Cl.txt, border: `1px solid ${Cl.brd}` }) }),
  btnS: (v) => ({ padding: "5px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, ...(v === "ghost" ? { background: "transparent", color: Cl.pri } : { background: Cl.priL, color: Cl.pri }) }),
  btnConvert: { padding: "5px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: font, background: Cl.ok, color: "#fff" },
  btnCall: { padding: "5px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: font, background: "#dcfce7", color: Cl.ok },
  btnDelete: { padding: "3px 8px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "transparent", color: Cl.err },

  // --- Inputs ---
  inp: { padding: "8px 12px", border: `1.5px solid ${Cl.brd}`, borderRadius: 10, fontSize: 14, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none" },
  sel: { padding: "8px 12px", border: `1.5px solid ${Cl.brd}`, borderRadius: 10, fontSize: 14, fontFamily: font, width: "100%", boxSizing: "border-box", background: Cl.wh, cursor: "pointer" },
  lbl: { fontSize: 11, fontWeight: 600, color: Cl.txtL, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.3px" },

  // --- Grid ---
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  g4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  fx: { display: "flex", justifyContent: "space-between", alignItems: "center" },

  // --- Stats ---
  stat: { textAlign: "center", padding: 14 },

  // --- Modals ---
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalC: { background: Cl.wh, borderRadius: 18, padding: 26, width: "92%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 65px rgba(0,0,0,0.2)" },

  // --- Alerts ---
  alert: (t) => ({ padding: "10px 14px", borderRadius: 10, marginBottom: 10, fontSize: 13, fontWeight: 500, ...(t === "danger" ? { background: Cl.errL, color: Cl.err } : t === "warning" ? { background: Cl.warnL, color: Cl.warn } : { background: Cl.okL, color: Cl.ok }) }),

  // --- Chips ---
  chip: (sel) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 500, border: `2px solid ${sel ? Cl.pri : Cl.brd}`, background: sel ? Cl.priL : Cl.wh, color: sel ? Cl.pri : Cl.txt, margin: 2 }),

  // --- Progress ---
  barBox: { height: 8, background: Cl.hov, borderRadius: 6, overflow: "hidden", marginTop: 4 },
  bar: (p, c) => ({ height: "100%", width: `${Math.min(100, p)}%`, background: c, borderRadius: 6, transition: "width 0.3s" }),

  // --- Misc ---
  link: { color: Cl.pri, textDecoration: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  section: { marginTop: 16, padding: "14px 18px", background: Cl.hov, borderRadius: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: Cl.txtL, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  // =========================================
  //  STYLES EXTRAITS — AUTH
  // =========================================
  authBg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" },
  authCard: { background: "#fff", borderRadius: 20, padding: 40, maxWidth: 420, width: "90%", boxShadow: "0 25px 65px rgba(0,0,0,0.25)" },
  authCenter: { textAlign: "center", marginBottom: 28 },
  authIcon: { fontSize: 44 },
  authTitle: { fontSize: 26, fontWeight: 800, margin: "8px 0 4px" },
  authSub: { fontSize: 14, color: Cl.txtL },
  authInp: { padding: "12px 16px", border: `1.5px solid ${Cl.brd}`, borderRadius: 12, fontSize: 16, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", marginTop: 6 },
  authBtnMain: { padding: "14px", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: font, width: "100%", marginTop: 14, background: Cl.pri, color: "#fff" },
  authLbl: { fontSize: 13, fontWeight: 600, color: Cl.txtL },
  authLblBlock: { fontSize: 13, fontWeight: 600, color: Cl.txtL, marginTop: 12, display: "block" },
  authErr: { marginTop: 12, padding: 12, background: Cl.errL, borderRadius: 10, fontSize: 13, color: Cl.err },
  authLinks: { marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 },
  authLinkBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontFamily: font, color: Cl.pri, fontWeight: 500, padding: 4 },
  authMsgIcon: { fontSize: 52, marginBottom: 14 },
  authMsgH: { fontSize: 18, fontWeight: 700 },
  authMsgP: { fontSize: 14, color: Cl.txtL, marginTop: 10 },

  // =========================================
  //  STYLES EXTRAITS — HEADER
  // =========================================
  hdrLeft: { display: "flex", alignItems: "center", gap: 12 },
  hdrLogo: { height: 40, borderRadius: 8, background: "#fff", padding: 3 },
  hdrLogoFb: { fontSize: 28 },
  hdrClub: { fontSize: 18, fontWeight: 700 },
  hdrSeason: { fontSize: 12, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "3px 8px", cursor: "pointer" },
  hdrRight: { display: "flex", gap: 8, alignItems: "center" },
  hdrUser: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginRight: 6 },
  hdrBtn: { padding: "6px 10px", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "rgba(255,255,255,0.12)", color: "#fff" },

  // =========================================
  //  STYLES EXTRAITS — PAGES
  // =========================================
  pageH: { fontSize: 18, fontWeight: 700 },
  filterBar: { marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" },
  filterInp: { padding: "8px 12px", border: `1.5px solid ${Cl.brd}`, borderRadius: 10, fontSize: 14, fontFamily: font, flex: 1, minWidth: 140, boxSizing: "border-box", outline: "none" },
  filterSel: { padding: "8px 12px", border: `1.5px solid ${Cl.brd}`, borderRadius: 10, fontSize: 13, fontFamily: font, background: Cl.wh, cursor: "pointer", width: "auto" },
  empty: { textAlign: "center", padding: 40, color: Cl.txtL, fontSize: 14 },

  // --- Company cards ---
  coCard: (bc) => ({ background: Cl.wh, borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 10, border: `1px solid ${Cl.brd}`, cursor: "pointer", borderLeft: `4px solid ${bc || Cl.brd}` }),
  coName: { fontSize: 14, fontWeight: 700 },
  coSector: { color: Cl.txtL, fontSize: 12 },
  coMeta: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, fontSize: 12 },
  coNote: { marginTop: 6, fontSize: 12, color: Cl.txtL, fontStyle: "italic" },
  coActions: { display: "flex", gap: 6 },

  // --- Stat values ---
  statV: (c) => ({ fontSize: 26, fontWeight: 800, color: c || Cl.pri }),
  statL: { fontSize: 11, color: Cl.txtL, marginTop: 2 },
  statI: { fontSize: 22, marginBottom: 2 },

  // --- Call modal ---
  callSplit: { display: "flex", gap: 20, flexWrap: "wrap" },
  callCol: { flex: 1, minWidth: 280 },
  callPhone: { display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "14px 20px", background: Cl.ok, color: "#fff", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 20 },
  callResult: (saved) => ({ borderRadius: 12, padding: 16, marginTop: 12, background: saved ? Cl.okL : Cl.wh, border: saved ? `2px solid ${Cl.ok}` : `1.5px solid ${Cl.brd}` }),
  callScript: { flex: 1, minWidth: 280, background: Cl.hov, borderRadius: 12, padding: 16, border: `1px solid ${Cl.brd}`, maxHeight: 600, overflowY: "auto" },

  // --- Notes ---
  noteList: { maxHeight: 160, overflowY: "auto", marginTop: 6 },
  noteItem: { padding: "6px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 12 },
  noteDate: { fontWeight: 600, color: Cl.pri, marginRight: 8 },

  // --- Actions ---
  actItem: (done) => ({ ...{ background: Cl.wh, borderRadius: 10, padding: "8px 12px", marginBottom: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }, opacity: done ? 0.45 : 1 }),
  actCheck: { width: 16, height: 16, cursor: "pointer" },
  actText: { flex: 1, fontSize: 13 },

  // --- Contracts ---
  ctAmt: { fontSize: 16, fontWeight: 800, color: Cl.pri },
  ctMeta: { marginTop: 6, fontSize: 12, color: Cl.txtL, display: "flex", gap: 12 },
  ctStatusSel: (signed) => ({ fontSize: 11, padding: "4px 8px", borderRadius: 14, fontWeight: 700, fontFamily: font, border: "none", cursor: "pointer", background: signed ? Cl.okL : Cl.warnL, color: signed ? Cl.ok : Cl.warn }),

  // --- Invoices ---
  invNum: (c) => ({ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: c || "inherit" }),
  invAmt: (c) => ({ fontSize: 16, fontWeight: 800, color: c || Cl.pri }),
  invMeta: { marginTop: 4, fontSize: 12, color: Cl.txtL, display: "flex", gap: 12 },

  // --- Payments ---
  payRow: (s) => (s === "En retard" ? { background: Cl.errL } : s === "Payé" ? { opacity: 0.5 } : {}),
  paySel: (s) => ({ fontSize: 12, padding: "4px 8px", borderRadius: 14, fontWeight: 600, fontFamily: font, border: "none", cursor: "pointer", ...(s === "Payé" ? { background: Cl.okL, color: Cl.ok } : s === "En retard" ? { background: Cl.errL, color: Cl.err } : { background: Cl.warnL, color: Cl.warn }) }),

  // --- Delete zone ---
  delZone: { background: Cl.errL, padding: 16, borderRadius: 12, border: `2px solid ${Cl.err}` },
  delTitle: { fontSize: 14, fontWeight: 700, color: Cl.err, marginBottom: 8 },
  delText: { fontSize: 12, color: Cl.err, marginBottom: 10, lineHeight: 1.5 },
  delInp: { padding: "8px 12px", border: `2px solid ${Cl.err}`, borderRadius: 10, textAlign: "center", fontSize: 15, fontWeight: 700, letterSpacing: 3, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none" },

  // --- Mécénat ---
  mecCard: { background: Cl.purL, borderRadius: 12, padding: 16, border: `2px solid ${Cl.pur}`, marginTop: 12 },
  mecTitle: { fontSize: 12, fontWeight: 700, color: Cl.pur, textTransform: "uppercase" },
  mecVal: { fontSize: 26, fontWeight: 800, color: Cl.pur },
  mecInp: { padding: "8px 12px", border: `1.5px solid ${Cl.pur}`, borderRadius: 10, fontSize: 18, fontFamily: font, fontWeight: 700, width: "100%", boxSizing: "border-box", outline: "none" },

  // --- Dashboard type cards ---
  typeCard: (c) => ({ background: Cl.wh, borderRadius: 14, padding: 18, border: `2px solid ${c}`, textAlign: "center", marginBottom: 0 }),
  typeTitle: (c) => ({ fontSize: 12, fontWeight: 700, color: c, marginBottom: 6, textTransform: "uppercase" }),
  typeVal: (c) => ({ fontSize: 24, fontWeight: 800, color: c }),
  typeSub: { fontSize: 11, color: Cl.txtL, marginTop: 6 },

  // --- Stacked bar ---
  stackBar: { display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginTop: 10 },
  stackSeg: (w, c) => ({ height: "100%", width: `${w}%`, background: c }),

  // --- Repass ---
  repassZone: { background: Cl.warnL, padding: 14, borderRadius: 12, border: `1px solid ${Cl.warn}` },
  repassH: { fontSize: 13, fontWeight: 700, marginBottom: 8 },

  // --- Subtotals ---
  subT: { textAlign: "right", marginTop: 6, fontSize: 14, fontWeight: 700, color: Cl.pri },
  subTL: { textAlign: "right", marginTop: 4, fontSize: 13, color: Cl.txtL },

  // --- Select all ---
  selAll: { marginTop: 8, fontSize: 12, color: Cl.txtL, display: "flex", alignItems: "center", gap: 8 },
  selCount: { fontWeight: 700, color: Cl.pri },

  // --- Admin role colors ---
  roleColor: (r) => ({ superadmin: Cl.err, admin: Cl.pur, commercial: Cl.pri, readonly: Cl.txtL }[r] || Cl.txtL),

  // --- Accounting ---
  acctTbl: { width: "100%", borderCollapse: "collapse", fontSize: 11 },

  // --- Input widths ---
  inpW: (w) => ({ padding: "5px 8px", border: `1.5px solid ${Cl.brd}`, borderRadius: 8, fontSize: 12, fontFamily: font, width: w, boxSizing: "border-box", outline: "none" }),

  // --- Export ---
  exportList: { display: "flex", flexDirection: "column", gap: 10 },
};
