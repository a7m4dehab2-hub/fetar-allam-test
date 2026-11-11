const path = location.pathname.replace(/\/$/, '');
const courseId = path.split('/').pop();
const testKey = 'screen-off-test:' + path;
const slotId = 'slt_screenoff';
let clockOffset = 0;
let inFlight = false;

export function serverNow() { return Date.now() + clockOffset; }
export function syncClock(serverTime) {
  if (Number.isFinite(serverTime)) clockOffset = serverTime - Date.now();
}

export function readTest() {
  return JSON.parse(localStorage.getItem(testKey) || 'null');
}

export function startTest() {
  localStorage.setItem(testKey, JSON.stringify({ id: crypto.randomUUID(), opensAt: Date.now() + 90000 }));
  sessionStorage.removeItem('timed-booking-' + path + '-' + slotId);
}

function error(code, message, status = 409) {
  return Object.assign(new Error(message), { code, status });
}

function slots(test) {
  return [{ id: slotId, groupName: 'Test request', remaining: test?.result ? 0 : 1, state: 'open' }];
}

export async function api(endpoint, options = {}) {
  const test = readTest();
  if (endpoint === '/api/me') return { user: { id: 'screen-off-demo', emailVerified: true } };
  if (endpoint === '/api/me/bookings') {
    return { bookings: test?.result ? [{ courseId, id: slotId }] : [] };
  }
  if (endpoint === '/api/courses/' + encodeURIComponent(courseId)) {
    if (!test) throw error('TEST_NOT_STARTED', 'Tap Start 90-second test first.', 400);
    return { course: { opensAtUtc: test.opensAt, state: 'open' }, slots: slots(test), serverTime: Date.now() };
  }
  if (endpoint !== '/api/slots/' + slotId + '/reserve' || options.method !== 'POST') {
    throw error('NOT_FOUND', 'Unknown test operation.', 404);
  }
  if (!test || Date.now() < test.opensAt) throw error('SLOT_NOT_OPEN', 'Test countdown is still running.');
  if (test.result) return { slots: slots(test), message: 'Test request already completed.', serverTime: Date.now() };
  if (inFlight) throw error('BUSY', 'A test request is already in progress.', 429);
  inFlight = true;
  const started = Date.now();
  const startVisibility = document.visibilityState;
  try {
    const url = new URL('./probe.json', import.meta.url);
    url.searchParams.set('run', test.id);
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok || !(await response.json()).screenOffProbe) throw new Error('The test file did not respond successfully.');
    if (readTest()?.id !== test.id) throw new Error('Test restarted during the request.');
    test.result = { started, finished: Date.now(), startVisibility, finishVisibility: document.visibilityState };
    localStorage.setItem(testKey, JSON.stringify(test));
    return { slots: slots(test), message: 'Test request completed.', serverTime: Date.now() };
  } catch (failure) {
    if (readTest()?.id === test.id) {
      test.failure = failure.message;
      localStorage.setItem(testKey, JSON.stringify(test));
    }
    throw failure;
  } finally {
    inFlight = false;
  }
}
