const phrases = [
  "maps keep folding",
  "monkeys knighting frogs",
  "managing key files",
  "missing keyboard functionality",
  "mostly knowing facts",
  "mostly keeping focused",
  "maybe keep fixing",
  "managed karma farming",
  "maybe kleptomaniacs fidget",
  "minty keeps fresh",
  "midnight koi floating",
  "macroscopic kelp forests",
  "my kernel froze",
  "more kind feelings",
];

const randomIndex = Math.floor(Math.random() * phrases.length);
const quoteElement = document.getElementById("random-phrase");

if (quoteElement) {
  quoteElement.textContent = phrases[randomIndex];
}
