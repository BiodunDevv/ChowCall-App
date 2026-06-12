"use client";

import { useEffect, useState, useCallback } from "react";
import { Iphone } from "@/components/ui/iphone";
import Image from "next/image";

// ─── Constants ────────────────────────────────────────────────────────────────
// Dynamic island occupies ~0–5.66% of screen height.
// Status bar sits from 6% → 12%. Safe content starts at ~13%.
// All pixel sizes here are tuned for a ~230px wide phone render.

const PRIMARY = "#00786f";
const SURFACE = "#1a2234";
const DEEP = "#0d1320";

// ─── Status Bar ───────────────────────────────────────────────────────────────
// Sits BELOW the dynamic island (~6% from top of screen area).

function StatusBar({ time = "9:41" }: { time?: string }) {
  return (
    <div
      className="flex items-center justify-between px-3.5"
      style={{ paddingTop: "6.5%", paddingBottom: "1.5%" }}
    >
      <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}>
        {time}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {/* Cellular bars */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0"   y="6" width="2.5" height="4" rx="0.5" fill="white" fillOpacity="0.35"/>
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill="white" fillOpacity="0.6"/>
          <rect x="7"   y="2" width="2.5" height="8" rx="0.5" fill="white" fillOpacity="0.85"/>
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="white"/>
        </svg>
        {/* WiFi */}
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <circle cx="6" cy="8" r="1" fill="white"/>
          <path d="M3.5 5.5 Q6 3 8.5 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <path d="M1.5 3.5 Q6 0 10.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.45"/>
        </svg>
        {/* Battery */}
        <svg width="21" height="10" viewBox="0 0 21 10" fill="none">
          <rect x="0.5" y="0.5" width="17" height="9" rx="2" stroke="white" strokeOpacity="0.45" strokeWidth="1"/>
          <rect x="1.5" y="1.5" width="13" height="7" rx="1.5" fill="white" fillOpacity="0.9"/>
          <path d="M18.5 3.5v3a1.5 1.5 0 0 0 0-3z" fill="white" fillOpacity="0.45"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />;
}

// ─── CallBar (used by screens 2–6) ───────────────────────────────────────────

function CallBar({ subtitle, time }: { subtitle: string; time: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", background: "rgba(30,41,59,0.55)", flexShrink: 0 }}>
      <div>
        <p style={{ fontSize: "9.5px", fontWeight: 700, color: "white", lineHeight: 1.3 }}>Mama&apos;s Kitchen Demo</p>
        <p style={{ fontSize: "8px", color: PRIMARY, marginTop: "1px" }}>● {subtitle} · {time}</p>
      </div>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${PRIMARY}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Image src="/chowcall-logo.png" alt="" width={14} height={14} style={{ width: 14, height: 14, objectFit: "contain" }} />
      </div>
    </div>
  );
}

// ─── ScreenWrap ───────────────────────────────────────────────────────────────

function ScreenWrap({ children, bg = DEEP }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: bg, overflow: "hidden", userSelect: "none" }}>
      {children}
    </div>
  );
}

// ─── Waveform bar ─────────────────────────────────────────────────────────────

