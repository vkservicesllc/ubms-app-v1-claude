export const capitalizeFirst = (str, lc = false) => {
  if (lc) str = str.toLowerCase();

  return str.trim().charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeEach = (str, lc = false) => {
  if (lc) str = str.toLowerCase();

  return str.replace(/(\b[a-z](?!\s))/g, (x) => x.toUpperCase()).replace(/'s\b/gi, "'s");
};

export const capitalizeAfterPunctuation = (txt) => {
  txt = capitalizeFirst(txt);

  return txt.replace(/([.!?]\s*)(\w)/g, (match, p1, p2) => p1 + p2.toUpperCase());
};
