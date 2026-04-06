import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(backendRoot, "..");

// Load workspace .env first, then allow backend/.env to override when present.
dotenv.config({ path: path.join(workspaceRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });

const {
  PORT = "8080",
  SUPABASE_SERVICE_ROLE_KEY = "",
  CORS_ORIGINS = "http://localhost:8082",
} = process.env;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const RESOLVED_SUPABASE_SERVICE_ROLE_KEY =
  SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) {
  throw new Error(
    "Missing SUPABASE_URL environment variable in backend service. Set SUPABASE_URL (or VITE_SUPABASE_URL in root .env)."
  );
}

const allowedOrigins = CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const createSupabaseClient = (authHeader = "") => {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing SUPABASE_ANON_KEY environment variable in backend service. Set SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY in root .env)."
    );
  }

  const headers = {};
  if (authHeader) {
    headers.authorization = authHeader;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers,
    },
  });
};

const createServiceRoleClient = () => {
  if (!RESOLVED_SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(SUPABASE_URL, RESOLVED_SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const getRequestAuthHeader = (req) => {
  const header = req.headers.authorization;
  return typeof header === "string" ? header : "";
};

const PROFILE_UPDATABLE_FIELDS = new Set([
  "email",
  "first_name",
  "last_name",
  "full_name",
  "phone",
  "role",
  "status",
  "avatar_url",
  "metadata",
  "last_login_at",
  "is_active",
  "email_confirmed",
  "email_confirmed_at",
  "approved_by",
  "approved_at",
  "approved",
  "user_type",
  "approval_notes",
  "assigned_property_id",
]);

const pickProfileUpdates = (updates) => {
  const input = updates && typeof updates === "object" ? updates : {};
  const payload = Object.entries(input).reduce((acc, [key, value]) => {
    if (PROFILE_UPDATABLE_FIELDS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (
    payload.full_name === undefined &&
    (payload.first_name !== undefined || payload.last_name !== undefined)
  ) {
    const first = String(payload.first_name || "").trim();
    const last = String(payload.last_name || "").trim();
    const combined = [first, last].filter(Boolean).join(" ");
    if (combined) {
      payload.full_name = combined;
    }
  }

  return payload;
};

const sendSupabaseError = (res, error, fallbackMessage, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: error?.message || fallbackMessage,
    code: error?.code || null,
    details: error?.details || null,
  });
};

const requireSuperAdmin = async (req, res) => {
  const authHeader = getRequestAuthHeader(req);
  if (!authHeader) {
    res.status(401).json({ success: false, error: "Missing Authorization header" });
    return null;
  }

  let userClient;
  try {
    userClient = createSupabaseClient(authHeader);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    res.status(401).json({ success: false, error: authError?.message || "Unauthorized" });
    return null;
  }

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    sendSupabaseError(res, profileError, "Failed to verify user role", 403);
    return null;
  }

  if (profile?.role !== "super_admin") {
    res.status(403).json({ success: false, error: "Super admin role is required" });
    return null;
  }

  const elevatedClient = createServiceRoleClient() || userClient;

  return { userClient: elevatedClient, userId: user.id };
};

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-client-info",
      "x-supabase-api-version",
      "x-application",
      "x-client",
      "x-site-url",
    ],
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "kenya-realtors-backend",
    supabaseUrl: SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/properties", async (req, res) => {
  const authHeader = getRequestAuthHeader(req);
  let client;

  try {
    client = createSupabaseClient(authHeader);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  // Keep RLS-scoped reads for regular users, but let verified super admins
  // use service-role reads so properties don't disappear due missing SELECT policy.
  if (authHeader) {
    try {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "super_admin") {
          const serviceRoleClient = createServiceRoleClient();
          if (serviceRoleClient) {
            client = serviceRoleClient;
          }
        }
      }
    } catch (roleResolutionError) {
      console.error("Failed to resolve role for /api/properties:", roleResolutionError);
    }
  }

  const { data: properties, error: propsError } = await client
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (propsError) {
    sendSupabaseError(res, propsError, "Failed to fetch properties");
    return;
  }

  if (!properties || properties.length === 0) {
    res.json([]);
    return;
  }

  const { data: unitTypes, error: unitsError } = await client.from("property_unit_types").select("*");
  const { data: realUnits, error: realUnitsError } = await client.from("units").select("property_id, price");

  if (unitsError) {
    sendSupabaseError(res, unitsError, "Failed to fetch property unit types");
    return;
  }

  if (realUnitsError) {
    sendSupabaseError(res, realUnitsError, "Failed to fetch units");
    return;
  }

  const mapped = properties.map((prop) => {
    const propUnitTypes = (unitTypes || []).filter((unit) => unit.property_id === prop.id);
    const definedTotalUnits = propUnitTypes.reduce((sum, unit) => sum + (unit.units_count || 0), 0);
    const definedExpectedIncome = propUnitTypes.reduce(
      (sum, unit) => sum + Number(unit.units_count || 0) * Number(unit.price_per_unit || 0),
      0
    );

    const propRealUnits = (realUnits || []).filter((unit) => unit.property_id === prop.id);
    const realTotalUnits = propRealUnits.length;
    const realExpectedIncome = propRealUnits.reduce((sum, unit) => sum + (Number(unit.price) || 0), 0);

    const useReal = realTotalUnits > 0;

    return {
      ...prop,
      property_unit_types: propUnitTypes,
      total_units: useReal ? realTotalUnits : definedTotalUnits,
      expected_income: useReal ? realExpectedIncome : definedExpectedIncome,
    };
  });

  res.json(mapped);
});