function WaveBar({ wave }: { wave: number }) {
  const heights = [3, 5, 8, 4, 9, 5, 3, 7, 4, 6];
  return (
    <div style={{ margin: "0 10px 8px", display: "flex", alignItems: "center", gap: "6px", background: SURFACE, borderRadius: "10px", padding: "7px 10px", flexShrink: 0 }}>
      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", flex: 1 }}>Listening…</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "2px" }}>
        {heights.map((h, i) => (
          <span
            key={i}
            style={{
              width: "2px",
              borderRadius: "2px",
              background: `${PRIMARY}cc`,
              height: `${Math.abs(Math.sin(wave * 0.12 + i * 0.7)) * h + 2}px`,
              transition: "height 0.1s ease",
              display: "block",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AI bubble ────────────────────────────────────────────────────────────────

function AiBubble({ text, cursor = false }: { text: string; cursor?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", padding: "0 10px" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${PRIMARY}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
        <Image src="/chowcall-logo.png" alt="" width={12} height={12} style={{ width: 12, height: 12, objectFit: "contain" }} />
      </div>
      <div style={{ maxWidth: "82%", background: SURFACE, borderRadius: "12px", borderTopLeftRadius: "4px", padding: "7px 10px" }}>
        <p style={{ fontSize: "9px", lineHeight: 1.65, color: "rgba(255,255,255,0.88)", margin: 0 }}>
          {text}
          {cursor && <span style={{ display: "inline-block", width: "1.5px", height: "9px", background: PRIMARY, marginLeft: "2px", verticalAlign: "middle", animation: "pulse 1s infinite" }} />}
        </p>
      </div>
    </div>
  );
}

// ─── Step 1: Incoming call ────────────────────────────────────────────────────

function IncomingCallScreen() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <ScreenWrap bg={`linear-gradient(180deg, #0d1a2e 0%, ${DEEP} 100%)`}>
      <StatusBar time="9:41" />
      <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 20px" }}>
        {/* Top label */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
            Incoming call
          </p>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "white", marginTop: "3px", letterSpacing: "-0.01em" }}>
            +234 901 234 5678
          </p>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>Customer</p>
        </div>

        {/* Pulsing logo avatar */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {[2.6, 2.0, 1.5].map((scale, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                borderRadius: "50%",
                border: `1px solid ${PRIMARY}`,
                width: `${scale * 28}px`,
                height: `${scale * 28}px`,
                opacity: Math.max(0, Math.sin(tick * 0.06 - i * 1.1) * 0.35 + 0.12),
                transition: "opacity 0.09s",
              }}
            />
          ))}
          <div style={{ position: "relative", zIndex: 2, width: "56px", height: "56px", borderRadius: "50%", background: `${PRIMARY}18`, border: `2px solid ${PRIMARY}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/chowcall-logo.png" alt="ChowCall" width={30} height={30} style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
        </div>

        {/* AI badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "20px", padding: "5px 10px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: PRIMARY, display: "inline-block", animation: "pulse 1.2s infinite" }} />
          <span style={{ fontSize: "8.5px", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>ChowCall AI is answering…</span>
        </div>

        {/* Call action buttons */}
        <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-around" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <button style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {/* End call icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.06-.2 1.1.37 2.3.57 3.54.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.6 21 3 13.4 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.54.11.36.02.78-.2 1.06L6.6 10.8z"/>
              </svg>
            </button>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>Decline</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <button style={{ width: "48px", height: "48px", borderRadius: "50%", background: PRIMARY, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.06-.2 1.1.37 2.3.57 3.54.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.6 21 3 13.4 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.54.11.36.02.78-.2 1.06L6.6 10.8z"/>
              </svg>
            </button>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>Answer</span>
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── Step 2: AI greeting ──────────────────────────────────────────────────────

function AiGreetingScreen() {
  const fullText = "Welcome to Mama's Kitchen! I'm your AI order assistant. Are you ordering for pickup or delivery today?";
  const [idx, setIdx] = useState(0);
  const [wave, setWave] = useState(0);

  useEffect(() => {
    if (idx < fullText.length) {
      const t = setTimeout(() => setIdx((i) => i + 1), 30);
      return () => clearTimeout(t);
    }
  }, [idx, fullText.length]);

  useEffect(() => {
    const t = setInterval(() => setWave((w) => w + 1), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <ScreenWrap>
      <StatusBar time="9:41" />
      <Divider />
      <CallBar subtitle="Call in progress" time="0:08" />
      <Divider />
      <div style={{ flex: 1, overflowY: "hidden", padding: "10px 0 6px" }}>
        <AiBubble text={fullText.slice(0, idx)} cursor={idx < fullText.length} />
      </div>
      <WaveBar wave={wave} />
    </ScreenWrap>
  );
}

// ─── Step 3: Order being built ────────────────────────────────────────────────

function OrderBuildingScreen() {
  const items = [
    { name: "2 × Jollof Rice + Chicken", price: "₦9,000" },
    { name: "1 × Chapman",               price: "₦1,500" },
    { name: "Extra Plantain",            price: "₦700"   },
  ];
  const [visible, setVisible] = useState(0);
  const [wave, setWave] = useState(0);

  useEffect(() => {
    if (visible >= items.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1100);
    return () => clearTimeout(t);
  }, [visible, items.length]);

  useEffect(() => {
    const t = setInterval(() => setWave((w) => w + 1), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <ScreenWrap>
      <StatusBar time="9:43" />
      <Divider />
      <CallBar subtitle="Taking order" time="1:24" />
      <Divider />
      <div style={{ flex: 1, overflowY: "hidden", padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <AiBubble text="Got it! Building your order as you speak…" />
        {/* Order card */}
        <div style={{ margin: "0 10px", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.06)`, background: SURFACE, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Your order</span>
            {visible < items.length && (
              <div style={{ display: "flex", gap: "3px" }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: PRIMARY, display: "inline-block", animation: `bounce 0.6s ${i*0.12}s infinite` }} />
                ))}
              </div>
            )}
            {visible === items.length && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>
          <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: "7px" }}>
            {visible === 0 && (
              <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Items will appear here…</p>
            )}
            {items.slice(0, visible).map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeSlideIn 0.3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.82)" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, color: PRIMARY }}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <WaveBar wave={wave} />
    </ScreenWrap>
  );
}

