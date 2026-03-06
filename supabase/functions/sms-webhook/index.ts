// @ts-ignore: Deno runtime types
/// <reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.d.ts" />
// supabase/functions/sms-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

interface SemaphorePayload {
  from: string;       // sender's phone number
  to: string;         // your Semaphore number
  message: string;    // raw SMS text
  network?: string;
  received_at?: string;
}

interface ParsedSMS {
  alias: string;
  equipmentName: string;
  startDate: string;  // YYYY-MM-DD
  durationDays: number;
}

// ============================================
// SMS PARSER
// Format: HIRAM [ALIAS] [EQUIPMENT] [MM-DD] [DAYS?]
// Example: "HIRAM JUAN TRACTOR 03-05"
// Example: "HIRAM JUAN WATER PUMP 03-05 3"
// ============================================

function parseSMS(raw: string): ParsedSMS | null {
  // Normalize: uppercase, collapse whitespace
  const text = raw.trim().toUpperCase().replace(/\s+/g, " ");

  // Must start with HIRAM
  if (!text.startsWith("HIRAM ")) {
    return null;
  }

  // Remove the command keyword
  const body = text.slice(6).trim(); // everything after "HIRAM "

  // The date is always in MM-DD format — use it as an anchor
  // Pattern: ALIAS(one word) + EQUIPMENT(one or more words) + MM-DD + optional DAYS
  const pattern = /^(\S+)\s+(.+?)\s+(\d{2}-\d{2})(?:\s+(\d+))?$/;
  const match = body.match(pattern);

  if (!match) return null;

  const [, alias, equipmentName, mmdd, daysStr] = match;

  // Append current year to form a full ISO date
  const year = new Date().getFullYear();
  const startDate = `${year}-${mmdd.replace("-", "-")}`; // YYYY-MM-DD

  // Validate the date is real
  const parsed = new Date(startDate);
  if (isNaN(parsed.getTime())) return null;

  const durationDays = daysStr ? Math.max(1, parseInt(daysStr, 10)) : 1;

  return {
    alias: alias.trim(),
    equipmentName: equipmentName.trim(),
    startDate,
    durationDays,
  };
}

// ============================================
// SEMAPHORE OUTBOUND SMS
// ============================================

async function sendSMS(to: string, message: string): Promise<void> {
  const apiKey = Deno.env.get("SEMAPHORE_API_KEY")!;
  const senderName = Deno.env.get("SEMAPHORE_SENDER_NAME") ?? "EBUKID";

  const body = new URLSearchParams({
    apikey: apiKey,
    number: to,
    message,
    sendername: senderName,
  });

  const res = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Semaphore send failed:", err);
    throw new Error(`Semaphore API error: ${err}`);
  }

  console.log("SMS sent successfully to", to);
}

// ============================================
// FORMAT DISPLAY DATE (for SMS reply)
// e.g., "2025-03-05" → "Marso 5, 2025"
// ============================================

