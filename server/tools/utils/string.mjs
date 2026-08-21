export const generateRandomString = (len, patt) => {
  if (!len) len = 16;

  let chars = {
    upperCase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowerCase: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
  };
  let str = '';

  switch (patt) {
    case 'u':
      chars = chars.upperCase;
      break;
    case 'l':
      chars = chars.lowerCase;
      break;
    case 'd':
      chars = chars.digits;
      break;
    case 'ul':
    case 'lu':
      chars = chars.upperCase + chars.lowerCase;
      break;
    case 'ud':
    case 'du':
      chars = chars.upperCase + chars.digits;
      break;
    case 'ld':
    case 'dl':
      chars = chars.lowerCase + chars.digits;
      break;
    default:
      chars = chars.upperCase + chars.lowerCase + chars.digits;
  }

  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    str += chars[idx];
  }

  return str;
};

export const maskEmail = (email) => {
  if (!email) return;

  const [local, domain] = email.split('@');

  if (local.length <= 2) return local[0] + '*@' + domain;

  const first = local[0];
  const last = local[local.length - 1];
  const masked = '*'.repeat(local.length - 2);

  return `${first}${masked}${last}@${domain}`;
};
