"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

// Play pleasant web audio chime
export function playChime(frequency = 587.33, type: OscillatorType = "sine") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.debug("Audio playback ignored:", err);
  }
}

export function AudioAlert() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("rh_sound_alerts");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }

    const socket = getSocket();

    const handleNewMessage = (msg: { text?: string; sender?: string }) => {
      if (soundEnabled && msg.sender === "CUSTOMER") {
        playChime(659.25); // E5 note
        toast.info("New customer message", {
          description: msg.text?.slice(0, 50) || "Customer sent a message",
        });
      }
    };

    const handleNewOrder = (data: { orderId?: string; totalAmount?: number }) => {
      if (soundEnabled) {
        playChime(880); // A5 note
        toast.success("New order received!", {
          description: `Order ${data.orderId || ""} - ৳${data.totalAmount || ""}`,
        });
      }
    };

    const handlePaymentPending = (data: { orderId?: string; trxId?: string }) => {
      if (soundEnabled) {
        playChime(523.25); // C5 note
        toast.warning("bKash/Nagad Payment verification pending!", {
          description: `Order ${data.orderId} - TrxID: ${data.trxId || "Submitted"}`,
        });
      }
    };

    const handleLowStock = (data: { productName?: string; remainingStock?: number }) => {
      if (soundEnabled) {
        playChime(392); // G4 note
        toast.error("Low stock warning!", {
          description: `${data.productName || "Product"} has only ${data.remainingStock ?? 0} units left!`,
        });
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("order:new", handleNewOrder);
    socket.on("payment:pending", handlePaymentPending);
    socket.on("inventory:low_stock", handleLowStock);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("order:new", handleNewOrder);
      socket.off("payment:pending", handlePaymentPending);
      socket.off("inventory:low_stock", handleLowStock);
    };
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("rh_sound_alerts", String(next));
    if (next) {
      playChime(783.99); // G5 preview tone
      toast.success("Sound alerts enabled");
    } else {
      toast.info("Sound alerts muted");
    }
  };

  return (
    <button
      onClick={toggleSound}
      title={soundEnabled ? "Mute audio alerts" : "Enable audio alerts"}
      className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted"
    >
      {soundEnabled ? (
        <Volume2 className="size-4 text-amber-500" />
      ) : (
        <VolumeX className="size-4 text-muted-foreground" />
      )}
    </button>
  );
}
