import type { MenuItemId } from "./menu";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  groupId: string | null;
  itemId: MenuItemId;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterUsername: string;
  inviteeId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Database {
  users: User[];
  groups: Group[];
  transactions: Transaction[];
  invitations: Invitation[];
}

export type AccountType = "personal" | "group";
