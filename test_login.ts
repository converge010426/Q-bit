
async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'admin' })
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
