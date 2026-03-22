import { useEffect, useRef, useCallback } from "react";
import { socketService } from "@/services/socket";

export const useSocket = (onEvent?: (event: string, data: unknown) => void) => {
  const onEventRef = useRef(onEvent);

  // Keep onEventRef up to date without re-triggering the effect
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const handleAny = (eventName: string, data: unknown) => {
      if (onEventRef.current) {
        onEventRef.current(eventName, data);
      }
    };

    socketService.onAny(handleAny);

    return () => {
      socketService.offAny(handleAny);
    };
  }, []);

  const emit = useCallback(
    (event: string, data: unknown) => {
      socketService.emit(event, data);
    },
    [],
  );

  return { socket: socketService.getSocket(), emit };
};
