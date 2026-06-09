import React, { useState, useRef, useEffect } from "react";
import { PlusCircle, User, Home, ChevronDown, Search, X } from "lucide-react";

interface ReferralFormProps {
  onAddReferral: (data: {
    doctorName: string;
    patientName: string;
    department: string;
    bedLocation?: string;
    requestedTests?: string;
    doctorNote?: string;
    diagnosis?: string;
    complaints?: string;
  }) => Promise<boolean>;
  onClose?: () => void;
}

const DEPARTMENTS = [
  "CT ოპერატორი",
  "ანგიოქირურგია",
  "ანესთეზია",
  "ბავშვთა გადაუდებელი მედიცინა",
  "ბავშვთა ონკო-ჰემატოლოგია",
  "ბავშვთა ქირურგია",
  "ბავშვთა რეანიმაცია",
  "გადაუდებელი მედიცინა",
  "გინეკოლოგია",
  "ზოგადი რეანიმაცია",
  "ზოგადი ქირურგია",
  "თორაკო ქირურგია",
  "ინფექციური სნეულებები",
  "კარდიო რეანიმაცია",
  "კარდიოლოგია",
  "ნევროლოგია",
  "ნეირო ქირურგია",
  "ნეირო რეანიმაცია",
  "ნეფროლოგია 2",
  "ნეფროლოგია 8",
  "პედიატრია",
  "პულმონოლოგია",
  "ტრავმატოლოგია",
  "უროლოგია",
  "ყბა–სახის ქირურგია",
  "შინაგანი მედიცინა",
  "ჰემატოლოგია 3",
  "ჰემატოლოგია 10",
  "ჰეპატოლოგია",
];

// Searchable department combobox
function DepartmentSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? DEPARTMENTS.filter((d) =>
        d.toLowerCase().includes(query.trim().toLowerCase())
      )
    : DEPARTMENTS;

  // Keep text in sync when parent resets value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If typed text doesn't match any option, clear selection
        if (!DEPARTMENTS.includes(query)) {
          setQuery("");
          onChange("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, onChange]);

  const select = (dept: string) => {
    setQuery(dept);
    onChange(dept);
    setOpen(false);
  };

  const clear = () => {
    setQuery("");
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ძებნა ან არჩევა..."
          className={`w-full pl-9 pr-8 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm transition-all duration-200 bg-white font-sans ${
            error
              ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
              : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 font-sans">
              განყოფილება ვერ მოიძებნა
            </div>
          ) : (
            filtered.map((dept) => (
              <button
                key={dept}
                type="button"
                onMouseDown={() => select(dept)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-sans ${
                  value === dept ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-800"
                }`}
              >
                {dept}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ReferralForm({ onAddReferral, onClose }: ReferralFormProps) {
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("");
  const [bedLocation, setBedLocation] = useState("");
  const [requestedTests, setRequestedTests] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [complaints, setComplaints] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!doctorName.trim()) {
      newErrors.doctorName = "გთხოვთ მიუთითოთ ექიმის სახელი და გვარი";
    }
    if (!patientName.trim()) {
      newErrors.patientName = "გთხოვთ მიუთითოთ პაციენტის სახელი და გვარი";
    }
    if (!department.trim()) {
      newErrors.department = "გთხოვთ აირჩიოთ განყოფილება";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMsg("");

    const success = await onAddReferral({
      doctorName,
      patientName,
      department,
      bedLocation,
      requestedTests,
      doctorNote,
      diagnosis,
      complaints,
    });

    setIsSubmitting(false);

    if (success) {
      if (onClose) {
        // In modal mode: close immediately after submit
        onClose();
      } else {
        // Standalone mode: show success message and reset form
        setSuccessMsg("მიმართვა წარმატებით დაემატა");
        setPatientName("");
        setDepartment("");
        setBedLocation("");
        setRequestedTests("");
        setDoctorNote("");
        setDiagnosis("");
        setComplaints("");
        setErrors({});
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 font-sans">ახალი მიმართვის შექმნა</h2>
          <p className="text-xs text-slate-500 font-sans">
            შეავსეთ ფორმა გადაუდებელი მედიცინის დეპარტამენტისთვის მიმართვის გადასაგზავნად
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm font-sans flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {successMsg}
          </div>
        )}

        {/* Doctor Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50/50 px-3 py-1.5 rounded-lg w-fit">
            <User className="w-3.5 h-3.5" />
            ექიმის მონაცემები
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
              ექიმის სახელი და გვარი <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="მაგ: დოქტ. ნინო კალანდაძე"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm transition-all duration-200 font-sans ${
                errors.doctorName
                  ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
              }`}
            />
            {errors.doctorName && (
              <p className="text-xs text-rose-500 mt-1 font-sans">{errors.doctorName}</p>
            )}
          </div>
        </div>

        {/* Patient Information */}
        <div className="space-y-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
            <User className="w-3.5 h-3.5" />
            პაციენტის მონაცემები
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
                პაციენტის სახელი და გვარი <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="მაგ: გიორგი მახარაძე"
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm transition-all duration-200 font-sans ${
                  errors.patientName
                    ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
                }`}
              />
              {errors.patientName && (
                <p className="text-xs text-rose-500 mt-1 font-sans">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
                განყოფილება, სადაც თავსდება <span className="text-rose-500">*</span>
              </label>
              <DepartmentSelect
                value={department}
                onChange={setDepartment}
                error={errors.department}
              />
              {errors.department && (
                <p className="text-xs text-rose-500 mt-1 font-sans">{errors.department}</p>
              )}
            </div>
          </div>

          {/* Diagnosis & Complaints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
                დიაგნოზი (წინასწარი/ძირითადი)
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="მაგ: მწვავე აპენდიციტი"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm focus:outline-none transition-all duration-200 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
                პაციენტის ჩივილები
              </label>
              <input
                type="text"
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                placeholder="მაგ: მუცლის ტკივილი, ცხელება"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm focus:outline-none transition-all duration-200 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
                სად თავსდება (პალატა, საწოლი, სართული)
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={bedLocation}
                  onChange={(e) => setBedLocation(e.target.value)}
                  placeholder="მაგ: პალატა 312, საწოლი B"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm focus:outline-none transition-all duration-200 font-sans"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
              დანიშნული ან საჭირო კვლევები
            </label>
            <textarea
              rows={3}
              value={requestedTests}
              onChange={(e) => setRequestedTests(e.target.value)}
              placeholder="მაგ: სისხლის საერთო, ექოსკოპია, კარდიოგრამა..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm focus:outline-none transition-all duration-200 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">
              დამატებითი შენიშვნა ექიმისგან (ანამნეზი, სიმპტომები, მითითება)
            </label>
            <textarea
              rows={3}
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              placeholder="აღწერეთ პაციენტის მდგომარეობა ან დაწერეთ კომენტარი..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm focus:outline-none transition-all duration-200 font-sans"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-3 font-semibold text-sm transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          მიმართვის დამატება
        </button>
      </form>
    </div>
  );
}
