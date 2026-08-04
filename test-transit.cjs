const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({ credential: applicationDefault() });

async function getCustomToken() {
  const uid = 'test-user-123';
  try {
    const customToken = await getAuth().createCustomToken(uid);
    console.log(customToken);
  } catch (error) {
    console.error('Error creating custom token:', error);
  }
}
getCustomToken();
