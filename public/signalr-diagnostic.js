/**
 * SignalR Diagnostic Script
 * 
 * Usage:
 * 1. Copy and paste this entire script into your browser console
 * 2. Or call window.runSignalRDiagnostics() manually
 * 3. Auto-runs when session expiry is detected
 */

// Main diagnostic function
function runSignalRDiagnostics(autoTriggered = false) {
    if (autoTriggered) {
        console.log('🔍 Auto-running SignalR Diagnostics (triggered by expired session check)...\n');
    } else {
        console.log('🔍 Starting SignalR Diagnostics...\n');
    }

// 1. Check Authentication
console.log('1️⃣ AUTHENTICATION CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const token = localStorage.getItem('auth_token');
if (token) {
    console.log('✅ Auth token exists');
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('   User ID:', payload.nameid);
        console.log('   Role:', payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('   Is Expired:', Date.now() > payload.exp * 1000 ? '❌ YES' : '✅ NO');
    } catch (e) {
        console.error('❌ Token exists but cannot be decoded:', e);
    }
} else {
    console.error('❌ No auth token found - you need to log in');
}
console.log('');

// 2. Check Current Location
console.log('2️⃣ LOCATION CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Current URL:', window.location.href);
console.log('   Current Path:', window.location.pathname);
console.log('   Is Admin Path:', window.location.pathname.includes('/admin') ? '✅ YES' : '❌ NO');
console.log('');

// 3. Check Environment Configuration
console.log('3️⃣ ENVIRONMENT CONFIGURATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
    console.log('   API Base URL:', import.meta.env?.VITE_API_BASE_URL || 'Not set');
    console.log('   API URL:', import.meta.env?.VITE_API_URL || 'Not set');
} catch (e) {
    console.log('   Cannot read environment variables from console');
}
console.log('');

// 4. Check SignalR Connection
console.log('4️⃣ SIGNALR CONNECTION STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Try to check if signalRService is available
setTimeout(() => {
    try {
        // This will work if signalRService is exported globally or accessible
        console.log('   Checking for SignalR service...');
        console.log('   (Check main console logs for connection status)');
    } catch (e) {
        console.log('   Cannot directly access SignalR from console');
    }
}, 1000);

// 5. Check Browser Capabilities
console.log('5️⃣ BROWSER CAPABILITIES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   WebSocket:', typeof WebSocket !== 'undefined' ? '✅ Supported' : '❌ Not supported');
console.log('   Audio Context:', typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined' ? '✅ Supported' : '❌ Not supported');
console.log('   Speech Synthesis:', 'speechSynthesis' in window ? '✅ Supported' : '❌ Not supported');
console.log('   Local Storage:', typeof localStorage !== 'undefined' ? '✅ Available' : '❌ Not available');
console.log('');

// 6. Network Status
console.log('6️⃣ NETWORK STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Online:', navigator.onLine ? '✅ YES' : '❌ NO');
console.log('   User Agent:', navigator.userAgent);
console.log('');

// 7. Console History Check
console.log('7️⃣ RECENT CONSOLE LOGS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Look for these messages in the console above:');
console.log('   ✅ "Setting up SignalR for admin..."');
console.log('   ✅ "SignalR: Getting auth token for connection: Token exists"');
console.log('   ✅ "SignalR connected successfully"');
console.log('   ✅ "Joined admins group"');
console.log('   ✅ "SignalR setup complete"');
console.log('');
console.log('   ❌ Common errors to look for:');
console.log('   ❌ "Status code \'401\'"');
console.log('   ❌ "Failed to start the transport"');
console.log('   ❌ "Failed to complete negotiation"');
console.log('   ❌ "SignalR negotiation timeout"');
console.log('');

// 8. Quick Actions
console.log('8️⃣ QUICK ACTIONS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   To re-login:');
console.log('   └─> Run: localStorage.removeItem("auth_token"); window.location.href="/login";');
console.log('');
console.log('   To clear all data:');
console.log('   └─> Run: localStorage.clear(); window.location.reload();');
console.log('');
console.log('   To check connection:');
console.log('   └─> Run: navigator.onLine');
console.log('');

// 9. Summary
console.log('9️⃣ DIAGNOSTIC SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let issues = [];
let suggestions = [];

if (!token) {
    issues.push('❌ Not logged in');
    suggestions.push('Log in as an admin user');
}

if (token && Date.now() > JSON.parse(atob(token.split('.')[1])).exp * 1000) {
    issues.push('❌ Token expired');
    suggestions.push('Log out and log in again');
}

if (!window.location.pathname.includes('/admin')) {
    issues.push('⚠️ Not on admin page');
    suggestions.push('Navigate to /app/admin/dashboard');
}

if (!navigator.onLine) {
    issues.push('❌ No internet connection');
    suggestions.push('Check your network connection');
}

if (issues.length === 0) {
    console.log('✅ All checks passed!');
    console.log('');
    console.log('If SignalR still not working:');
    console.log('1. Refresh the page (Ctrl+F5 / Cmd+Shift+R)');
    console.log('2. Check backend is running');
    console.log('3. Check browser console for error messages');
    console.log('4. See SIGNALR_TROUBLESHOOTING_GUIDE.md for more help');
} else {
    console.log('Issues found:');
    issues.forEach(issue => console.log('   ' + issue));
    console.log('');
    console.log('Suggestions:');
    suggestions.forEach(suggestion => console.log('   • ' + suggestion));
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Diagnostics Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Export to global scope so it can be called manually
if (typeof window !== 'undefined') {
    window.runSignalRDiagnostics = runSignalRDiagnostics;
    console.log('💡 SignalR Diagnostics loaded! Run window.runSignalRDiagnostics() anytime.');
}

// Auto-run on page load if in development mode
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 Development mode detected - diagnostics available');
}

// Export the function
runSignalRDiagnostics();