app.post("/api/properties", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const property = req.body || {};

  const sanitizedTemplates = (property.initial_charge_templates || [])
    .map((item, index) => ({
      id: item.id || `tpl-${Date.now()}-${index}`,
      name: String(item.name || "").trim(),
      charge_type: item.charge_type === "fee" ? "fee" : "deposit",
      amount: Number(item.amount || 0),
    }))
    .filter((item) => item.name && item.amount >= 0);

  const normalizedSecurityDepositMonths = Math.max(
    1,
    Math.round(Number(property.security_deposit_months || 1)) || 1
  );

  const basePropertyPayload = {
    name: property.name,
    location: property.location,
    image_url: property.image_url,
    type: property.type,
    description: property.description,
    amenities: property.amenities,
    number_of_floors: property.number_of_floors || 1,
  };

  if (!basePropertyPayload.name || !basePropertyPayload.location) {
    res.status(400).json({ success: false, error: "name and location are required" });
    return;
  }

  let propData = null;
  const insertWithTemplates = await guard.userClient
    .from("properties")
    .insert({
      ...basePropertyPayload,
      initial_charge_templates: sanitizedTemplates,
      first_payment_defaults: {
        security_deposit_months: normalizedSecurityDepositMonths,
      },
    })
    .select()
    .single();

  if (insertWithTemplates.error) {
    const errorText = String(insertWithTemplates.error.message || "").toLowerCase();
    const missingTemplates = errorText.includes("initial_charge_templates");
    const missingDefaults = errorText.includes("first_payment_defaults");

    if (!missingTemplates && !missingDefaults) {
      sendSupabaseError(res, insertWithTemplates.error, "Failed to create property");
      return;
    }

    const fallbackPayload = {
      ...basePropertyPayload,
      ...(missingTemplates
        ? {}
        : {
            initial_charge_templates: sanitizedTemplates,
          }),
      ...(missingDefaults
        ? {}
        : {
            first_payment_defaults: {
              security_deposit_months: normalizedSecurityDepositMonths,
            },
          }),
    };

    const retryWithoutMissingColumns = await guard.userClient
      .from("properties")
      .insert(fallbackPayload)
      .select()
      .single();

    if (retryWithoutMissingColumns.error) {
      sendSupabaseError(res, retryWithoutMissingColumns.error, "Failed to create property");
      return;
    }

    propData = retryWithoutMissingColumns.data;
  } else {
    propData = insertWithTemplates.data;
  }

  if (!propData) {
    res.status(500).json({ success: false, error: "Failed to create property" });
    return;
  }

  if (Array.isArray(property.units) && property.units.length > 0) {
    const unitsToInsert = property.units.map((unit) => ({
      property_id: propData.id,
      name: unit.name,
      units_count: unit.units_count,
      price_per_unit: unit.price_per_unit,
      sample_image_url: unit.sample_image_url?.trim() || null,
    }));

    const { error: unitsError } = await guard.userClient.from("property_unit_types").insert(unitsToInsert);

    if (unitsError) {
      sendSupabaseError(res, unitsError, "Property created but unit types failed to save");
      return;
    }
  }

  res.status(201).json(propData);
});

app.patch("/api/properties/:id", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const { id } = req.params;
  const updates = req.body || {};

  const payload = {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.location !== undefined ? { location: updates.location } : {}),
    ...(updates.image_url !== undefined ? { image_url: updates.image_url } : {}),
    ...(updates.type !== undefined ? { type: updates.type } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.amenities !== undefined ? { amenities: updates.amenities } : {}),
    ...(updates.number_of_floors !== undefined ? { number_of_floors: updates.number_of_floors } : {}),
  };

  if (Object.keys(payload).length === 0) {
    res.status(400).json({ success: false, error: "No valid property fields provided" });
    return;
  }

  const { data, error } = await guard.userClient
    .from("properties")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    sendSupabaseError(res, error, "Failed to update property");
    return;
  }

  res.json(data);
});

