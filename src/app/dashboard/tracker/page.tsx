"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Car, 
  Utensils, 
  Zap, 
  ShoppingBag, 
  X,
  Droplet,
  Trash2,
  AlertCircle
} from "lucide-react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateTransportEmissions, TransportMode } from "@/lib/carbon/transport";
import { calculateFoodEmissions, FoodType } from "@/lib/carbon/food";
import { calculateElectricityEmissions, ApplianceType } from "@/lib/carbon/electricity";
import { calculateShoppingEmissions } from "@/lib/carbon/shopping";
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

export default function CarbonTrackerPage() {
  const { profile, isMock } = useAuth();
  
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Add Log modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<"transport" | "food" | "electricity" | "shopping">("transport");
  const [addValue, setAddValue] = useState<number>(10);
  const [addType, setAddType] = useState<string>("");
  const [addNote, setAddNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Starter mock entries if none are saved
  const mockEntries: LogEntry[] = [
    { id: "e1", category: "transport", label: "Drove Gasoline Car", value: 25, unit: "km", carbon: 5.25, date: "2026-06-10", note: "Commute to office" },
    { id: "e2", category: "food", label: "Beef Dinner", value: 2, unit: "servings", carbon: 13.0, date: "2026-06-09", note: "Steak night" },
    { id: "e3", category: "electricity", label: "Used AC", value: 5, unit: "hours", carbon: 3.53, date: "2026-06-08", note: "Hot afternoon" },
    { id: "e4", category: "shopping", label: "Clothing Purchase", value: 2, unit: "items", carbon: 30.0, date: "2026-06-07", note: "Bought jacket and shirt" },
    { id: "e5", category: "transport", label: "Commuted via Bus", value: 18, unit: "km", carbon: 0.72, date: "2026-06-06", note: "City bus ride" },
    { id: "e6", category: "food", label: "Chicken Salad", value: 1, unit: "serving", carbon: 1.8, date: "2026-06-05", note: "Lunch" }
  ];

  useEffect(() => {
    fetchEntries();
  }, [profile]);

  const fetchEntries = async () => {
    if (!profile) return;
    setLoading(true);

    if (isMock) {
      setEntries(mockEntries);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "activities"),
        where("userId", "==", profile.uid),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetched: LogEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          category: data.category,
          label: getCategoryLabel(data.category, data.note),
          value: data.value,
          unit: data.unit,
          carbon: data.carbonEmit,
          date: new Date(data.date.seconds * 1000).toISOString().split("T")[0],
          note: data.note,
        });
      });

      if (fetched.length === 0) {
        setEntries(mockEntries); // use mocks as starter
      } else {
        setEntries(fetched);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setEntries(mockEntries); // fallback
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string, note?: string) => {
    if (note) return note;
    switch (category) {
      case "transport": return "Commute";
      case "food": return "Diet serving";
      case "electricity": return "Appliance run";
      case "shopping": return "Purchase item";
      default: return "Activity";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport": return <Car className="h-4 w-4 text-blue-400" />;
      case "food": return <Utensils className="h-4 w-4 text-emerald-400" />;
      case "electricity": return <Zap className="h-4 w-4 text-amber-400" />;
      case "shopping": return <ShoppingBag className="h-4 w-4 text-violet-400" />;
      default: return <History className="h-4 w-4 text-zinc-400" />;
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    let computedCarbon = 0;
    let unit = "units";

    if (addCategory === "transport") {
      const mode = (addType || "gasolineCar") as TransportMode;
      computedCarbon = calculateTransportEmissions(mode, addValue);
      unit = "km";
    } else if (addCategory === "food") {
      const food = (addType || "poultry") as FoodType;
      computedCarbon = calculateFoodEmissions([{ type: food, servings: addValue }]);
      unit = "servings";
    } else if (addCategory === "electricity") {
      const app = (addType || "airConditioner") as ApplianceType;
      computedCarbon = calculateElectricityEmissions([{ type: app, hours: addValue }]);
      unit = "hours";
    } else if (addCategory === "shopping") {
      computedCarbon = calculateShoppingEmissions([{ category: (addType || "misc") as any, count: addValue }]);
      unit = "items";
    }

    computedCarbon = Math.round(computedCarbon * 100) / 100;

    const newLog: Omit<LogEntry, "id"> = {
      category: addCategory,
      label: addNote || `${addCategory.charAt(0).toUpperCase() + addCategory.slice(1)} manual log`,
      value: addValue,
      unit,
      carbon: computedCarbon,
      date: new Date().toISOString().split("T")[0],
      note: addNote,
    };

    try {
      if (!isMock) {
        await addDoc(collection(db, "activities"), {
          userId: profile.uid,
          category: addCategory,
          value: addValue,
          unit,
          carbonEmit: computedCarbon,
          date: new Date(),
          note: newLog.label,
        });
      }

      // Prepend to UI list
      setEntries(prev => [{ id: Math.random().toString(), ...newLog }, ...prev]);
      
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
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
      if (!isMock) {
        await deleteDoc(doc(db, "activities", id));
      }
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search logic
  const filtered = entries.filter((e) => {
    const matchesSearch = e.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.note?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Paginated slices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="space-y-8">
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
          <Plus className="h-4 w-4" />
          <span>Add Activity</span>
        </Button>
      </div>

      {/* Main filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-white/[0.06] rounded-xl overflow-x-auto w-full md:w-auto">
          {["all", "transport", "food", "electricity", "shopping"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
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
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 font-mono"
          />
        </div>
      </div>

      {/* History logs grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-20">
            <div className="w-6 h-6 border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full mx-auto" />
          </div>
        ) : currentItems.length === 0 ? (
          <GlassCard className="col-span-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-zinc-300">No logs found</h3>
            <p className="text-xs text-zinc-500 mt-1">Try resetting filters or log a new activity.</p>
          </GlassCard>
        ) : (
          currentItems.map((item) => (
            <GlassCard key={item.id} className="p-5 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950/60 border border-white/[0.08] flex items-center justify-center shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">{item.label}</h4>
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
                  className="p-1.5 rounded-lg border border-transparent hover:border-red-500/10 hover:bg-red-500/5 text-zinc-600 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-base font-bold text-zinc-100 mb-6">Log Carbon Activity</h3>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["transport", "food", "electricity", "shopping"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setAddCategory(cat);
                        setAddType(""); // reset type
                      }}
                      className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer ${
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
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
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
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Volume / Amount</label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {addCategory === "transport" && "km"}
                    {addCategory === "food" && "servings"}
                    {addCategory === "electricity" && "hours"}
                    {addCategory === "shopping" && "items"}
                  </span>
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={addValue}
                  onChange={(e) => setAddValue(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. 'Commute to school', 'Had steak'"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full py-3 mt-4" loading={submitting}>
                Add Entry
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
