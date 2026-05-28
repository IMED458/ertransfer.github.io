import { useState, type ReactNode } from "react";
import { Referral, StatusFilter } from "../types";
import {
  Search,
  User,
  Calendar,
  Activity,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  XCircle,
  X,
} from "lucide-react";

interface ReferralListProps {
  referrals: Referral[];
  role: "doctor" | "emergency";
  onUpdateStatus: (id: string, status: Referral["status"], comment?: string) => Promise<boolean>;
  onDeleteReferral: (id: string) => Promise<boolean>;
}

const QUICK_COMMENTS = [
  "ადგილები არ გვაქვს",
  "ვერ მივიღებთ ამ ეტაპზე",
  "დაურეკეთ განყოფილების ხელმძღვანელს",
  "პაციენტი ჯერ არ მოსულა",
  "მიღება შესაძლებელია 30 წუთში",
  // საჭიროა დამატებითი ინფორმაცია. გთხოვთ დაუკავშირდეთ მორიგე ექიმს.
  "საჭიროა დამატებითი ინფორმაცია. გთხოვთ დაუკავშირდეთ მორიგე ექიმს.",
];

function formatGeoDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = d.getDate();
    const months = ["იანვ", "თებ", "მარტ", "აპრ", "მაის", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოემ", "დეკ"];
    return `${day} ${months[d.getMonth()]}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

type StatusConfig = {
  label: string;
  icon: ReactNode;
  badgeClass: string;
  cardBorderClass: string;
};

function getStatusConfig(status: Referral["status"]): StatusConfig {
  switch (status) {
    case "აქტიური":
      return {
        label: "ახალი — აქტიური",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        cardBorderClass: "border-rose-100",
      };
    case "მოვიდეს - დადასტურებულია":
      return {
        label: "მოვიდეს - დადასტურებულია",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
        cardBorderClass: "border-cyan-100",
      };
    case "განხილვაშია - იხილეთ კომენტარი":
      return {
        label: "განხილვაშია - იხილეთ კომენტარი",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        cardBorderClass: "border-amber-100",
      };
    case "მოვიდა - დასრულებულია":
      return {
        label: "მოვიდა - დასრულებულია",
        icon: <Check className="w-3.5 h-3.5" />,
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        cardBorderClass: "border-emerald-100",
      };
    case "უარყოფილია":
      return {
        label: "უარყოფილია",
        icon: <XCircle className="w-3.5 h-3.5" />,
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        cardBorderClass: "border-slate-200",
      };
  }
}

export default function ReferralList({ referrals, role, onUpdateStatus, onDeleteReferral }: ReferralListProps) {
  const [searchPatient, setSearchPatient] = useState("");
  const [searchDoctor, setSearchDoctor] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ყველა");
  const [deptFilter, setDeptFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [currentCommentText, setCurrentCommentText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"ok" | "warn">("ok");

  const showToast = (msg: string, type: "ok" | "warn" = "ok") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const departments = Array.from(new Set(referrals.map((r) => r.department))).filter(Boolean);

  const filtered = referrals.filter((r) => {
    if (!r.patientName.toLowerCase().includes(searchPatient.toLowerCase())) return false;
    if (!r.doctorName.toLowerCase().includes(searchDoctor.toLowerCase())) return false;
    if (deptFilter && r.department !== deptFilter) return false;
    if (statusFilter !== "ყველა" && r.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (role === "emergency") {
      const w = (s: Referral["status"]) => {
        switch (s) {
          case "აქტიური": return 0;
          case "მოვიდეს - დადასტურებულია": return 1;
          case "განხილვაშია - იხილეთ კომენტარი": return 2;
          case "მოვიდა - დასრულებულია": return 3;
          case "უარყოფილია": return 4;
        }
      };
      const diff = w(a.status) - w(b.status);
      if (diff !== 0) return diff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  /* ── Action handlers ── */
  const handleCanCome = async (id: string) => {
    if (await onUpdateStatus(id, "მოვიდეს - დადასტურებულია")) showToast("გადმოყვანა დადასტურდა");
  };
  const handleArrived = async (id: string) => {
    if (await onUpdateStatus(id, "მოვიდა - დასრულებულია")) showToast("პაციენტი მოვიდა — დასრულებულია ✓");
  };
  const handleReject = async (id: string) => {
    if (await onUpdateStatus(id, "უარყოფილია")) showToast("მიმართვა უარყოფილია", "warn");
  };
  const handleUndo = async (id: string) => {
    if (await onUpdateStatus(id, "აქტიური")) showToast("სტატუსი გაუქმდა — დაბრუნდა აქტიურზე");
  };
  const handleSaveComment = async (id: string) => {
    if (await onUpdateStatus(id, "განხილვაშია - იხილეთ კომენტარი", currentCommentText)) {
      setEditingCommentId(null);
      setCurrentCommentText("");
      showToast("კომენტარი შენახულია");
    }
  };
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`წაიშალოს მიმართვა? პაციენტი: ${name}`)) {
      if (await onDeleteReferral(id)) showToast("წაშლილია");
    }
  };

  const isTerminal = (s: Referral["status"]) =>
    s === "მოვიდა - დასრულებულია" || s === "უარყოფილია";

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium font-sans animate-fade-in border
          ${toastType === "warn" ? "bg-rose-600 text-white border-rose-700" : "bg-slate-900 text-white border-slate-700"}`}>
          <span className={`w-2 h-2 rounded-full ${toastType === "warn" ? "bg-rose-200" : "bg-teal-400"} animate-ping`} />
          {toastMessage}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-sans">ფილტრი</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="პაციენტი..." value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-sans" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="ექიმი..." value={searchDoctor}
              onChange={(e) => setSearchDoctor(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-sans" />
          </div>
          <div className="relative">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white font-sans appearance-none cursor-pointer">
              <option value="">ყველა განყოფილება</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white font-sans appearance-none cursor-pointer">
              <option value="ყველა">სტატუსი: ყველა</option>
              <option value="აქტიური">აქტიური</option>
              <option value="მოვიდეს - დადასტურებულია">მოვიდეს - დადასტურებულია</option>
              <option value="განხილვაშია - იხილეთ კომენტარი">განხილვაშია</option>
              <option value="მოვიდა - დასრულებულია">მოვიდა - დასრულებულია</option>
              <option value="უარყოფილია">უარყოფილია</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-slate-500 font-sans">
            ნაჩვენებია <span className="font-semibold text-slate-800">{sorted.length}</span> მიმართვა
          </p>
          {(searchPatient || searchDoctor || deptFilter || statusFilter !== "ყველა") && (
            <button onClick={() => { setSearchPatient(""); setSearchDoctor(""); setDeptFilter(""); setStatusFilter("ყველა"); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium font-sans flex items-center gap-1 cursor-pointer">
              <X className="w-3 h-3" /> გასუფთავება
            </button>
          )}
        </div>
      </div>

      {/* ── Empty ── */}
      {sorted.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl py-14 text-center shadow-sm">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 font-sans">მიმართვები ვერ მოიძებნა</p>
          <p className="text-xs text-slate-400 font-sans mt-1">შეცვალეთ ფილტრი ან დაამატეთ ახალი მიმართვა</p>
        </div>
      )}

      {/* ── Cards ── */}
      <div className="space-y-3">
        {sorted.map((r) => {
          const cfg = getStatusConfig(r.status);
          const expanded = expandedIds.has(r.id);
          const editing = editingCommentId === r.id;
          const terminal = isTerminal(r.status);
          const deptLabel = r.bedLocation ? `${r.department} (${r.bedLocation})` : r.department;

          return (
            <div key={r.id}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${cfg.cardBorderClass}`}>

              {/* Top bar */}
              <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-50">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border font-sans ${cfg.badgeClass}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    შექმნა: {formatGeoDate(r.createdAt)}
                  </span>
                  {r.completedAt && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      | დახურვა: {formatGeoDate(r.completedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Main content row */}
              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-4 items-start">
                {/* Patient */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 font-sans flex items-center gap-1">
                    <User className="w-3 h-3" /> პაციენტი
                  </p>
                  <p className="text-base font-bold text-slate-900 font-sans leading-tight">{r.patientName}</p>
                </div>

                {/* Doctor */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 font-sans flex items-center gap-1">
                    <User className="w-3 h-3" /> მიმმართველი ექიმი
                  </p>
                  <p className="text-sm font-semibold text-slate-700 font-sans">{r.doctorName}</p>
                </div>

                {/* Department */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 font-sans">
                    განყოფილება და ადგილი
                  </p>
                  <p className="text-sm font-bold text-blue-700 font-sans leading-snug">{deptLabel}</p>
                </div>

                {/* Expand button */}
                <button onClick={() => toggleExpand(r.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold font-sans cursor-pointer whitespace-nowrap mt-1 md:mt-3">
                  დეტალურად {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="px-5 pb-4 pt-0 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
                  {r.diagnosis && (
                    <div className="bg-rose-50/60 rounded-xl px-3 py-2.5 border border-rose-100/60">
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5 font-sans">🩺 დიაგნოზი</p>
                      <p className="text-xs text-slate-800 font-sans">{r.diagnosis}</p>
                    </div>
                  )}
                  {r.complaints && (
                    <div className="bg-amber-50/50 rounded-xl px-3 py-2.5 border border-amber-100/60">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5 font-sans">🤒 ჩივილები</p>
                      <p className="text-xs text-slate-800 font-sans">{r.complaints}</p>
                    </div>
                  )}
                  {r.requestedTests && (
                    <div className="bg-blue-50/40 rounded-xl px-3 py-2.5 border border-blue-100/50">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5 font-sans">🔬 კვლევები</p>
                      <p className="text-xs text-slate-800 font-sans">{r.requestedTests}</p>
                    </div>
                  )}
                  {r.doctorNote && (
                    <div className="md:col-span-3 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 font-sans">📋 ექიმის შენიშვნა</p>
                      <p className="text-xs text-slate-700 font-sans whitespace-pre-line">{r.doctorNote}</p>
                    </div>
                  )}
                  {r.emergencyComment && (
                    <div className="md:col-span-3 bg-amber-50/70 rounded-xl px-3 py-2.5 border border-amber-200 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5 font-sans">ემერჯენსის კომენტარი</p>
                        <p className="text-xs text-slate-800 font-sans font-medium">{r.emergencyComment}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comment editor */}
              {editing && (
                <div className="px-5 pb-4 pt-3 border-t border-slate-100 bg-slate-50/60 space-y-3">
                  <p className="text-xs font-semibold text-slate-700 font-sans">კომენტარი:</p>
                  <input type="text" value={currentCommentText}
                    onChange={(e) => setCurrentCommentText(e.target.value)}
                    placeholder="ჩაწერეთ კომენტარი..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white font-sans" />
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COMMENTS.map((c) => (
                      <button key={c} type="button" onClick={() => setCurrentCommentText(c)}
                        className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition font-sans cursor-pointer">
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingCommentId(null); setCurrentCommentText(""); }}
                      className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-semibold font-sans cursor-pointer">
                      გაუქმება
                    </button>
                    <button onClick={() => handleSaveComment(r.id)} disabled={!currentCommentText.trim()}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold font-sans cursor-pointer transition ${currentCommentText.trim() ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-200 text-amber-700 cursor-not-allowed"}`}>
                      შენახვა
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom action bar */}
              <div className="px-5 py-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2 bg-slate-50/30">
                {/* Delete */}
                <button onClick={() => handleDelete(r.id, r.patientName)}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer font-sans">
                  <Trash2 className="w-3.5 h-3.5" /> წაშლა
                </button>

                {/* Emergency actions */}
                {role === "emergency" && !terminal && (
                  <div className="flex flex-wrap gap-2">
                    {/* Comment */}
                    <button
                      onClick={() => { setEditingCommentId(r.id); setCurrentCommentText(r.emergencyComment || ""); }}
                      className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition cursor-pointer font-sans">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      კომენტარი (განხილვაში)
                    </button>

                    {/* Undo — back to active */}
                    {r.status !== "აქტიური" && (
                      <button onClick={() => handleUndo(r.id)}
                        className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition cursor-pointer font-sans">
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        ↩ უკან
                      </button>
                    )}

                    {/* Can come */}
                    {r.status !== "მოვიდეს - დადასტურებულია" && (
                      <button onClick={() => handleCanCome(r.id)}
                        className="inline-flex items-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer font-sans">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        მოვიდეს
                      </button>
                    )}

                    {/* Arrived */}
                    <button onClick={() => handleArrived(r.id)}
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer font-sans">
                      <Check className="w-3.5 h-3.5" />
                      მოვიდა
                    </button>

                    {/* Reject */}
                    <button onClick={() => handleReject(r.id)}
                      className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-rose-50 text-rose-600 font-semibold px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm transition cursor-pointer font-sans">
                      <XCircle className="w-3.5 h-3.5" />
                      უარი
                    </button>
                  </div>
                )}

                {/* Undo for terminal states in emergency */}
                {role === "emergency" && terminal && (
                  <button onClick={() => handleUndo(r.id)}
                    className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition cursor-pointer font-sans">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    ↩ გაუქმება
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
