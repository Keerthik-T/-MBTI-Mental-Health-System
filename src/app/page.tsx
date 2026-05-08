"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender: "user" | "system";
  text: string;
  timestamp: string;
};

type Scores = {
  ti: number;
  te: number;
  fi: number;
  fe: number;
  ni: number;
  ne: number;
  si: number;
  se: number;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "system",
      text: "Cognitive OS Kernel v1.0.0 initialized. Ready for System Audit. Awaiting user input...",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uptime, setUptime] = useState(100);
  const [scores, setScores] = useState<Scores>({
    ti: 0.5,
    te: 0.5,
    fi: 0.5,
    fe: 0.5,
    ni: 0.5,
    ne: 0.5,
    si: 0.5,
    se: 0.5,
  });
  const [fault, setFault] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const radarData = [
    { subject: "Ti", A: scores.ti * 100, fullMark: 100 },
    { subject: "Te", A: scores.te * 100, fullMark: 100 },
    { subject: "Fi", A: scores.fi * 100, fullMark: 100 },
    { subject: "Fe", A: scores.fe * 100, fullMark: 100 },
    { subject: "Ni", A: scores.ni * 100, fullMark: 100 },
    { subject: "Ne", A: scores.ne * 100, fullMark: 100 },
    { subject: "Si", A: scores.si * 100, fullMark: 100 },
    { subject: "Se", A: scores.se * 100, fullMark: 100 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rant: userMessage.text }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to parse");

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "system",
        text: `[SYSTEM AUDIT COMPLETE]\n\nFault Detected: ${data.fault_detected}\n\nPatch Notes: ${data.patch_notes}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, systemMessage]);
      if (data.scores) {
        setScores(data.scores);
      }
      setFault(data.fault_detected);

      // Attempt to save to Supabase
      try {
        await supabase.from("system_logs").insert([
          {
            rant: userMessage.text,
            scores: data.scores,
            fault_detected: data.fault_detected,
            patch_notes: data.patch_notes,
          },
        ]);
        // Simple Uptime Logic Demo (resets if no logic is applied, otherwise increments)
        setUptime((prev) => prev + 1);
      } catch (dbError) {
        console.error("Database save failed:", dbError);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "system",
        text: `[CRITICAL ERROR] ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-background text-foreground font-mono overflow-hidden selection:bg-green selection:text-background z-10 relative">
      {/* LEFT PANEL: Chat Window */}
      <div className="flex flex-col flex-1 border-r border-green/30 p-4 relative z-10">
        <header className="flex items-center gap-2 pb-4 border-b border-green/30 text-green mb-4 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
          <TerminalIcon className="w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest uppercase">Cognitive OS Debugger</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
              <span className="text-cyan opacity-50">[{msg.timestamp}] </span>
              <span className={msg.sender === "system" ? "text-green font-bold" : "text-white"}>
                {msg.sender === "system" ? "sys@cognitive-os:~$ " : "user@cognitive-os:~$ "}
              </span>
              <span className={msg.sender === "system" ? "text-green/90" : "text-gray-300"}>
                {msg.text}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-sm md:text-base">
              <span className="text-cyan opacity-50">[{new Date().toLocaleTimeString()}] </span>
              <span className="text-green font-bold">sys@cognitive-os:~$ </span>
              <span className="animate-pulse">Processing cognitive input...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-start gap-2 pt-4 border-t border-green/30">
          <span className="text-green font-bold mt-1">user@cognitive-os:~$</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Enter rant or system query... (Press Enter to submit)"
            className="flex-1 bg-transparent border-none outline-none resize-none text-gray-300 placeholder-green/30 focus:ring-0 mt-1"
            rows={2}
            autoFocus
          />
        </form>
      </div>

      {/* RIGHT PANEL: Live Metrics */}
      <div className="w-80 lg:w-96 p-4 flex flex-col gap-6 relative z-10 bg-[#000511]/80 backdrop-blur-sm shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        {/* System Uptime */}
        <div className="border border-cyan/30 rounded p-4 bg-cyan/5">
          <div className="flex items-center gap-2 text-cyan mb-2">
            <Activity className="w-5 h-5" />
            <h2 className="uppercase font-bold tracking-wider">System Uptime</h2>
          </div>
          <div className="text-4xl font-bold text-white tracking-widest shadow-[0_0_10px_rgba(0,209,255,0.2)]">
            {uptime} <span className="text-sm text-cyan/70 font-normal">DAYS</span>
          </div>
          <div className="text-xs text-cyan/50 mt-2 uppercase">Discipline Streak</div>
        </div>

        {/* Radar Chart */}
        <div className="flex-1 border border-green/30 rounded p-4 bg-green/5 flex flex-col">
          <div className="flex items-center gap-2 text-green mb-4">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="uppercase font-bold tracking-wider">Live Metrics</h2>
          </div>
          <div className="flex-1 min-h-[250px] -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#00ff00" strokeOpacity={0.2} />
                <PolarAngleAxis dataKey="subject" stroke="#00ff00" tick={{ fill: "#00d1ff", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Cognitive Load"
                  dataKey="A"
                  stroke="#00ff00"
                  fill="#00ff00"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fault Status */}
        <div className={`border rounded p-4 ${fault ? "border-error/50 bg-error/10" : "border-green/30 bg-green/5"}`}>
          <div className={`flex items-center gap-2 mb-2 ${fault ? "text-error" : "text-green"}`}>
            <AlertTriangle className={`w-5 h-5 ${fault ? "animate-pulse" : ""}`} />
            <h2 className="uppercase font-bold tracking-wider">System Status</h2>
          </div>
          <div className="text-sm text-gray-300">
            {fault ? (
              <>
                <span className="text-error font-bold">FAULT DETECTED:</span> {fault}
              </>
            ) : (
              "Nominal operation. No critical faults detected."
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
