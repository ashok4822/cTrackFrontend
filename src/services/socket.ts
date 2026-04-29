import { io, Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

class SocketService {
  private static _instance: SocketService;
  private _socket: Socket;

  private constructor() {
    this._socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this._socket.on("connect", () => {
    });

    this._socket.on("disconnect", () => {
    });

    this._socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService._instance) {
      SocketService._instance = new SocketService();
    }
    return SocketService._instance;
  }

  public getSocket(): Socket {
    return this._socket;
  }

  public on(event: string, callback: (data: unknown) => void) {
    this._socket.on(event, callback);
  }

  public off(event: string, callback?: (data: unknown) => void) {
    if (callback) {
      this._socket.off(event, callback);
    } else {
      this._socket.off(event);
    }
  }

  public onAny(callback: (event: string, data: unknown) => void) {
    this._socket.onAny(callback);
  }

  public offAny(callback: (event: string, data: unknown) => void) {
    this._socket.offAny(callback);
  }

  public emit(event: string, data: unknown) {
    this._socket.emit(event, data);
  }
}

export const socketService = SocketService.getInstance();