function formatDateTagalog(isoDate: string): string {
  const months: Record<number, string> = {
    1: "Enero", 2: "Pebrero", 3: "Marso", 4: "Abril",
    5: "Mayo", 6: "Hunyo", 7: "Hulyo", 8: "Agosto",
    9: "Setyembre", 10: "Oktubre", 11: "Nobyembre", 12: "Disyembre",
  };
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${months[month]} ${day}, ${year}`;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // --- 1. Parse Semaphore Payload ---
    // Semaphore sends form-encoded or JSON depending on configuration
    let payload: SemaphorePayload;
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      // form-encoded (Semaphore default)
      const form = await req.formData();
      payload = {
        from: form.get("from")?.toString() ?? "",
        to: form.get("to")?.toString() ?? "",
        message: form.get("message")?.toString() ?? "",
      };
    }

    console.log("Incoming SMS:", payload);

    const senderPhone = payload.from;
    const rawMessage = payload.message ?? "";

    // --- 2. Parse the SMS ---
    const parsed = parseSMS(rawMessage);

    if (!parsed) {
      // Send a helpful error reply if format is wrong
      await sendSMS(
        senderPhone,
        "Hindi namin naintindihan ang iyong mensahe. " +
        "Gamitin ang format: HIRAM [ALIAS] [KAGAMITAN] [MM-DD]\n" +
        "Halimbawa: HIRAM JUAN TRACTOR 03-05"
      );
      return new Response(JSON.stringify({ error: "Invalid SMS format" }), {
        status: 200, // Always 200 to Semaphore so it doesn't retry
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 3. Initialize Supabase client ---
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- 4. Look up Farmer by alias (case-insensitive) ---
    const { data: farmer, error: farmerError } = await supabase
      .from("farmers")
      .select("id, alias, full_name")
      .ilike("alias", parsed.alias)
      .single();

    if (farmerError || !farmer) {
      await sendSMS(
        senderPhone,
        `Hindi nahanap ang farmer na "${parsed.alias}" sa aming sistema. ` +
        "Makipag-ugnayan sa inyong barangay technician."
      );
      return new Response(JSON.stringify({ error: "Farmer not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 5. Look up Equipment by name (case-insensitive) ---
    const { data: equipment, error: equipError } = await supabase
      .from("equipment")
      .select("id, name, status, daily_rate")
      .ilike("name", parsed.equipmentName)
      .single();

    if (equipError || !equipment) {
      await sendSMS(
        senderPhone,
        `Hindi nahanap ang kagamitan na "${parsed.equipmentName}". ` +
        "Pakitingnan ang tamang pangalan at subukan ulit."
      );
      return new Response(JSON.stringify({ error: "Equipment not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 6. Check equipment availability ---
    // Block if not explicitly "Available" — covers In Use, Under Maintenance, Retired, or any other status
    if (equipment.status !== "Available") {
      const reason =
        equipment.status === "Retired"          ? "hindi na available (retired)" :
        equipment.status === "Under Maintenance" ? "nasa pagpapaayos" :
        equipment.status === "In Use / Hiram"    ? "kasalukuyang ginagamit ng ibang magsasaka" :
                                                   "hindi available sa ngayon";
      await sendSMS(
        senderPhone,
        `Paumanhin, ang ${equipment.name} ay ${reason}. ` +
        "Makipag-ugnayan sa inyong barangay technician para sa alternatibo."
      );
      return new Response(JSON.stringify({ error: `Equipment unavailable: ${equipment.status}` }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 7. Check for date conflicts on this equipment ---
    const endDate = new Date(parsed.startDate);
    endDate.setDate(endDate.getDate() + parsed.durationDays - 1);
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data: conflicts, error: conflictError } = await supabase
      .from("transactions")
      .select("id, start_date, end_date, farmers ( alias )")
      .eq("equipment_id", equipment.id)
      .in("status", ["Confirmed", "Ongoing"])
      .lte("start_date", endDateStr)
      .gte("end_date", parsed.startDate);

    if (conflictError) {
      console.error("Conflict check error:", conflictError);
    }

    if (conflicts && conflicts.length > 0) {
      const clash = conflicts[0] as any;
      const clashFarmer = clash.farmers?.alias ?? "ibang magsasaka";
      const clashDate = formatDateTagalog(clash.start_date);
      await sendSMS(
        senderPhone,
        `Paumanhin, ang ${equipment.name} ay nakalaan na para kay ${clashFarmer} ` +
        `simula ${clashDate}. Pumili ng ibang petsa o kagamitan.`
      );
      return new Response(JSON.stringify({ error: "Equipment already booked for that date" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- 8. Insert into Transactions ---
    // Compute end_date explicitly so conflict queries always have it populated
    const insertEndDate = new Date(parsed.startDate);
    insertEndDate.setDate(insertEndDate.getDate() + parsed.durationDays - 1);
    const insertEndDateStr = insertEndDate.toISOString().split("T")[0];

    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        farmer_id: farmer.id,
        equipment_id: equipment.id,
        start_date: parsed.startDate,
        end_date: insertEndDateStr,
        duration_days: parsed.durationDays,
        status: "Confirmed",
        sms_raw: rawMessage,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      await sendSMS(
        senderPhone,
        "May error sa pag-record ng iyong booking. Subukan ulit o makipag-ugnayan sa technician."
      );
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Equipment status is automatically updated by the DB trigger
    // (trg_sync_equipment_status) when the transaction row is inserted.

    // --- 9. Send confirmation SMS in Tagalog ---
    const displayDate = formatDateTagalog(parsed.startDate);
    const displayName = farmer.full_name ?? farmer.alias;
    const daysText = parsed.durationDays === 1
      ? "1 araw"
      : `${parsed.durationDays} araw`;
    const revenue = (equipment.daily_rate * parsed.durationDays).toLocaleString("en-PH");

    const confirmationMessage =
      `Salamat, ${displayName}! ✅\n` +
      `Kumpirmado ang iyong booking:\n` +
      `• Kagamitan: ${equipment.name}\n` +
      `• Petsa: ${displayDate}\n` +
      `• Tagal: ${daysText}\n` +
      `• Bayad: ₱${revenue}\n` +
      `Ref#: ${transaction.id.slice(0, 8).toUpperCase()}`;

    await sendSMS(senderPhone, confirmationMessage);

    console.log("Booking confirmed:", transaction.id);

    return new Response(JSON.stringify({ success: true, transaction_id: transaction.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});