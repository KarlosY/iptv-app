"use client";
import React, { createContext, useContext, useReducer, useCallback } from "react";
import type { Channel, Stream } from "@/domain/entities";
import { useAppStore } from "@/presentation/store/useAppStore";

// ─── State ───────────────────────────────────────────────────────────────────
interface PlayerState {
    isOpen: boolean;
    channel: Channel | null;
    streams: Stream[];
    activeStreamUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: PlayerState = {
    isOpen: false,
    channel: null,
    streams: [],
    activeStreamUrl: null,
    isLoading: false,
    error: null,
};

// ─── Actions ─────────────────────────────────────────────────────────────────
type Action =
    | { type: "OPEN_PLAYER"; channel: Channel; streams: Stream[] }
    | { type: "CLOSE_PLAYER" }
    | { type: "SET_LOADING" }
    | { type: "SET_ERROR"; error: string }
    | { type: "SET_STREAM"; url: string };

function reducer(state: PlayerState, action: Action): PlayerState {
    switch (action.type) {
        case "OPEN_PLAYER":
            return {
                ...state,
                isOpen: true,
                channel: action.channel,
                streams: action.streams,
                activeStreamUrl: action.streams[0]?.url ?? null,
                isLoading: false,
                error: null,
            };
        case "CLOSE_PLAYER":
            return { ...initialState };
        case "SET_LOADING":
            return { ...state, isLoading: true, error: null };
        case "SET_ERROR":
            return { ...state, isLoading: false, error: action.error };
        case "SET_STREAM":
            return { ...state, activeStreamUrl: action.url };
        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface PlayerContextValue {
    state: PlayerState;
    openPlayer: (channel: Channel, streams: Stream[]) => void;
    closePlayer: () => void;
    setStream: (url: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const addRecentChannel = useAppStore(s => s.addRecentChannel);

    const openPlayer = useCallback((channel: Channel, streams: Stream[]) => {
        addRecentChannel(channel.id);
        dispatch({ type: "OPEN_PLAYER", channel, streams });
    }, [addRecentChannel]);

    const closePlayer = useCallback(() => {
        dispatch({ type: "CLOSE_PLAYER" });
    }, []);

    const setStream = useCallback((url: string) => {
        dispatch({ type: "SET_STREAM", url });
    }, []);

    return (
        <PlayerContext.Provider value={{ state, openPlayer, closePlayer, setStream }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
}
