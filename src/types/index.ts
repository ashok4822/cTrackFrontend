//User Types
export type UserRole = "admin" | "operator" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
}
