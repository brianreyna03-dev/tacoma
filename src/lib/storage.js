const STORAGE_KEY = "shift-board:v1";
const BOARD_ID = "main";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function isSharedStorageEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function loadLocalData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function loadData() {
  if (!isSharedStorageEnabled()) return loadLocalData();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/shift_board?id=eq.${BOARD_ID}&select=data`,
      { headers: supabaseHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Supabase load failed: ${response.status}`);
    }

    const rows = await response.json();
    return rows?.[0]?.data ?? null;
  } catch (error) {
    console.error(error);
    return loadLocalData();
  }
}

export async function saveData(data) {
  if (!isSharedStorageEnabled()) return saveLocalData(data);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/shift_board?on_conflict=id`,
      {
        method: "POST",
        headers: supabaseHeaders({
          Prefer: "resolution=merge-duplicates,return=minimal",
        }),
        body: JSON.stringify({
          id: BOARD_ID,
          data,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase save failed: ${response.status}`);
    }

    saveLocalData(data);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
