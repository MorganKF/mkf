const phrases = [
  "maps keep folding",
  "monkeys knighting frogs",
  "managing key files",
  "missing keyboard functionality",
  "microscopic kittens floating",
  "mostly knowing facts",
  "mostly keeping focused",
  "maybe keep fixing",
];

const randomIndex = Math.floor(Math.random() * phrases.length);
const quoteElement = document.getElementById("random-phrase");

if (quoteElement) {
  quoteElement.textContent = phrases[randomIndex];
}
