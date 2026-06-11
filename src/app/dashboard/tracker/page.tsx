"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  History, 
  Car, 
  Utensils, 
  Zap, 
  ShoppingBag, 
  X,
  Trash2,
  AlertCircle
} from "lucide-react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti";

interface LogEntry {
  id: string;
  category: "transport" | "food" | "electricity" | "shopping";
  label: string;
  value: number;
  unit: string;
  carbon: number;
  date: string;
  note?: string;
}

// Extracted helpers
function getCategoryLabel(category: string, note?: string) {
  if (note) return note;
  switch (category) {
    case "transport": return "Commute";
    case "food": return "Diet serving";
    case "electricity": return "Appliance run";
    case "shopping": return "Purchase item";
    default: return "Activity";
  }
}

function processFetchedDocs(docs: import("firebase/firestore").QueryDocumentSnapshot<import("firebase/firestore").DocumentData>[]) {
  const fetched: LogEntry[] = [];
  docs.forEach((docSnap) => {
    const data = docSnap.data();
    let dateStr = "";
    if (data.date) {
      if (data.date.seconds) {
        dateStr = new Date(data.date.seconds * 1000).toISOString().split("T")[0];
      } else if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split("T")[0];
      } else {
        dateStr = new Date(data.date).toISOString().split("T")[0];
      }
    }
    fetched.push({
      id: docSnap.id,
      category: data.category,
      label: getCategoryLabel(data.category, data.note),
      value: data.value,
      unit: data.unit,
      carbon: data.carbonEmit || 0,
      date: dateStr,
      note: data.note,
    });
  });
  return fetched;
}

