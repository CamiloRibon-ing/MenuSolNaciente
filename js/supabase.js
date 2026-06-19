// ============================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza los valores con los de tu proyecto en Supabase
// Settings → API → Project URL y anon public key
// ============================================================
const SUPABASE_URL = 'https://ravqsqcqexvwzuldjefz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdnFzcWNxZXh2d3p1bGRqZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTgyOTIsImV4cCI6MjA5MTU5NDI5Mn0.xsOy7dQF_0C7QyXKs0bjfHFH0iSbFKvnfM0pAEdiDyA';

// Cliente Supabase (usando CDN, se carga en el HTML)
// Se llama "db" para no chocar con el objeto global "supabase" del CDN
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
