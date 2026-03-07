import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to WebSocket server");
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from WebSocket server");
        });

        socket.onAny((eventName, data) => {
            if (onEvent) {
                onEvent(eventName, data);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [onEvent]);

    const emit = (event: string, data: any) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    return { socket: socketRef.current, emit };
};
