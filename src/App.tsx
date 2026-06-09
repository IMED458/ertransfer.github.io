import { useState, useEffect, useRef } from "react";
import { Referral } from "./types";
import ReferralForm from "./components/ReferralForm";
import ReferralList from "./components/ReferralList";
import ReferralStats from "./components/ReferralStats";
import {
  subscribeToReferrals,
  addReferral,
  updateReferralStatus,
  deleteReferral,
} from "./services/referralService";
import {
  Activity,
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Clock,
  Wifi,
  PlusCircle,
  Lock,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

const EMERGENCY_PASSWORD = "htmc458";

export default function App() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [activeTab, setActiveTab] = useState<"doctor" | "emergency">("doctor");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [synced, setSynced] = useState(false);

  // Emergency password gate
  const [emergencyUnlocked, setEmergencyUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // New referral modal
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 15000);
    return () => clearInterval(timer);
  }, []);

  // Live Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToReferrals(
      (data) => {
        setReferrals(data);
        setIsLoading(false);
        setError(null);
        setSynced(true);
      },
      (err) => {
        setError("Firebase-თან კავშირის შეცდომა: " + err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordRef.current?.focus(), 60);
    }
  }, [showPasswordModal]);

  const handleEmergencyTabClick = () => {
    if (emergencyUnlocked) {
      setActiveTab("emergency");
    } else {
      setPasswordInput("");
      setPasswordError("");
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === EMERGENCY_PASSWORD) {
      setEmergencyUnlocked(true);
      setShowPasswordModal(false);
      setActiveTab("emergency");
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("პაროლი არასწორია. სცადეთ თავიდან.");
      setPasswordInput("");
      passwordRef.current?.focus();
    }
  };

  const handleAddReferral = async (data: {
    doctorName: string;
    patientName: string;
    department: string;
    bedLocation?: string;
    requestedTests?: string;
    doctorNote?: string;
    diagnosis?: string;
    complaints?: string;
  }): Promise<boolean> => {
    try {
      await addReferral(data);
      return true;
    } catch (err: any) {
      alert(`შეცდომა: ${err.message}`);
      return false;
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: Referral["status"],
    comment?: string
  ): Promise<boolean> => {
    try {
      await updateReferralStatus(id, status, comment);
      return true;
    } catch (err: any) {
      alert(`შეცდომა: ${err.message}`);
      return false;
    }
  };

  const handleDeleteReferral = async (id: string): Promise<boolean> => {
    try {
      await deleteReferral(id);
      return true;
    } catch (err: any) {
      alert(`შეცდომა: ${err.message}`);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased">

      {/* ── Password Modal ─────────────────────────────────────── */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">ემერჯენსის პანელი</h2>
              <p className="text-sm text-slate-500 font-sans mt-1 text-center">
                გასაგრძელებლად შეიყვანეთ პაროლი
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
                  placeholder="პაროლი"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? "border-rose-300 focus:ring-rose-200 bg-rose-50/30"
                      : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-rose-600 font-sans font-medium">{passwordError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm font-sans transition cursor-pointer shadow-sm hover:shadow-md"
              >
                შესვლა
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Referral Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 pt-8 pb-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <ReferralForm
              onAddReferral={handleAddReferral}
              onClose={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-sans">
                  გადაუდებელი მედიცინის მიმართვების სისტემა
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium font-sans">
                  პალატების კოორდინაციისა და ჰოსპიტალიზაციის მართვა
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTime}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-bold font-sans transition-all ${
                  synced
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                <Wifi className={`w-3.5 h-3.5 ${synced ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="hidden md:inline">{synced ? "Firebase Live" : "კავშირი..."}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold font-sans">კავშირის პრობლემა Firebase-თან</p>
              <p className="text-xs text-rose-600 mt-1 font-sans">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && <ReferralStats referrals={referrals} />}

        {/* ── Tab Switcher ── */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl max-w-lg mb-6 shadow-2xs">
          <button
            onClick={() => setActiveTab("doctor")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "doctor"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span className="font-sans">ექიმის პანელი</span>
          </button>

          <button
            onClick={handleEmergencyTabClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "emergency"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="font-sans">ემერჯენსის პანელი</span>
            {!emergencyUnlocked && (
              <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>
        </div>

        {isLoading && referrals.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl py-24 text-center shadow-xs">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-sans">Firebase-სთან კავშირი...</p>
          </div>
        ) : (
          <>
            {/* ── Doctor Panel ── */}
            {activeTab === "doctor" && (
              <div className="space-y-5">
                {/* Top bar: title + add button */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 font-sans">მიმდინარე მიმართვები</h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      ყველა მიმდინარე მიმართვა რეალურ დროში
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md shadow-blue-200 hover:shadow-lg transition-all cursor-pointer font-sans whitespace-nowrap"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">ახალი მიმართვის შექმნა</span>
                    <span className="sm:hidden">ახალი</span>
                  </button>
                </div>

                <ReferralList
                  referrals={referrals}
                  role="doctor"
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteReferral={handleDeleteReferral}
                />
              </div>
            )}

            {/* ── Emergency Panel ── */}
            {activeTab === "emergency" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 font-sans">შემოსული მიმართვების კოორდინაცია</h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    ემერჯენსის რეჟიმი — კომენტარები, დადასტურება, მიღება
                  </p>
                </div>
                <ReferralList
                  referrals={referrals}
                  role="emergency"
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteReferral={handleDeleteReferral}
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 text-center mt-20 border-t border-slate-150 pt-6">
        <p className="text-xs text-slate-400 font-sans">
          © {new Date().getFullYear()} გადაუდებელი მედიცინის დეპარტამენტის პაციენტთა მართვის სისტემა.
        </p>
      </footer>
    </div>
  );
}
