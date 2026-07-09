import { supabase } from './supabaseClient.js';

async function testConnection() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('No se pudo conectar a Supabase:', error.message);
    process.exit(1);
  }

  console.log(`Conectado a Supabase correctamente. Usuarios registrados: ${data.users.length}`);
  process.exit(0);
}

testConnection();
