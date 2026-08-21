import clipboardEvent from '../application.clipboard.mjs';
import application from './hub.mjs';

(() => {
  if (!application || !Object.keys(application).length) return;
  clipboardEvent(application);
})();
