"use client";
import { useEffect } from "react";

export function RegisterSW() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then(
                (reg) => console.log("Service Worker registrado con éxito:", reg.scope),
                (err) => console.error("Fallo al registrar el Service Worker:", err)
            );
        }
    }, []);

    return null;
}
