import type { PublicOrderItem } from "@/lib/public-ordering";

export type CartLine = PublicOrderItem & { id: string };

export type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

export type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
};
