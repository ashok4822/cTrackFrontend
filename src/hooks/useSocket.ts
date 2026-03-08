import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
    const socketRef = useRef<Socket | null>(null);
    const onEventRef = useRef(onEvent);

    // Keep onEventRef up to date without re-triggering the effect
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to WebSocket server");
        });

        socket.on("disconnect", (reason) => {
            console.log("Disconnected from WebSocket server:", reason);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        socket.onAny((eventName, data) => {
            if (onEventRef.current) {
                onEventRef.current(eventName, data);
            }
        });

        return () => {
            socket.off();
            socket.disconnect();
        };
    }, []); // Only run once on mount

    const emit = useCallback((event: string, data: any) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    }, []);

    return { socket: socketRef.current, emit };
};
