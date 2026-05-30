import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export const Route = createFileRoute("/profile")({
    component: Profile,
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface InfoCardProps {
    title: string;
    value: string;
    valueSec?: string;
    color: "cyan" | "pink";
}

// ─── INFO CARD (COMPACT HIGH-TECH DESIGN) ─────────────────────────────────────
function InfoCard({ title, value, valueSec, color }: InfoCardProps) {
    const mx = useMotionValue(200);
    const my = useMotionValue(200);
    const rotX = useTransform(my, [0, 400], [8, -8]);
    const rotY = useTransform(mx, [0, 400], [-8, 8]);

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 400);
        my.set(((e.clientY - r.top) / r.height) * 400);
    };

    const isCyan = color === "cyan";

    return (
        <motion.div
            style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouse}
            onMouseLeave={() => { mx.set(200); my.set(200); }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={[
                "relative overflow-hidden flex flex-col justify-center cursor-pointer rounded-lg",
                "p-4 bg-black/40 border border-white/[0.08] transition-all duration-300 min-h-[85px]",
                "group/card shadow-md backdrop-blur-sm",
                isCyan ? "hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "hover:border-fuchsia-500/50 hover:shadow-[0_0_15px_rgba(232,121,249,0.1)]",
            ].join(" ")}
        >
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-1">{title}</div>
            <div className={`text-[13px] font-bold uppercase tracking-wider truncate font-mono ${isCyan ? "text-cyan-400" : "text-fuchsia-400"}`}>
                {value}
            </div>
            {valueSec && <div className="text-xs text-white/30 mt-0.5 font-mono">{valueSec}</div>}
        </motion.div>
    );
}

// ─── PROGRESS BAR (HORIZONTAL ALIGNMENT) ──────────────────────────────────────
function StatBar({ label, value, color = "cyan", delay = 0 }: { label: string; value: number; color?: "cyan" | "pink"; delay?: number }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return (
        <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-[11px] uppercase tracking-[0.1em] mb-1">
                <span className="text-white/50 font-mono font-bold truncate mr-1">{label}</span>
                <span className="text-white/40 font-mono">{value}%</span>
            </div>
            <div className="h-[6px] bg-white/[0.06] rounded-full overflow-hidden relative border border-white/[0.03]">
                <div
                    className={[
                        "h-full rounded-full relative transition-all duration-[1500ms]",
                        color === "cyan" ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "bg-fuchsia-500 shadow-[0_0_8px_rgba(232,121,249,0.4)]",
                    ].join(" ")}
                    style={{
                        width: `${width}%`,
                        transitionTimingFunction: "cubic-bezier(0.34, 1.2, 0.64, 1)",
                    }}
                />
            </div>
        </div>
    );
}