app.delete("/api/properties/:id", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const { id } = req.params;
  const db = guard.userClient;

  const ignoreMissingTableError = (error) => error?.code === "42P01";
  const ignoreMissingColumnError = (error) => error?.code === "42703";
  const shouldIgnoreDeleteError = (error) =>
    ignoreMissingTableError(error) || ignoreMissingColumnError(error);

  const deleteByProperty = async (table) => {
    const { error } = await db.from(table).delete().eq("property_id", id);
    if (error && !shouldIgnoreDeleteError(error)) {
      throw new Error(`[${table}] ${error.message}`);
    }
  };

  const deleteByIds = async (table, column, ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return;
    }

    const { error } = await db.from(table).delete().in(column, ids);
    if (error && !shouldIgnoreDeleteError(error)) {
      throw new Error(`[${table}] ${error.message}`);
    }
  };

  const fetchIdsByProperty = async (table) => {
    const { data, error } = await db.from(table).select("id").eq("property_id", id);
    if (error) {
      if (shouldIgnoreDeleteError(error)) {
        return [];
      }
      throw new Error(`[${table}] ${error.message}`);
    }
    return (data || []).map((row) => row.id).filter(Boolean);
  };

  const { error: profileUpdateError } = await db
    .from("profiles")
    .update({ assigned_property_id: null })
    .eq("assigned_property_id", id);

  if (profileUpdateError && !ignoreMissingColumnError(profileUpdateError)) {
    res.status(400).json({ success: false, error: `[profiles] ${profileUpdateError.message}` });
    return;
  }

  try {
    const [unitIds, maintenanceRequestIds, vacancyNoticeIds] = await Promise.all([
      fetchIdsByProperty("units"),
      fetchIdsByProperty("maintenance_requests"),
      fetchIdsByProperty("vacancy_notices"),
    ]);

    if (maintenanceRequestIds.length > 0) {
      const { error: unlinkCompletionError } = await db
        .from("maintenance_requests")
        .update({ completion_report_id: null })
        .in("id", maintenanceRequestIds);

      if (unlinkCompletionError && !shouldIgnoreDeleteError(unlinkCompletionError)) {
        throw new Error(`[maintenance_requests] ${unlinkCompletionError.message}`);
      }

      await deleteByIds("maintenance_request_messages", "maintenance_request_id", maintenanceRequestIds);
      await deleteByIds("technician_job_updates", "maintenance_request_id", maintenanceRequestIds);
    }

    await deleteByIds("vacancy_notice_messages", "vacancy_notice_id", vacancyNoticeIds);

    const unitScopedTables = ["tenant_leases", "unit_images", "tenant_properties"];
    for (const table of unitScopedTables) {
      await deleteByIds(table, "unit_id", unitIds);
    }

    const propertyScopedTables = [
      "property_manager_assignments",
      "technician_property_assignments",
      "proprietor_properties",
      "proprietor_reports",
      "property_utilities",
      "lease_applications",
      "tenant_approvals",
      "tenant_verifications",
      "employee_leave_requests",
      "security_deposits",
      "rent_payments",
      "utility_bills",
      "utility_readings",
      "bills_and_utilities",
      "deposit_refunds",
      "receipts",
      "invoices",
      "accounting_transactions",
      "payments",
      "maintenance_completion_reports",
      "maintenance_requests",
      "vacancy_notices",
      "tenants",
      "leases",
      "tenant_properties",
      "caretakers",
      "units",
      "property_unit_types",
    ];

    for (const table of propertyScopedTables) {
      await deleteByProperty(table);
    }

    const { error } = await db.from("properties").delete().eq("id", id);
    if (error) {
      throw new Error(`[properties] ${error.message}`);
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || "Failed to delete property" });
    return;
  }

  res.json({ success: true });
});

app.post("/api/users", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const input = req.body || {};
  const email = String(input.email || "").trim();
  const password = String(input.password || "");
  const fullName = String(input.full_name || "").trim();
  const role = String(input.role || "").trim();

  if (!email || !password || !fullName || !role) {
    res.status(400).json({ success: false, error: "email, password, full_name, and role are required" });
    return;
  }

  let publicClient;
  try {
    publicClient = createSupabaseClient();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  const { data: authData, error: authError } = await publicClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (authError) {
    sendSupabaseError(res, authError, "Failed to create auth user");
    return;
  }

  if (!authData.user) {
    res.status(500).json({ success: false, error: "User creation failed" });
    return;
  }

  const userId = authData.user.id;
  const firstName = fullName.split(" ")[0] || "";
  const lastName = fullName.split(" ").slice(1).join(" ") || "";

  const { error: profileError } = await guard.userClient.from("profiles").insert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    phone: input.phone || null,
    role,
    user_type: role,
    status: "active",
    is_active: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    const serviceRoleClient = createServiceRoleClient();
    if (serviceRoleClient) {
      try {
        await serviceRoleClient.auth.admin.deleteUser(userId);
      } catch (_cleanupError) {
        // Best effort cleanup only.
      }
    }

    sendSupabaseError(res, profileError, "Failed to create profile");
    return;
  }

  res.status(201).json({ success: true, userId });
});

