try {
  console.log('require jspdf...');
  const jspdf = require('jspdf');
  console.log('jspdf loaded:', typeof jspdf);
} catch (e) {
  console.error('jspdf require error:', e && e.stack ? e.stack : e);
}

try {
  console.log('require recharts...');
  const recharts = require('recharts');
  console.log('recharts loaded:', typeof recharts);
} catch (e) {
  console.error('recharts require error:', e && e.stack ? e.stack : e);
}
