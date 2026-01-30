import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'https://sistema-juntas-medicas-vdc.onrender.com';
const JUNTA_ID = '291f5347-e609-44b0-8baa-6de9d1ebbd91';
const DOC_ID = 'f5e72ace-759e-46f5-a6d3-2919598b9465';

async function testDownloadEndpoint() {
  try {
    console.log('🧪 Probando endpoint de descarga...\n');

    // Primero necesitamos un token válido
    console.log('1. Obteniendo token de autenticación...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin2025!',
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Error en login:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido\n');

    // Probar descarga
    console.log('2. Intentando descargar documento...');
    console.log(`   URL: ${API_URL}/api/juntas/${JUNTA_ID}/documentos/${DOC_ID}/download`);
    
    const downloadResponse = await fetch(
      `${API_URL}/api/juntas/${JUNTA_ID}/documentos/${DOC_ID}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log(`   Status: ${downloadResponse.status}`);
    console.log(`   Status Text: ${downloadResponse.statusText}`);
    console.log(`   Content-Type: ${downloadResponse.headers.get('content-type')}`);
    console.log(`   Content-Length: ${downloadResponse.headers.get('content-length')}`);

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error('❌ Error en descarga:', errorText);
      return;
    }

    const blob = await downloadResponse.blob();
    console.log(`   Blob size: ${blob.size} bytes`);
    console.log(`   Blob type: ${blob.type}`);

    console.log('\n✅✅✅ DESCARGA EXITOSA! ✅✅✅');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDownloadEndpoint();
