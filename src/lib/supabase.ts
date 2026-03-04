import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file"
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Shared types that mirror your DB schema ──────────────────────────────────

export interface Farmer {
    id: string;
    alias: string;
    full_name: string | null;
    phone_number: string;
    created_at: string;
}

export interface Equipment {
    id: string;
    name: string;
    type: string;
    operating_hours: number;
    daily_rate: number;
    status: "Available" | "In Use / Hiram" | "Under Maintenance" | "Retired";
    created_at: string;
}

export interface Transaction {
    id: string;
    farmer_id: string;
    equipment_id: string;
    start_date: string;       // ISO date string "YYYY-MM-DD"
    end_date: string;         // computed by DB
    duration_days: number;
    revenue: number | null;
    status: "Confirmed" | "Ongoing" | "Completed" | "Cancelled";
    sms_raw: string | null;
    created_at: string;
    // joined fields (when queried with select)
    farmers?: Pick<Farmer, "alias" | "full_name">;
    equipment?: Pick<Equipment, "name" | "type">;
}