// ─── MAIN PROFILE COMPONENT ───────────────────────────────────────────────────
function Profile() {
    const navigate = useNavigate();
    const [auth, setAuth] = useState<{ user?: string } | null>(null);
    const [now, setNow] = useState(new Date());
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("authToken");
            setAuth(raw ? JSON.parse(raw) : null);
        } catch { setAuth(null); }
    }, []);

    useEffect(() => {
        const el = profileRef.current;
        if (!el) return;
        const panel = el.querySelector<HTMLElement>(".panel-3d");
        if (!panel) return;

        const onMove = (e: MouseEvent) => {
            const r = panel.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            panel.style.transform = `perspective(1200px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
        };
        const onLeave = () => {
            panel.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
        };

        panel.addEventListener("mousemove", onMove);
        panel.addEventListener("mouseleave", onLeave);
        return () => {
            panel.removeEventListener("mousemove", onMove);
            panel.removeEventListener("mouseleave", onLeave);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate({ to: "/login" });
    };

    const username = auth?.user ?? "ROOT_USER";
    const timeStr = "SYSTEM_ONLINE";
    const dateStr = `NODE_OP_CLK: ${now.toLocaleTimeString("en-US", { hour12: false }).replace(/:/g, "").slice(0, 6)}`;

    return (
        <div
            className="min-h-screen bg-[#020710] text-slate-100 flex items-center justify-center p-4 md:p-6 relative overflow-hidden select-none"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
                @keyframes scanMove { 0%{top:-2px} 100%{top:100%} }
                @keyframes spinCW  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
                @keyframes spinCCW { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
                .scan-bar { animation: scanMove 10s linear infinite; }
                .spin-cw  { animation: spinCW  16s linear infinite; }
                .spin-ccw { animation: spinCCW 10s linear infinite; }
                .clip-hud {
                    clip-path: polygon(40px 0%, 100% 0%, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0% 100%, 0% 40px);
                }
                .clip-hex {
                    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                }
                .panel-3d { transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1); }
            `}</style>

            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 pointer-events-none opacity-15"
                style={{
                    backgroundImage: "linear-gradient(rgba(0,245,255,0.05) 1px,transparent 1px), linear-gradient(to right,rgba(0,245,255,0.05) 1px,transparent 1px)",
                    backgroundSize: "40px 40px",
                    transform: "perspective(500px) rotateX(60deg) translateY(-10%)",
                    transformOrigin: "top center"
                }}
            />
            <div className="fixed top-[10%] left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 blur-[120px]"
                style={{ background: "radial-gradient(circle, rgba(0,245,255,0.2) 0%, transparent 70%)" }} />
            <div className="fixed bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 blur-[120px]"
                style={{ background: "radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)" }} />
            <div className="fixed left-0 right-0 h-[2px] scan-bar pointer-events-none bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            {/* MAIN HUD INTERFACE */}
            <motion.div
                ref={profileRef}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[1040px] relative z-10"
            >
                <div className="panel-3d clip-hud relative overflow-hidden bg-[#040d1a]/95 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 md:p-9 flex flex-col gap-6">
                    <div className="absolute top-0 left-[40px] h-[3px] w-32 bg-cyan-400" />
                    <div className="absolute bottom-0 right-[40px] h-[3px] w-32 bg-fuchsia-500" />

                    {/* 1. HEADER SECTION (TOP) */}
                    <div className="border-b border-white/[0.06] pb-4">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white font-mono leading-none mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text">
                            {username.toUpperCase()}
                        </h1>
                        <div className="text-xs text-cyan-400/70 tracking-[0.2em] font-bold font-mono uppercase">
                            Web Developer & System Operator
                        </div>
                    </div>

                    {/* 2. MIDDLE CONTENT ROW (AVATAR LEFT || INFO + LOGS RIGHT) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                        {/* CỘT TRÁI: KHUNG AVATAR LỤC GIÁC ĐỘC LẬP SIÊU TO */}
                        <div className="md:col-span-5 flex justify-center items-center h-full py-2">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative w-full max-w-[340px] aspect-square flex items-center justify-center cursor-pointer group"
                            >
                                <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 spin-cw group-hover:border-cyan-400/80 transition-all" />
                                <div className="absolute inset-3 rounded-full border border-dotted border-fuchsia-500/30 spin-ccw group-hover:border-fuchsia-400/70 transition-all" />

                                {/* Khung chứa ảnh chiếm trọn 100% diện tích khối lục giác */}
                                <div className="w-[120%] h-[120%] clip-hex bg-[#06152b] border border-cyan-400/50 flex items-center justify-center p-0.5 relative shadow-[0_0_30px_rgba(0,245,255,0.2)] group-hover:shadow-[0_0_45px_rgba(0,245,255,0.45)] transition-all duration-300">
                                    <img
                                        src="/admin.png"
                                        alt="Admin Avatar"

                                        className="w-full h-full object-cover origin-center scale-145 clip-hex transition-transform duration-500 group-hover:scale-135"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.parentElement) {
                                                const iconNode = document.createElement('span');
                                                iconNode.className = "text-cyan-400 text-5xl font-bold";
                                                iconNode.innerText = "👤";
                                                e.currentTarget.parentElement.appendChild(iconNode);
                                            }
                                        }}
                                    />

                                </div>
                            </motion.div>
                        </div>

                        {/* CỘT PHẢI: CHI TIẾT THÔNG SỐ & HỘP THOẠI LOGS */}
                        <div className="md:col-span-7 flex flex-col gap-4">

                            {/* Ô định danh cá nhân (Hàng trên cùng vế phải) */}
                            <div className="p-4 bg-black/40 border border-white/[0.08] rounded-lg">
                                <div className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-1">ACCOUNT_ID</div>
                                <div className="text-xs font-black font-mono text-cyan-400 tracking-wider break-all">
                                    EG-059
                                </div>
                            </div>

                            {/* Lưới 2x2 cho thông tin cá nhân thực tế */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Bạn có thể truyền dữ liệu động từ state/auth vào phần value nếu có */}
                                <InfoCard title="FULL_NAME" value="Nguyễn Quang Huy" color="cyan" />
                                <InfoCard title="ROLE_POSITION" value="Web Developer" color="pink" />
                                <InfoCard title="EMAIL_ADDRESS" value="nguyenquanghuy12a99@gmail.com" color="cyan" />
                                <InfoCard title="BIRTH_DATE" value="26/10/2004" color="pink" />
                            </div>

                            {/* Giao diện mô tả tiểu sử hoặc trạng thái làm việc */}
                            <div className="p-4 bg-black/60 border border-white/[0.08] rounded-lg font-mono text-xs space-y-2 shadow-inner">
                                <div className="text-white/40 text-[10px] font-bold tracking-widest border-b border-white/[0.05] pb-1">BIOGRAPHY // STATUS</div>
                                <div className="text-[11px] text-slate-400 space-y-1 max-h-[75px] overflow-y-hidden opacity-80">
                                    <div>[STATUS] WORKSPACE: <span className="text-emerald-400 font-bold">ACTIVE // NO_ISSUES</span></div>
                                    <div>[SKILLS] TS • REACT • NEXTJS • TAILWIND_CSS</div>
                                    <div>[PROJECTS] DASH BOARD MANAGER</div>

                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 3. BOTTOM ROW SECTION (STATS HORIZONTAL & ACTIONS RIGHT) */}
                    <div className="border-t border-white/[0.08] pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                        {/* Ba thanh Stats xếp dàn ngang cạnh nhau ở góc dưới trái */}
                        <div className="md:col-span-8 flex flex-col sm:flex-row gap-4 lg:gap-6">
                            <StatBar label="WORK_EFFICIENCY" value={94} color="cyan" delay={150} />
                            <StatBar label="FOCUS_SYNC" value={78} color="cyan" delay={300} />
                            <StatBar label="BURNOUT_RATE" value={12} color="pink" delay={450} />
                        </div>

                        {/* Hai nút chức năng dồn về góc dưới phải */}
                        <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5 justify-end">
                            {/* Nút Kết nối Social */}
                            <a href="https://www.facebook.com/huydtr0004" target="_blank" rel="noopener noreferrer" className="w-full">
                                <motion.button
                                    whileHover={{ scale: 1.01, boxShadow: "0 0 15px rgba(34,211,238,0.2)", borderColor: "rgba(34,211,238,0.8)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-2.5 bg-black/40 border border-cyan-400/30 text-cyan-400 font-bold text-xs uppercase tracking-[0.15em] transition-all duration-200 rounded text-center font-mono"
                                >
                                    CONNECT_FACEBOOK //
                                </motion.button>
                            </a>

                        </div>
                    </div>

                    {/* Meta data đáy cùng */}
                    <div className="pt-2 text-[10px] text-white/30 tracking-[0.25em] font-mono flex justify-between uppercase opacity-60">
                        <span>LATENCY: 14MS</span>
                        <span>CYB_INTERFACE_V3.5_MAX_FULL</span>
                        <span>SYS_NODE: 200</span>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}