export default function CarbonTrackerPage() {
  const { profile } = useAuth();
  
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Pagination
  const [lastVisible, setLastVisible] = useState<import("firebase/firestore").QueryDocumentSnapshot<import("firebase/firestore").DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 6;

  // Add Log modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<"transport" | "food" | "electricity" | "shopping">("transport");
  const [addValue, setAddValue] = useState<number>(10);
  const [addType, setAddType] = useState<string>("");
  const [addNote, setAddNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async (isLoadMore = false) => {
    if (!profile) return;
    if (!isLoadMore) {
      setLoading(true);
    }

    try {
      let q;
      if (selectedCategory === "all") {
        q = query(
          collection(db, "activities"),
          where("userId", "==", profile.uid),
          orderBy("date", "desc"),
          ...(isLoadMore && lastVisible ? [startAfter(lastVisible)] : []),
          limit(itemsPerPage + 1)
        );
      } else {
        q = query(
          collection(db, "activities"),
          where("userId", "==", profile.uid),
          where("category", "==", selectedCategory),
          orderBy("date", "desc"),
          ...(isLoadMore && lastVisible ? [startAfter(lastVisible)] : []),
          limit(itemsPerPage + 1)
        );
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      const newHasMore = docs.length > itemsPerPage;
      const docsToProcess = newHasMore ? docs.slice(0, itemsPerPage) : docs;
      
      const lastDoc = docsToProcess[docsToProcess.length - 1];
      setLastVisible(lastDoc || null);
      setHasMore(newHasMore);

      const fetched = processFetchedDocs(docsToProcess);

      if (isLoadMore) {
        setEntries((prev) => [...prev, ...fetched]);
      } else {
        setEntries(fetched);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      if (!isLoadMore) setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const doFetch = async () => {
      if (!profile) return;
      setLoading(true);

      try {
        let q;
        if (selectedCategory === "all") {
          q = query(
            collection(db, "activities"),
            where("userId", "==", profile.uid),
            orderBy("date", "desc"),
            limit(itemsPerPage + 1)
          );
        } else {
          q = query(
            collection(db, "activities"),
            where("userId", "==", profile.uid),
            where("category", "==", selectedCategory),
            orderBy("date", "desc"),
            limit(itemsPerPage + 1)
          );
        }

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs;
        
        const newHasMore = docs.length > itemsPerPage;
        const docsToProcess = newHasMore ? docs.slice(0, itemsPerPage) : docs;
        
        const lastDoc = docsToProcess[docsToProcess.length - 1];
        if (active) {
          setLastVisible(lastDoc || null);
          setHasMore(newHasMore);
        }

        const fetched = processFetchedDocs(docsToProcess);

        if (active) {
          setEntries(fetched);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        if (active) setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    doFetch();
    return () => { active = false; };
  }, [profile, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport": return <Car className="h-4 w-4 text-blue-400" aria-hidden="true" />;
      case "food": return <Utensils className="h-4 w-4 text-emerald-400" aria-hidden="true" />;
      case "electricity": return <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />;
      case "shopping": return <ShoppingBag className="h-4 w-4 text-violet-400" aria-hidden="true" />;
      default: return <History className="h-4 w-4 text-zinc-400" aria-hidden="true" />;
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    let unit = "units";

    if (addCategory === "transport") {
      unit = "km";
    } else if (addCategory === "food") {
      unit = "servings";
    } else if (addCategory === "electricity") {
      unit = "hours";
    } else if (addCategory === "shopping") {
      unit = "items";
    }

    const newLogLabel = addNote || `${addCategory.charAt(0).toUpperCase() + addCategory.slice(1)} manual log`;

    const defaultTypeMap: Record<string, string> = {
      transport: "gasolineCar",
      food: "poultry",
      electricity: "airConditioner",
    };
    const resolvedType = addType || defaultTypeMap[addCategory] || "misc";

    try {
      const docRef = await addDoc(collection(db, "activities"), {
        userId: profile.uid,
        category: addCategory,
        type: resolvedType,
        value: addValue,
        unit,
        date: new Date(),
        note: newLogLabel,
      });

      // Prepend to UI list (optimistic UI, carbon: 0 until updated by functions)
      setEntries(prev => [{ 
        id: docRef.id, 
        category: addCategory,
        label: newLogLabel,
        value: addValue,
        unit,
        carbon: 0,
        date: new Date().toISOString().split("T")[0],
        note: addNote,
      }, ...prev]);
      
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10B981", "#3B82F6", "#F59E0B"]
      });

      setShowAddModal(false);
      setAddNote("");
      setAddValue(10);
      setAddType("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, "activities", id));
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search logic
  const filtered = entries.filter((e) => {
    const matchesSearch = e.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.note?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const currentItems = filtered;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Carbon Tracker
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Log, track, and monitor individual carbon contributors in real-time.
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Activity</span>
        </Button>
      </div>

      {/* Main filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-white/[0.06] rounded-xl overflow-x-auto w-full md:w-auto" role="tablist">
          {["all", "transport", "food", "electricity", "shopping"].map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => {
                setSelectedCategory(cat);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selectedCategory === cat
                  ? "bg-white/5 border border-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="absolute left-3.5 top-3 text-zinc-500">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <label htmlFor="search-activities" className="sr-only">Search activities</label>
          <input
            id="search-activities"
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 font-mono"
          />
        </div>
      </div>

      {/* History logs grid list */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <li className="col-span-2 text-center py-20" aria-busy="true" aria-label="Loading activities">
            <div className="w-6 h-6 border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full mx-auto" />
          </li>
        ) : currentItems.length === 0 ? (
          <li className="col-span-2">
            <GlassCard className="py-16 text-center" role="alert">
              <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-zinc-300">No logs found</h2>
              <p className="text-xs text-zinc-500 mt-1">Try resetting filters or log a new activity.</p>
            </GlassCard>
          </li>
        ) : (
          currentItems.map((item) => (
            <li key={item.id}>
              <GlassCard className="p-5 flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950/60 border border-white/[0.08] flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{item.label}</h3>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-1">
                      Value: {item.value} {item.unit} | Date: {item.date}
                    </span>
                    {item.note && (
                      <p className="text-[10px] text-zinc-500 italic mt-2 border-l border-white/5 pl-2">
                        &quot;{item.note}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {item.carbon} kg CO₂
                  </span>
                  <button
                    onClick={() => handleDeleteEntry(item.id)}
                    aria-label={`Delete activity ${item.label}`}
                    className="p-1.5 rounded-lg border border-transparent hover:border-red-500/10 hover:bg-red-500/5 text-zinc-600 hover:text-red-400 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </GlassCard>
            </li>
          ))
        )}
      </ul>

      {/* Pagination controls */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => fetchEntries(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <span>Load More</span>
          </Button>
        </div>
      )}

      {/* Add Log Modal */}
      {showAddModal && (
        <dialog className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" open aria-modal="true" aria-labelledby="modal-title">
          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
              aria-label="Close modal"
            >
              <X className="h-4.5 w-4.5" aria-hidden="true" />
            </button>

            <h2 id="modal-title" className="text-base font-bold text-zinc-100 mb-6">Log Carbon Activity</h2>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Category</span>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Select category">
                  {(["transport", "food", "electricity", "shopping"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="radio"
                      aria-checked={addCategory === cat}
                      onClick={() => {
                        setAddCategory(cat);
                        setAddType(""); // reset type
                      }}
                      className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        addCategory === cat
                          ? "bg-white/5 border-white/20 text-white"
                          : "border-transparent bg-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Type Select based on category */}
              <div className="space-y-1">
                <label htmlFor="activity-type" className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Type</label>
                <select
                  id="activity-type"
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40"
                  required
                >
                  <option value="" disabled>Select Type...</option>
                  {addCategory === "transport" && (
                    <>
                      <option value="gasolineCar">Gasoline passenger car</option>
                      <option value="electricCar">Electric vehicle (EV)</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="bus">City Bus</option>
                      <option value="train">Train / Metro</option>
                    </>
                  )}
                  {addCategory === "food" && (
                    <>
                      <option value="beef">Beef serving</option>
                      <option value="poultry">Poultry (chicken, turkey)</option>
                      <option value="pork">Pork serving</option>
                      <option value="fish">Seafood / Fish</option>
                      <option value="dairy">Dairy & Eggs</option>
                      <option value="vegetables">Plant-based meal</option>
                    </>
                  )}
                  {addCategory === "electricity" && (
                    <>
                      <option value="airConditioner">Air Conditioner</option>
                      <option value="heater">Space Heater</option>
                      <option value="television">Television</option>
                      <option value="computer">Computer / PC</option>
                    </>
                  )}
                  {addCategory === "shopping" && (
                    <>
                      <option value="clothing">Clothing item</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="misc">Miscellaneous</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dynamic Value Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="activity-value" className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Volume / Amount</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold" aria-live="polite">
                    {addCategory === "transport" && "km"}
                    {addCategory === "food" && "servings"}
                    {addCategory === "electricity" && "hours"}
                    {addCategory === "shopping" && "items"}
                  </span>
                </div>
                <input
                  id="activity-value"
                  type="number"
                  min="0.1"
                  step="any"
                  value={addValue}
                  onChange={(e) => setAddValue(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label htmlFor="activity-note" className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Description / Note</label>
                <input
                  id="activity-note"
                  type="text"
                  placeholder="e.g. 'Commute to school', 'Had steak'"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <Button type="submit" className="w-full py-3 mt-4" loading={submitting}>
                Add Entry
              </Button>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
