import { createClient } from "@supabase/supabase-js";
import { normalizar } from "../pixel/font.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sin variables de entorno la app funciona en modo demo: todo queda en este dispositivo.
export const remoto = Boolean(url && clave);
const sb = remoto ? createClient(url, clave) : null;

export const limpiarNombre = (n) => normalizar(n).replace(/\s+/g, " ").trim().slice(0, 14);

// ---------- modo demo (localStorage, con respaldo en memoria) ----------
const LLAVE = "sd:demo";
let memoria = { credenciales: {} };
const leer = () => {
  try { return JSON.parse(localStorage.getItem(LLAVE)) || memoria; } catch { return memoria; }
};
const escribir = (db) => {
  memoria = db;
  try { localStorage.setItem(LLAVE, JSON.stringify(db)); } catch { /* sin almacenamiento: queda en memoria */ }
};
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigoNuevo = () => "SD-" + Array.from({ length: 5 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");

// ---------- API ----------
export async function crear({ nombre, receta }) {
  const limpio = limpiarNombre(nombre);
  if (!limpio) throw new Error("Escribe un nombre.");
  if (remoto) {
    const { data, error } = await sb.from("credenciales").insert({ nombre: limpio, receta }).select("codigo").single();
    if (error) throw new Error(error.message);
    return { codigo: data.codigo };
  }
  const db = leer();
  let codigo = codigoNuevo();
  while (db.credenciales[codigo]) codigo = codigoNuevo();
  db.credenciales[codigo] = { codigo, nombre: limpio, receta, sellos: [], creada: new Date().toISOString() };
  escribir(db);
  return { codigo };
}

export async function obtener(codigo) {
  if (remoto) {
    const { data, error } = await sb
      .from("credenciales")
      .select("codigo,nombre,receta,creada,sellos(mesa)")
      .eq("codigo", codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("No encontramos esa credencial.");
    return { ...data, sellos: (data.sellos || []).map((s) => s.mesa).sort() };
  }
  const c = leer().credenciales[codigo];
  if (!c) throw new Error("No encontramos esa credencial en este dispositivo.");
  return { ...c, sellos: [...c.sellos] };
}

export async function sellar(codigo, mesa, token) {
  if (remoto) {
    const { error } = await sb.rpc("sellar", { p_codigo: codigo, p_mesa: mesa, p_token: token });
    if (error) {
      if (error.message.includes("token_invalido")) throw new Error("Este QR de mesa no es válido. Pide al equipo uno nuevo.");
      if (error.message.includes("credencial_no_existe")) throw new Error("No encontramos tu credencial.");
      throw new Error(error.message);
    }
    return;
  }
  const db = leer();
  const c = db.credenciales[codigo];
  if (!c) throw new Error("No encontramos tu credencial.");
  if (!c.sellos.includes(mesa)) c.sellos = [...c.sellos, mesa].sort();
  escribir(db);
}

// Credencial propia del teléfono (se guarda al abrir el QR de la carta).
export function miCredencial() {
  try { return localStorage.getItem("sd:mia"); } catch { return null; }
}
export function guardarMiCredencial(codigo) {
  try { localStorage.setItem("sd:mia", codigo); } catch { /* sin almacenamiento */ }
}
