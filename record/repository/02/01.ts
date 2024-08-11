const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

(async () => {
  const foo = Bun.file("src/db/repository/02/01.txt");
  const exists = await foo.exists();
  console.log(exists);

  const content = await foo.text();

  await Promise.all(
    alphabet.map(async (l, idx) => {
      const destination =
        "src/db/repository/02/01-" + l.toLocaleLowerCase() + ".txt";
      const out = Bun.file(destination);
      const exists = await out.exists();

      if (exists) {
        return;
      }

      const start = content.indexOf(`${l}\n\n`);
      const end = content.indexOf(`${alphabet[idx + 1]}\n\n`);

      const text = content.slice(start, end);

      await Bun.write(destination, text);
    })
  );
  console.log(content);
})();