// ─── Step 4: Calculating fees ─────────────────────────────────────────────────

function CalculatingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2600),
      setTimeout(() => setStep(4), 3600),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const rows = [
    { label: "Food subtotal",    value: "₦11,200", on: step >= 1 },
    { label: "Delivery · 6.2km", value: "₦2,300",  on: step >= 2 },
    { label: "Service fee (5%)", value: "₦560",    on: step >= 3 },
  ];

  return (
    <ScreenWrap>
      <StatusBar time="9:45" />
      <Divider />
      <CallBar subtitle="Calculating fees" time="2:41" />
      <Divider />
      <div style={{ flex: 1, overflowY: "hidden", padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <AiBubble text="Calculating your delivery fee using real Mapbox distance…" />
        <div style={{ margin: "0 10px", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.06)`, background: SURFACE, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Price breakdown</span>
            {step < 4 && (
              <div style={{ display: "flex", gap: "3px" }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: PRIMARY, display: "inline-block", animation: `bounce 0.6s ${i*0.12}s infinite` }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "7px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {rows.map((row) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  {row.on ? (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", display: "inline-block" }} />
                  )}
                  <span style={{ fontSize: "9px", color: row.on ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.28)" }}>{row.label}</span>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 600, color: row.on ? "white" : "rgba(255,255,255,0.18)" }}>{row.value}</span>
              </div>
            ))}
            {step >= 4 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "7px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeSlideIn 0.35s ease" }}>
                <span style={{ fontSize: "9.5px", fontWeight: 700, color: "white" }}>Total payable</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: PRIMARY }}>₦14,060</span>
              </div>
            )}
          </div>
        </div>
        {step >= 4 && (
          <div style={{ animation: "fadeSlideIn 0.35s ease" }}>
            <AiBubble text="Your total is ₦14,060. Send payment link to 0901 234 5678?" />
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── Step 5: Payment sent ─────────────────────────────────────────────────────

function PaymentSentScreen() {
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPaid(true), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenWrap>
      <StatusBar time="9:46" />
      <Divider />
      <CallBar subtitle="Awaiting payment" time="3:02" />
      <Divider />
      <div style={{ flex: 1, overflowY: "hidden", padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <AiBubble text="Payment link sent to your email. You have 15 minutes to complete payment." />
        {/* Email preview */}
        <div style={{ margin: "0 10px", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.06)`, background: SURFACE, padding: "8px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✉️</div>
            <div>
              <p style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Email · ChowCall</p>
              <p style={{ fontSize: "7px", color: "rgba(255,255,255,0.28)" }}>just now</p>
            </div>
          </div>
          <p style={{ fontSize: "8.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
            Complete your Mama&apos;s Kitchen order payment — ₦14,060:{" "}
            <span style={{ color: PRIMARY, textDecoration: "underline" }}>pay.chowcall.ng/cc-1048</span>
            {" "}· Expires 15 min
          </p>
        </div>
        {/* Status */}
        {!paid ? (
          <div style={{ margin: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "10px", border: "1px solid rgba(234,179,8,0.25)", background: "rgba(234,179,8,0.08)", padding: "8px 10px" }}>
            <span style={{ fontSize: "8.5px", color: "rgb(234,179,8)" }}>Waiting for payment…</span>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgb(234,179,8)", animation: "pulse 1.2s infinite" }} />
          </div>
        ) : (
          <div style={{ margin: "0 10px", borderRadius: "10px", border: `1px solid ${PRIMARY}44`, background: `${PRIMARY}12`, padding: "9px 10px", animation: "fadeSlideIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span style={{ fontSize: "9px", fontWeight: 700, color: PRIMARY }}>Payment confirmed!</span>
            </div>
            <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.38)" }}>Paystack webhook verified · Order CC-1048</p>
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}

// ─── Step 6: Kitchen ticket ───────────────────────────────────────────────────

function KitchenTicketScreen() {
  return (
    <ScreenWrap>
      <StatusBar time="9:47" />
      <Divider />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", background: `${PRIMARY}14`, borderBottom: `1px solid ${PRIMARY}30`, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: "9.5px", fontWeight: 700, color: PRIMARY }}>Kitchen ticket sent ✓</p>
          <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>Order CC-1048 · PAID</p>
        </div>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${PRIMARY}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        <div style={{ borderRadius: "10px", border: `1px solid ${PRIMARY}30`, background: SURFACE, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", background: `${PRIMARY}12`, borderBottom: `1px solid ${PRIMARY}25` }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span style={{ fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: PRIMARY }}>PAID ORDER · CC-1048</span>
          </div>
          <div style={{ padding: "7px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {([["Customer","0901 234 5678"],["Fulfilment","Delivery"],["Address","12 Chevron Dr, Ajah"],["Distance","6.2 km"]] as const).map(([k,v]) => (
              <div key={k} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.38)", flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "7px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <p style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", marginBottom: "3px" }}>Items</p>
            {([["2 × Jollof Rice + Chicken","₦9,000"],["1 × Chapman","₦1,500"],["Extra Plantain","₦700"]] as const).map(([n,p]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.72)" }}>{n}</span>
                <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.45)" }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "7px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {([["Food subtotal","₦11,200"],["Delivery fee","₦2,300"],["Service fee","₦560"]] as const).map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>{k}</span>
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.45)" }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "white" }}>Total paid</span>
              <span style={{ fontSize: "9.5px", fontWeight: 800, color: PRIMARY }}>₦14,060</span>
            </div>
          </div>
          <div style={{ background: `${PRIMARY}12`, padding: "7px 10px", textAlign: "center" }}>
            <p style={{ fontSize: "8px", fontWeight: 600, color: PRIMARY }}>✓ Receipt emailed · Kitchen ticket sent</p>
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── Step config ──────────────────────────────────────────────────────────────

type StepConfig = {
  id: string;
  label: string;
  duration: number;
  Screen: React.ComponentType;
};

const STEPS: StepConfig[] = [
  { id: "call",      label: "Call received",   duration: 5000,  Screen: IncomingCallScreen  },
  { id: "greeting",  label: "AI answers",       duration: 7000,  Screen: AiGreetingScreen    },
  { id: "ordering",  label: "Order taken",      duration: 7000,  Screen: OrderBuildingScreen  },
  { id: "fees",      label: "Fees calculated",  duration: 8000,  Screen: CalculatingScreen    },
  { id: "payment",   label: "Payment sent",     duration: 7500,  Screen: PaymentSentScreen    },
  { id: "kitchen",   label: "Kitchen notified", duration: 6500,  Screen: KitchenTicketScreen  },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export function PhoneFlow() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback((i: number) => {
    setCurrent(i);
    setProgress(0);
  }, []);

  useEffect(() => {
    setProgress(0);
    const step = STEPS[current]!;
    const start = Date.now();

    const interval = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / step.duration) * 100, 100));
    }, 40);

    const timer = setTimeout(() => {
      setCurrent((c) => (c + 1) % STEPS.length);
    }, step.duration);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [current]);

  const CurrentScreen = STEPS[current]!.Screen;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phone — no pills, just the device */}
      <div className="relative w-[260px] sm:w-[280px] lg:w-[300px]">
        {/* Subtle progress rail at top edge of phone */}
        <div className="absolute -top-px left-8 right-8 h-px overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full bg-primary/70"
            style={{ width: `${progress}%`, transition: "width 40ms linear" }}
          />
        </div>

        <Iphone>
          <div key={current} className="h-full w-full animate-in fade-in duration-500">
            <CurrentScreen />
          </div>
        </Iphone>
      </div>

      {/* Minimal step dots + label */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goTo(i)}
              aria-label={step.label}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === current ? "20px" : "6px",
                height: "6px",
                background: i === current
                  ? "var(--primary)"
                  : i < current
                  ? "color-mix(in srgb, var(--primary) 45%, transparent)"
                  : "var(--border)",
              }}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{STEPS[current]!.label}</span>
          <span className="mx-1.5 opacity-40">·</span>
          {current + 1}/{STEPS.length}
        </p>
      </div>
    </div>
  );
}
