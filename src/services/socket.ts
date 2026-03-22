import { io, Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

class SocketService {
  private static instance: SocketService;
  private socket: Socket;

  private constructor() {
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public on(event: string, callback: (data: unknown) => void) {
    this.socket.on(event, callback);
  }

  public off(event: string, callback?: (data: unknown) => void) {
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  public onAny(callback: (event: string, data: unknown) => void) {
    this.socket.onAny(callback);
  }

  public offAny(callback: (event: string, data: unknown) => void) {
    this.socket.offAny(callback);
  }

  public emit(event: string, data: unknown) {
    this.socket.emit(event, data);
  }
}

export const socketService = SocketService.getInstance();
