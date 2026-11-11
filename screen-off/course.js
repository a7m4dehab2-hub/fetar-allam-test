import { readTest, startTest } from './common.js';

const result = document.querySelector('#result');
document.querySelector('#start').onclick = () => {
  window.__timedBooking?.cancel();
  startTest();
  location.reload();
};

function showResult() {
  const test = readTest();
  let message = 'Ready to start.';
  result.dataset.success = String(Boolean(test?.result));
  if (test?.result) {
    const { started, finished, startVisibility, finishVisibility } = test.result;
    message = 'Request completed successfully.\n' +
      'Sent at ' + new Date(started).toLocaleTimeString() + ' (' + startVisibility + ').\n' +
      'Finished at ' + new Date(finished).toLocaleTimeString() + ' (' + finishVisibility + ').';
  } else if (test?.failure) {
    message = 'Request failed: ' + test.failure;
  } else if (test) {
    const seconds = Math.ceil((test.opensAt - Date.now()) / 1000);
    message = seconds > 0 ? 'Test opens in ' + seconds + ' seconds. Arm Test request in the APK now.' :
      'Waiting for the APK’s request. Unlock the phone to check the result.';
  }
  if (result.textContent !== message) result.textContent = message;
}
showResult();
setInterval(showResult, 250);
document.addEventListener('visibilitychange', showResult);
