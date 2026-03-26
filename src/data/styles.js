const font = `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`;

// === PALETTE PREMIUM — tons sourds, pro, contrastés ===
export const Cl = {
  bg: "#f8f9fb", wh: "#ffffff",
  pri: "#3b5998", priL: "#eef1f7", priD: "#2d4373",
  ok: "#2e7d5b", okL: "#e8f5ee",
  warn: "#c2710c", warnL: "#fdf5e8",
  err: "#b93a3a", errL: "#fdf0f0",
  pur: "#6b4fa0", purL: "#f0ecf7",
  txt: "#1a1d23", txtL: "#6b7280", txtXL: "#9ca3af",
  brd: "#e5e7eb", hov: "#f3f4f6",
};

export const S = {
  // --- Layout ---
  app: { fontFamily: font, background: Cl.bg, minHeight: "100vh", color: Cl.txt, lineHeight: 1.55, WebkitFontSmoothing: "antialiased" },
  header: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  nav: { display: "flex", gap: 1, padding: "0 28px", background: Cl.wh, borderBottom: `1px solid ${Cl.brd}`, flexWrap: "wrap" },
  navB: (a) => ({ padding: "11px 16px", border: "none", borderBottom: a ? "2px solid #1e293b" : "2px solid transparent", cursor: "pointer", fontWeight: a ? 600 : 450, fontSize: 13, fontFamily: font, background: "transparent", color: a ? "#1e293b" : Cl.txtL, letterSpacing: "-0.01em", transition: "all 0.15s" }),
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
  badge: (c, bg) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: c, background: bg, marginRight: 4, letterSpacing: "-0.01em" }),

  // --- Buttons ---
  btn: (v) => ({ padding: "7px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13, fontFamily: font, letterSpacing: "-0.01em", transition: "all 0.12s", ...(v === "primary" ? { background: "#1e293b", color: "#fff" } : v === "success" ? { background: Cl.ok, color: "#fff" } : { background: Cl.wh, color: Cl.txt, border: `1px solid ${Cl.brd}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }) }),
  btnS: (v) => ({ padding: "4px 10px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, letterSpacing: "-0.01em", transition: "all 0.12s", ...(v === "ghost" ? { background: "transparent", color: Cl.pri } : { background: Cl.priL, color: Cl.pri }) }),
  btnConvert: { padding: "5px 12px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: font, background: Cl.ok, color: "#fff", letterSpacing: "-0.01em" },
  btnCall: { padding: "5px 12px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: font, background: Cl.okL, color: Cl.ok, border: `1px solid ${Cl.ok}22`, letterSpacing: "-0.01em" },
  btnDelete: { padding: "3px 8px", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "transparent", color: Cl.err },

  // --- Inputs ---
  inp: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", background: Cl.wh, transition: "border-color 0.15s" },
  sel: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, width: "100%", boxSizing: "border-box", background: Cl.wh, cursor: "pointer" },
  lbl: { fontSize: 11, fontWeight: 500, color: Cl.txtL, marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" },

  // --- Grid ---
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  g4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  fx: { display: "flex", justifyContent: "space-between", alignItems: "center" },

  // --- Stats ---
  stat: { textAlign: "center", padding: 14 },

  // --- Modals ---
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" },
  modalC: { background: Cl.wh, borderRadius: 10, padding: 24, width: "92%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.18)" },

  // --- Alerts ---
  alert: (t) => ({ padding: "9px 12px", borderRadius: 6, marginBottom: 8, fontSize: 12, fontWeight: 500, borderLeft: `3px solid`, ...(t === "danger" ? { background: Cl.errL, color: Cl.err, borderColor: Cl.err } : t === "warning" ? { background: Cl.warnL, color: Cl.warn, borderColor: Cl.warn } : { background: Cl.okL, color: Cl.ok, borderColor: Cl.ok }) }),

  // --- Chips ---
  chip: (sel) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 500, border: `1px solid ${sel ? Cl.pri : Cl.brd}`, background: sel ? Cl.priL : Cl.wh, color: sel ? Cl.pri : Cl.txt, margin: 2, transition: "all 0.12s" }),

  // --- Progress ---
  barBox: { height: 6, background: Cl.hov, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  bar: (p, c) => ({ height: "100%", width: `${Math.min(100, p)}%`, background: c, borderRadius: 3, transition: "width 0.3s" }),

  // --- Misc ---
  link: { color: Cl.pri, textDecoration: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  section: { marginTop: 14, padding: "12px 16px", background: Cl.hov, borderRadius: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: Cl.txtL, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },

  // =========================================
  //  AUTH
  // =========================================
  authBg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)" },
  authCard: { background: "#fff", borderRadius: 10, padding: 40, maxWidth: 400, width: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" },
  authCenter: { textAlign: "center", marginBottom: 28 },
  authIcon: { fontSize: 36 },
  authTitle: { fontSize: 22, fontWeight: 700, margin: "10px 0 4px", letterSpacing: "-0.02em" },
  authSub: { fontSize: 13, color: Cl.txtL },
  authInp: { padding: "10px 14px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 14, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none", marginTop: 6 },
  authBtnMain: { padding: "11px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: font, width: "100%", marginTop: 14, background: "#1e293b", color: "#fff", letterSpacing: "-0.01em" },
  authLbl: { fontSize: 12, fontWeight: 500, color: Cl.txtL },
  authLblBlock: { fontSize: 12, fontWeight: 500, color: Cl.txtL, marginTop: 12, display: "block" },
  authErr: { marginTop: 10, padding: 10, background: Cl.errL, borderRadius: 6, fontSize: 12, color: Cl.err },
  authLinks: { marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 6 },
  authLinkBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontFamily: font, color: Cl.pri, fontWeight: 500, padding: 4 },
  authMsgIcon: { fontSize: 40, marginBottom: 12 },
  authMsgH: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  authMsgP: { fontSize: 13, color: Cl.txtL, marginTop: 8 },

  // =========================================
  //  HEADER
  // =========================================
  hdrLeft: { display: "flex", alignItems: "center", gap: 12 },
  hdrLogo: { height: 34, borderRadius: 6, background: "#fff", padding: 2 },
  hdrLogoFb: { fontSize: 22 },
  hdrClub: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" },
  hdrSeason: { fontSize: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" },
  hdrRight: { display: "flex", gap: 6, alignItems: "center" },
  hdrUser: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginRight: 4 },
  hdrBtn: { padding: "5px 8px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 5, cursor: "pointer", fontWeight: 500, fontSize: 12, fontFamily: font, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" },

  // =========================================
  //  PAGES
  // =========================================
  pageH: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827" },
  filterBar: { marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" },
  filterInp: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 13, fontFamily: font, flex: 1, minWidth: 140, boxSizing: "border-box", outline: "none" },
  filterSel: { padding: "7px 10px", border: `1px solid ${Cl.brd}`, borderRadius: 6, fontSize: 12, fontFamily: font, background: Cl.wh, cursor: "pointer", width: "auto" },
  empty: { textAlign: "center", padding: 40, color: Cl.txtL, fontSize: 13 },

  // --- Company cards ---
  coCard: (bc) => ({ background: Cl.wh, borderRadius: 8, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginBottom: 8, border: `1px solid ${Cl.brd}`, cursor: "pointer", borderLeft: `3px solid ${bc || Cl.brd}`, transition: "box-shadow 0.12s" }),
  coName: { fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" },
  coSector: { color: Cl.txtL, fontSize: 12 },
  coMeta: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 5, fontSize: 12 },
  coNote: { marginTop: 5, fontSize: 12, color: Cl.txtL, fontStyle: "italic" },
  coActions: { display: "flex", gap: 4 },

  // --- Stat values ---
  statV: (c) => ({ fontSize: 22, fontWeight: 700, color: c || Cl.pri, letterSpacing: "-0.02em" }),
  statL: { fontSize: 11, color: Cl.txtL, marginTop: 2 },
  statI: { fontSize: 18, marginBottom: 2 },

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
  ctAmt: { fontSize: 15, fontWeight: 700, color: Cl.pri, letterSpacing: "-0.01em" },
  ctMeta: { marginTop: 5, fontSize: 12, color: Cl.txtL, display: "flex", gap: 12 },
  ctStatusSel: (signed) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 4, fontWeight: 600, fontFamily: font, border: "none", cursor: "pointer", background: signed ? Cl.okL : Cl.warnL, color: signed ? Cl.ok : Cl.warn }),

  // --- Invoices ---
  invNum: (c) => ({ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: c || "inherit" }),
  invAmt: (c) => ({ fontSize: 15, fontWeight: 700, color: c || Cl.pri }),
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
  mecVal: { fontSize: 22, fontWeight: 700, color: Cl.pur, letterSpacing: "-0.02em" },
  mecInp: { padding: "7px 10px", border: `1px solid ${Cl.pur}`, borderRadius: 6, fontSize: 16, fontFamily: font, fontWeight: 700, width: "100%", boxSizing: "border-box", outline: "none" },

  // --- Dashboard type cards ---
  typeCard: (c) => ({ background: Cl.wh, borderRadius: 8, padding: 16, border: `1px solid ${c}`, textAlign: "center", marginBottom: 0 }),
  typeTitle: (c) => ({ fontSize: 11, fontWeight: 600, color: c, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }),
  typeVal: (c) => ({ fontSize: 22, fontWeight: 700, color: c, letterSpacing: "-0.02em" }),
  typeSub: { fontSize: 11, color: Cl.txtL, marginTop: 4 },

  // --- Stacked bar ---
  stackBar: { display: "flex", borderRadius: 4, overflow: "hidden", height: 10, marginTop: 10 },
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

  // --- Admin role colors ---
  roleColor: (r) => ({ superadmin: Cl.err, admin: Cl.pur, commercial: Cl.pri, readonly: Cl.txtL }[r] || Cl.txtL),

  // --- Accounting ---
  acctTbl: { width: "100%", borderCollapse: "collapse", fontSize: 11 },

  // --- Input widths ---
  inpW: (w) => ({ padding: "5px 7px", border: `1px solid ${Cl.brd}`, borderRadius: 5, fontSize: 12, fontFamily: font, width: w, boxSizing: "border-box", outline: "none" }),

  // --- Export ---
  exportList: { display: "flex", flexDirection: "column", gap: 8 },

  // --- Season tabs ---
  seasonTabs: { display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" },
};
