import length from './length.mjs';

const { username, password, token } = length.user;

export default {
  match: {
    username: new RegExp(`^[A-Za-z0-9-]{${username.min},${username.max}}$`),
    password: new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&-])[A-Za-z\\d@$!%*?&-]{${password.min},${password.max}}$`,
    ),
    token: new RegExp(`^\\d{${token.min},${token.max}}$`),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^([\w.-]+\.[a-z]{2,6})(\/[^\s]*)?$/i,
    suffix: /(\bjr\b|\bsr\b)/i,
    coType: /(\binc\b|\bllc\b)/i,
    addr2: /\b(suite|ste|unit|apt)\b\.?.*?$/i,
  },

  change: {
    username: [
      [/[^a-z0-9-]+/gi, ''],
      [/\-+/g, '-'],
    ],
    email: [
      [/[^a-z0-9\@\.\-\_]/, ''],
      [/\.+/g, '.'],
      [/-+/g, '-'],
      [/\_+/g, '_'],
      [/@+/g, '@'],
      [/\s+/g, ''],
    ],
    url: [
      [/^https?:\/\//, ''],
      [/\s+/g, ''],
    ],
    name: [
      [/[^\sA-Za-z'-]/g, ''],
      [/\s?'(-|'|\s)?/g, "'"],
      [/\s?-(-|'|\s)?/g, '-'],
    ],
    number: [[/\D/g, '']],
    suffix: [
      [/\bjr\b/gi, 'Jr'],
      [/\bsr\b/gi, 'Sr'],
    ],
    busName: [
      [/[^\sA-Za-z0-9@#\$&\-']/g, ''],
      [/@+/g, '@'],
      [/#+/g, '#'],
      [/\$+/g, '$'],
      [/&+/g, '&'],
      [/\-+/g, '-'],
      [/'+/g, "'"],
      [/\'s\b/gi, "'s"],
    ],
    coType: [
      [/\binc\b/gi, 'Inc'],
      [/\bllc\b/gi, 'LLC'],
    ],
    addr1: [
      [/[^\sA-Za-z0-9\-\#@%&\/]/g, ' '],
      [/-+/g, '-'],
      [/\#+/g, '#'],
      [/@+/g, '@'],
      [/%+/g, '%'],
      [/&+/g, '&'],
      [/\/+/g, '/'],
      [/\b(Post Office|Postal Office|p\.?\s*o\.?)\b/gi, 'PO'],
      [/\bn\b/i, 'N'],
      [/\bs\b/i, 'S'],
      [/\be\b/i, 'E'],
      [/\bw\b/i, 'W'],
      [/\bne\b/i, 'NE'],
      [/\bnw\b/i, 'NW'],
      [/\bse\b/i, 'SE'],
      [/\bsw\b/i, 'SW'],
      [/\bpo\b/i, 'PO'],
      [/\bpmb\b/i, 'PMB'],
    ],
    addr2: [
      [/\bSUITE\b/g, 'Suite'],
      [/\bSTE\b/g, 'Suite'],
      [/\bUNIT\b/g, 'Unit'],
      [/\bAPT\b/g, 'Apt'],
    ],
    poBox: [],
    zip: [[/\D/g, '']],
    city: [[/[^\sA-Za-z]/g, '']],
    driverLicense: [
      [/[^A-Za-z0-9-]/g, ''],
      [/-+/g, '-'],
    ],
    dlClass: [
      [/[^A-Za-z0-9-]/g, ''],
      [/-+/g, '-'],
    ],
    teamName: [
      [/[^\sA-Za-z0-9\-&']/g, ''],
      [/\s+/g, ' '],
      [/-+/g, '-'],
      [/&+/g, '&'],
      [/'+/g, "'"],
    ],
    roleName: [
      [/[^\sA-Za-z0-9\-&']/g, ''],
      [/\s+/g, ' '],
      [/-+/g, '-'],
      [/&+/g, '&'],
      [/'+/g, "'"],
    ],
    vhlMake: [
      [/[^\sA-Za-z\-]/g, ''],
      [/\s+/g, ' '],
      [/-+/g, '-'],
    ],
    vhlModel: [
      [/[^\sA-Za-z0-9\-]/g, ''],
      [/\s+/g, ' '],
      [/-+/g, '-'],
    ],
  },

  replace: function (value, target) {
    const pattern = this.change[target];

    pattern.forEach((params) => {
      const [pattern, replacer] = params;

      value = value.replace(pattern, replacer);
    });

    return value;
  },
};
