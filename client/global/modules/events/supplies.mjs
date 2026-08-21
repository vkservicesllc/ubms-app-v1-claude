export const english = (str) => {
  if (!str) return '';

  let chars = [];
  for (let i = 0; i < str.length; i++) {
    let code = str[i].charCodeAt();
    if (code < 32 || code > 127) continue;
    chars.push(String.fromCharCode(code));
  }

  return chars.join('');
};

export const slim = (str) => {
  if (!str) return '';

  return str
    .replace(/\s(?=[,\.?!:;\)])/g, '') // remove spaces before punctuation characters
    .replace(/,(?=[a-z\d,])/gi, ', ')
    .replace(/\.(?=[a-z\d])/gi, '. ')
    .replace(/\?(?=[a-z\d])/gi, '? ')
    .replace(/!(?=[a-z\d])/gi, '! ')
    .replace(/:(?=[a-z\d:])/gi, ': ')
    .replace(/;(?=[a-z\d;])/gi, '; ')
    .replace(/\)(?=[a-z\d])/gi, ') ')
    .replace(/\s?\(\s?/gi, ' (')
    .replace(/\s+/g, ' ');
};

export const word = (str) => {
  if (!str) return '';

  const words = str.split(' ');
  const patt = /[^A-Za-z\d\s\'\"\&]/g;

  for (let i = 0; i < words.length; i++) {
    let j = 0,
      word = words[i];
    while (j < word.length) {
      if (patt.test(word[word.length - 1])) word = word.slice(0, -1);
      if (patt.test(word[0])) word = word.slice(1);
      ++j;
    }
    words[i] = word;
  }

  return words.join(' ').trim();
};

export const strip = (str, useSlim) => {
  if (!str) return '';
  if (useSlim) str = slim(str);
  return str.trim().replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
};
