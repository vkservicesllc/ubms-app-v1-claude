/* jQuery && IMask required */

export const dateMask = (selector, options = {}) => {
  let { pattern, lazy, overwrite, placeholder } = options;
  const { onAccept, onComplete } = options;

  const defPat = 'YYYY-MM-DD',
    usPat = 'MM/DD/YYYY',
    intPat = 'DD.MM.YYYY';
  if (typeof pattern !== 'string' || !['us', 'int', usPat, intPat].includes(pattern))
    pattern = defPat;
  if (pattern === 'us') pattern = usPat;
  if (pattern === 'int') pattern = intPat;

  if (typeof lazy !== 'boolean') lazy = true;
  if (typeof overwrite !== 'boolean') overwrite = true;
  if (typeof placeholder !== 'boolean') placeholder = true;

  const now = { date: new Date() };
  now.year = now.date.getFullYear();
  now.month = now.date.getMonth();
  now.day = now.date.getDate();

  const from = now.year - 80;
  const to = now.year + 20;

  const maskOpts = {
    mask: pattern,
    lazy,
    overwrite,
    blocks: {
      YYYY: { mask: IMask.MaskedRange, from, to, maxLength: 4 },
      MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
      DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
    },
  };

  $(selector).each(function (i) {
    const $el = $(this);
    const mask = IMask(this, maskOpts);

    if (onAccept)
      mask.on('accept', function (event) {
        onAccept(mask, $el, event);
      });

    mask.on('complete', function (event) {
      if (onComplete) onComplete(mask, $el, event);
      $el.blur();
    });

    if (placeholder) $el.attr('placeholder', pattern);
  });
};

export const idMask = (selector, pattern, options = {}) => {
  if (typeof pattern !== 'string') return;
  if (pattern === 'ssn') pattern = '000-00-0000';
  if (pattern === 'ein') pattern = '00-0000000';

  let { lazy, placeholderChar, placeholder } = options;
  const { onAccept, onComplete } = options;

  if (typeof lazy !== 'boolean') lazy = true;
  if (typeof placeholder !== 'boolean') placeholder = true;
  if (typeof placeholderChar !== 'string' || placeholderChar.length !== 1) placeholderChar = '#';

  const maskOpts = {
    mask: pattern,
    lazy,
    placeholderChar,
  };

  $(selector).each(function (i) {
    const $el = $(this);
    const mask = IMask(this, maskOpts);

    if (onAccept)
      mask.on('accept', function (event) {
        onAccept(mask, $el, event);
      });

    mask.on('complete', function (event) {
      if (onComplete) onComplete(mask, $el, event);
      $el.blur();
    });

    if (placeholder) $el.attr('placeholder', pattern.replace(/0/g, placeholderChar));
  });
};

export const telMask = (selector, options = {}) => {
  let { pattern, region, lazy, placeholderChar, placeholder } = options;
  const { onAccept, onComplete } = options;

  const defPat = '(000) 000-0000';
  if (typeof pattern !== 'string') pattern = defPat;

  if (region === 'us') pattern = `+{1} ${pattern}`;

  if (typeof lazy !== 'boolean') lazy = true;
  if (typeof placeholder !== 'boolean') placeholder = true;
  if (typeof placeholderChar !== 'string' || placeholderChar.length !== 1) placeholderChar = '#';

  const maskOpts = {
    mask: pattern,
    lazy,
    placeholderChar,
  };

  $(selector).each(function (i) {
    const $el = $(this);
    const mask = IMask(this, maskOpts);

    if (onAccept)
      mask.on('accept', function (event) {
        onAccept(mask, $el, event);
      });

    mask.on('complete', function (event) {
      if (onComplete) onComplete(mask, $el, event);
      $el.blur();
    });

    if (placeholder)
      $el.attr('placeholder', pattern.replace(/0/g, placeholderChar).replace(/[\{\}]/g, ''));
  });
};
