import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

export const useSocket = (onEvent?: (event: string, data: unknown) => void) => {
  const [socket] = useState<Socket>(() =>
    io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }),
  );
  const onEventRef = useRef(onEvent);

  // Keep onEventRef up to date without re-triggering the effect
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.onAny((eventName: string, data: unknown) => {
      if (onEventRef.current) {
        onEventRef.current(eventName, data);
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [socket]);

  const emit = useCallback(
    (event: string, data: unknown) => {
      socket.emit(event, data);
    },
    [socket],
  );

  return { socket, emit };
};
