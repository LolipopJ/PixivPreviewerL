// Tailwind CSS 600, 700, 800: https://tailwindcss.com/docs/colors
// Store sRGB HEX values so the palette also works on Chrome 107.
const tagColors = {
  red: ["#e7000b", "#c10007", "#9f0712"],
  orange: ["#f54a00", "#ca3500", "#9f2d00"],
  amber: ["#e17100", "#bb4d00", "#973c00"],
  yellow: ["#d08700", "#a65f00", "#894b00"],
  lime: ["#5ea500", "#497d00", "#3c6300"],
  green: ["#00a63e", "#008236", "#016630"],
  emerald: ["#009966", "#007a55", "#006045"],
  teal: ["#009689", "#00786f", "#005f5a"],
  cyan: ["#0092b8", "#007595", "#005f78"],
  sky: ["#0084d1", "#0069a8", "#00598a"],
  blue: ["#155dfc", "#1447e6", "#193cb8"],
  indigo: ["#4f39f6", "#432dd7", "#372aac"],
  violet: ["#7f22fe", "#7008e7", "#5d0ec0"],
  purple: ["#9810fa", "#8200db", "#6e11b0"],
  fuchsia: ["#c800de", "#a800b7", "#8a0194"],
  pink: ["#e60076", "#c6005c", "#a3004c"],
  rose: ["#ec003f", "#c70036", "#a50036"],
  slate: ["#45556c", "#314158", "#1d293d"],
  gray: ["#4a5565", "#364153", "#1e2939"],
  zinc: ["#52525c", "#3f3f47", "#27272a"],
  neutral: ["#525252", "#404040", "#262626"],
  stone: ["#57534d", "#44403b", "#292524"],
  mauve: ["#594c5b", "#463947", "#2a212c"],
  olive: ["#5b5b4b", "#474739", "#2b2b22"],
  mist: ["#4b585b", "#394447", "#22292b"],
  taupe: ["#5b4f4b", "#473c39", "#2b2422"],
};

const backgrounds = Object.values(tagColors).flat();

export const getLocalTagColor = (tag: string) => {
  const characters = Array.from(tag);
  const first = characters[0]?.codePointAt(0) ?? 0;
  const last = characters.at(-1)?.codePointAt(0) ?? 0;
  return backgrounds[(first * 31 + last) % backgrounds.length];
};
