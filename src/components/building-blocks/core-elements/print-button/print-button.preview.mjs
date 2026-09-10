import { preview, box, bar, ink, onInk, poly } from "../../../../../scripts/previews/kit.mjs";

// A filled button carrying a printer glyph — the glyph is what separates this
// from the plain Button tile. Exempt from the width bands for the same reason
// Button is: one control stretched to a band reads as distorted.
export default preview({
  width: 300,
  exempt: true,
  draw: [
    box(490, 362, 300, 76, { fill: ink }),
    // Printer: paper feed above, body, and the sheet coming out below.
    box(536, 384, 20, 10, { r: 2, fill: onInk }),
    box(528, 394, 36, 24, { r: 4, fill: onInk }),
    poly(
      [
        [536, 418],
        [556, 418],
        [556, 430],
        [536, 430],
      ],
      { fill: onInk, round: 2 }
    ),
    bar(582, 394, 150, "body", { fill: onInk }),
  ],
});
