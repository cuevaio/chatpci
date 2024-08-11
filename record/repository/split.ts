(async () => {
  const chapter = 5;
  const chapterPadded = chapter.toString().padStart(2, "0");

  const input = Bun.file(`src/db/repository/ercot-${chapterPadded}.txt`);
  const exists = await input.exists();
  console.log(exists);

  const content = (await input.text()).replace(/(\r\n|\n|\r){2,}/g, "\n");

  let idx = 1;
  while (true) {
    const start = content.indexOf(`\n${chapter}.${idx}`);
    const end = content.indexOf(`\n${chapter}.${idx + 1}`);

    if (start < 0) {
      console.log("Couldn't find start ", idx);
      break;
    }

    if (end < 0) {
      break;
    }

    const text = content.slice(start, end);
    const lines = text.split("\n").length;

    if (lines > 15) {
      let introEnd = text.indexOf(`\n${chapter}.${idx}.1`);

      if (introEnd < 0) {
        // It doesn't have sub points
        const destination = `src/db/repository/${chapterPadded}/${idx
          .toString()
          .padStart(2, "0")}.txt`;
        await Bun.write(destination, text.trim());
      } else {
        // it has sub points

        // write the intro or 0 sub point

        const intro = text.slice(0, introEnd);
        const destination = `src/db/repository/${chapterPadded}/${idx
          .toString()
          .padStart(2, "0")}/00.txt`;
        await Bun.write(destination, intro.trim());

        // write the following sub points
        let subIdx = 1;
        while (true) {
          const subStart = text.indexOf(`\n${chapter}.${idx}.${subIdx}`);
          const subEnd = text.indexOf(`\n${chapter}.${idx}.${subIdx + 1}`);

          if (subStart < 0) {
            break;
          }

          if (subEnd < 0) {
            break;
          }

          const subText = text.slice(subStart, subEnd);
          const subDestination = `src/db/repository/${chapterPadded}/${idx
            .toString()
            .padStart(2, "0")}/${subIdx.toString().padStart(2, "0")}.txt`;
          await Bun.write(subDestination, subText.trim());
          subIdx++;
        }
      }
    } else {
      const destination = `src/db/repository/${chapterPadded}/${idx
        .toString()
        .padStart(2, "0")}.txt`;
      await Bun.write(destination, text.trim());
    }

    idx++;
  }
})();
