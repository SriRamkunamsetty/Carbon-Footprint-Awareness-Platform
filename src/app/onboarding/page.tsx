"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { aggregateMonthlyCarbon } from "@/lib/carbon/calculator";
import { calculateCarbonScore } from "@/lib/carbon/score";
import { TransportMode } from "@/lib/carbon/transport";
import { FoodType } from "@/lib/carbon/food";
import { ApplianceType } from "@/lib/carbon/electricity";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Award, Sparkles, Compass, Briefcase, User } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, onboardUser, loading } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Onboarding Form States
  // Step 1: Personal
  const [name, setName] = useState("");
  const [age, setAge] = useState(25);
  const [country, setCountry] = useState("United States");
  const [occupation, setOccupation] = useState("Technology");

  // Step 2: Transport (monthly km)
  const [carKm, setCarKm] = useState(600);
  const [carType, setCarType] = useState<"gasolineCar" | "electricCar">("gasolineCar");
  const [busKm, setBusKm] = useState(100);
  const [trainKm, setTrainKm] = useState(50);
  const [flightHours, setFlightHours] = useState(2);

  // Step 3: Diet (servings per week)
  const [beefServings, setBeefServings] = useState(3);
  const [poultryServings, setPoultryServings] = useState(4);
  const [dairyServings, setDairyServings] = useState(7);
  const [vegServings, setVegServings] = useState(14);
  const [isLocalOrganic, setIsLocalOrganic] = useState(false);

  // Step 4: Household (daily hours)
  const [acHours, setAcHours] = useState(4);
  const [heaterHours, setHeaterHours] = useState(2);
  const [computerHours, setComputerHours] = useState(6);
  const [renewablePercent, setRenewablePercent] = useState(10); // e.g. 10% solar/wind

  // Step 5: Goals & Submit
  const [carbonGoal, setCarbonGoal] = useState(300); // monthly limit target in kg CO2
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (profile?.onboarded) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  // Set name initially from profile when profile loads
  useEffect(() => {
    let active = true;
    if (profile && !name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (active) setName(profile.name || "");
    }
    return () => { active = false; };
    // Only run this effect when profile is loaded the first time to set the default name
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Map form values to aggregates for initial baseline carbon footprint calculation
      const transportInput = [
        { mode: carType as TransportMode, distanceKm: carKm },
        { mode: "bus" as TransportMode, distanceKm: busKm },
        { mode: "train" as TransportMode, distanceKm: trainKm },
        { mode: "flightShort" as TransportMode, distanceKm: flightHours * 800 } // convert flight hours to km
      ];

      const foodInput = {
        entries: [
          { type: "beef" as FoodType, servings: beefServings * 4 }, // convert weekly to monthly servings
          { type: "poultry" as FoodType, servings: poultryServings * 4 },
          { type: "dairy" as FoodType, servings: dairyServings * 4 },
          { type: "vegetables" as FoodType, servings: vegServings * 4 }
        ],
        isLocalOrOrganic: isLocalOrganic
      };

      const electricityInput = {
        usage: [
          { type: "airConditioner" as ApplianceType, hours: acHours * 30 }, // convert daily to monthly hours
          { type: "heater" as ApplianceType, hours: heaterHours * 30 },
          { type: "computer" as ApplianceType, hours: computerHours * 30 }
        ],
        renewableRatio: renewablePercent / 100
      };

      const monthlyCarbon = aggregateMonthlyCarbon({
        transport: transportInput,
        food: foodInput,
        electricity: electricityInput,
        shopping: [{ category: "misc", count: 4 }], // standard default
        water: { tapLiters: 3000, bottlesCount: 10 }, // standard average
        waste: { landfillKg: 20, recycledKg: 10, compostKg: 5 } // standard average
      });

      const score = calculateCarbonScore(monthlyCarbon);

      // Save onboarding data in profile
      await onboardUser({
        name,
        age: Number(age),
        country,
        occupation,
        goal: Number(carbonGoal),
        carbonScore: score,
        points: 100, // Reward 100 eco points for completing onboarding
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full" />
      </div>
    );
  }

  // Animation variants
  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial blobs */}
      <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[45vw] h-[45vw] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-lg mb-8 text-center relative z-10">
        <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
          Setup Wizard
        </span>
        <h1 className="text-xl font-bold mt-3 text-white">Let&apos;s Build Your Carbon Twin</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Answer a few quick questions to estimate your carbon index.
        </p>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between mt-6 px-10">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={`step-${stepNum}`} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                    (() => {
                      if (isActive) return "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]";
                      if (isCompleted) return "bg-zinc-800 border-zinc-700 text-emerald-400";
                      return "bg-transparent border-zinc-800 text-zinc-600";
                    })()
                  }`}
                >
                  {stepNum}
                </div>
                {idx < totalSteps - 1 && (
                  <div
                    className={`flex-grow h-[1px] mx-2 transition-colors duration-300 ${
                      isCompleted ? "bg-emerald-500/50" : "bg-zinc-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <GlassCard className="p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Personal Details</h2>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="displayName" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Display Name</label>
                  <input
                    id="displayName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="age" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Age</label>
                    <input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="occupation" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Occupation</label>
                    <input
                      id="occupation"
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Designer, Student"
                      className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="country" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Country of Residence</label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Canada, Germany"
                    className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Transport habits */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Compass className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Transportation Profile</h2>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="monthlyCarDrive" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Car Drive</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{carKm} km/mo</span>
                  </div>
                  <input
                    id="monthlyCarDrive"
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={carKm}
                    onChange={(e) => setCarKm(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  {carKm > 0 && (
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          checked={carType === "gasolineCar"}
                          onChange={() => setCarType("gasolineCar")}
                          className="accent-emerald-500"
                        />
                        Gasoline / Hybrid
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="radio"
                          checked={carType === "electricCar"}
                          onChange={() => setCarType("electricCar")}
                          className="accent-emerald-500"
                        />
                        Electric / EV
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="publicTransit" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Public Transit (Bus/Metro)</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{busKm + trainKm} km/mo</span>
                  </div>
                  <input
                    id="publicTransit"
                    type="range"
                    min="0"
                    max="1500"
                    step="25"
                    value={busKm}
                    onChange={(e) => {
                      setBusKm(Number(e.target.value));
                      setTrainKm(Math.round(Number(e.target.value) / 2));
                    }}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="annualFlightHours" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Annual Flight Hours</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{flightHours} hours/yr</span>
                  </div>
                  <input
                    id="annualFlightHours"
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={flightHours}
                    onChange={(e) => setFlightHours(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Diet habits */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Diet & Food Habits</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="redMeat" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Red Meat (Beef/Lamb)</label>
                    <span className="text-xs text-zinc-500 block font-mono">{beefServings} meals/week</span>
                    <input
                      id="redMeat"
                      type="range"
                      min="0"
                      max="14"
                      value={beefServings}
                      onChange={(e) => setBeefServings(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="poultry" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Poultry (Chicken/Pork)</label>
                    <span className="text-xs text-zinc-500 block font-mono">{poultryServings} meals/week</span>
                    <input
                      id="poultry"
                      type="range"
                      min="0"
                      max="14"
                      value={poultryServings}
                      onChange={(e) => setPoultryServings(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dairy" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Dairy & Cheese</label>
                    <span className="text-xs text-zinc-500 block font-mono">{dairyServings} servings/week</span>
                    <input
                      id="dairy"
                      type="range"
                      min="0"
                      max="28"
                      value={dairyServings}
                      onChange={(e) => setDairyServings(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="vegMeals" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Vegetarian Meals</label>
                    <span className="text-xs text-zinc-500 block font-mono">{vegServings} meals/week</span>
                    <input
                      id="vegMeals"
                      type="range"
                      min="0"
                      max="28"
                      value={vegServings}
                      onChange={(e) => setVegServings(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                <div className="border border-white/[0.06] rounded-xl p-3 bg-zinc-950/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200"><label htmlFor="localOrganic">Local & Organic Foods</label></h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Prefer locally sourced products</p>
                  </div>
                  <input
                    id="localOrganic"
                    type="checkbox"
                    checked={isLocalOrganic}
                    onChange={(e) => setIsLocalOrganic(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-zinc-950 border-white/[0.08]"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 4: Electricity habits */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Household Energy</h2>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="acHours" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Air Conditioner daily use</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{acHours} hours/day</span>
                  </div>
                  <input
                    id="acHours"
                    type="range"
                    min="0"
                    max="24"
                    value={acHours}
                    onChange={(e) => setAcHours(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="heaterHours" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Space Heater daily use</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{heaterHours} hours/day</span>
                  </div>
                  <input
                    id="heaterHours"
                    type="range"
                    min="0"
                    max="24"
                    value={heaterHours}
                    onChange={(e) => setHeaterHours(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="computerHours" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Computer / Console usage</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{computerHours} hours/day</span>
                  </div>
                  <input
                    id="computerHours"
                    type="range"
                    min="0"
                    max="24"
                    value={computerHours}
                    onChange={(e) => setComputerHours(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="renewablePercent" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Renewable Power offset</label>
                    <span className="text-xs text-emerald-400 font-bold font-mono">{renewablePercent}% solar/wind</span>
                  </div>
                  <input
                    id="renewablePercent"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={renewablePercent}
                    onChange={(e) => setRenewablePercent(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 5: Goals & Submit */}
            {step === 5 && (
              <motion.div
                key="step5"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5 text-center"
              >
                <div className="flex flex-col items-center gap-3 mb-6">
                  <Award className="h-8 w-8 text-emerald-400 animate-bounce" />
                  <h2 className="text-base font-semibold text-zinc-100">Monthly Reduction Targets</h2>
                  <p className="text-xs text-zinc-400">Set your monthly carbon footprint limit target. Global average is ~400 kg.</p>
                </div>

                <div className="space-y-4 max-w-xs mx-auto">
                  <div className="flex justify-between items-center">
                    <label htmlFor="carbonGoal" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Cap</label>
                    <span className="text-sm text-emerald-400 font-bold font-mono">{carbonGoal} kg CO₂</span>
                  </div>
                  <input
                    id="carbonGoal"
                    type="range"
                    min="100"
                    max="800"
                    step="20"
                    value={carbonGoal}
                    onChange={(e) => setCarbonGoal(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-left space-y-2 mt-4">
                    <h4 className="text-xs font-semibold text-zinc-300">🎉 Bonus Reward!</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      By completing this onboarding profile, you will earn **100 Eco XP** points and unlock the **&quot;Green Pioneer&quot;** level badge on the leaderboard.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.06]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button onClick={handleNext} className="flex items-center gap-1">
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={isSubmitting}>
                <span>Initialize Platform</span>
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