app.get("/api/users", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const { data: profiles, error } = await guard.userClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    sendSupabaseError(res, error, "Failed to fetch users");
    return;
  }

  const rows = profiles || [];
  const isTenant = (profile) => profile?.role === "tenant" || profile?.user_type === "tenant";

  res.json({
    tenants: rows.filter(isTenant),
    managers: rows.filter((profile) => !isTenant(profile)),
  });
});

app.patch("/api/users/:userId", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const { userId } = req.params;
  const payload = {
    ...pickProfileUpdates(req.body || {}),
    updated_at: new Date().toISOString(),
  };

  if (Object.keys(payload).length === 1) {
    res.status(400).json({ success: false, error: "No valid profile fields provided" });
    return;
  }

  const { error } = await guard.userClient
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    sendSupabaseError(res, error, "Failed to update user");
    return;
  }

  res.json({ success: true });
});

app.delete("/api/users/:userId", async (req, res) => {
  const guard = await requireSuperAdmin(req, res);
  if (!guard) return;

  const { userId } = req.params;
  const serviceRoleClient = createServiceRoleClient();

  // Remove role-specific records that depend on profiles.id before deleting the profile.
  const dependentProfileTables = ["technicians", "proprietors", "caretakers", "accountants"];

  for (const table of dependentProfileTables) {
    const { error } = await guard.userClient.from(table).delete().eq("user_id", userId);
    if (error && error.code !== "42P01" && error.code !== "42703") {
      sendSupabaseError(res, error, `Failed to clean up ${table} record`);
      return;
    }
  }

  const { error } = await guard.userClient.from("profiles").delete().eq("id", userId);

  if (error && error.code === "23503") {
    const { error: softDeleteError } = await guard.userClient
      .from("profiles")
      .update({
        status: "inactive",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (softDeleteError) {
      sendSupabaseError(res, softDeleteError, "Failed to deactivate user");
      return;
    }

    res.json({ success: true, mode: "soft-delete" });
    return;
  }

  if (error) {
    sendSupabaseError(res, error, "Failed to delete user");
    return;
  }

  if (serviceRoleClient) {
    try {
      await serviceRoleClient.auth.admin.deleteUser(userId);
    } catch (_authDeleteError) {
      // Keep API success since profile row is already removed.
    }
  }

  res.json({ success: true });
});

const attachSupabaseHeaders = (proxyReq, req) => {
  if (!req.headers.apikey && SUPABASE_ANON_KEY) {
    proxyReq.setHeader("apikey", SUPABASE_ANON_KEY);
  }

  // Preserve bearer token so Supabase RLS continues working exactly as before.
  if (req.headers.authorization) {
    proxyReq.setHeader("authorization", req.headers.authorization);
  }
};

const createSupabaseHttpProxy = () =>
  createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    proxyTimeout: 30000,
    timeout: 30000,
    ws: false,
    logLevel: "warn",
    on: {
      proxyReq: attachSupabaseHeaders,
      error(err, req, res) {
        if (res.headersSent) return;
        res.status(502).json({
          error: "Upstream Supabase request failed",
          path: req.originalUrl,
          message: err.message,
        });
      },
    },
  });

app.use("/auth/v1", createSupabaseHttpProxy());
app.use("/rest/v1", createSupabaseHttpProxy());
app.use("/storage/v1", createSupabaseHttpProxy());
app.use("/functions/v1", createSupabaseHttpProxy());

const realtimeTarget = SUPABASE_URL.replace(/^http/i, "ws");
const realtimeProxy = createProxyMiddleware({
  target: realtimeTarget,
  changeOrigin: true,
  secure: true,
  xfwd: true,
  ws: true,
  logLevel: "warn",
  on: {
    proxyReq: attachSupabaseHeaders,
    proxyReqWs(proxyReq, req) {
      attachSupabaseHeaders(proxyReq, req);
    },
    error(err, req, res) {
      if (res && !res.headersSent) {
        res.status(502).json({
          error: "Upstream Supabase realtime request failed",
          path: req.originalUrl,
          message: err.message,
        });
      }
    },
  },
});

app.use("/realtime/v1", realtimeProxy);
server.on("upgrade", realtimeProxy.upgrade);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(Number(PORT), () => {
  console.log(`[backend] listening on port ${PORT}`);
  console.log(`[backend] proxying Supabase via ${SUPABASE_URL}`);
  console.log(`[backend] allowed origins: ${allowedOrigins.join(", ")}`);
});
