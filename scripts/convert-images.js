import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "./public/assets";

fs.readdirSync(dir).forEach(async (file) => {
    if (!file.match(/\.(jpg|jpeg|png)$/)) return;

    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(/\.(jpg|jpeg|png)$/, ".webp"));

    await sharp(input)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(output);

    console.log(`Converted: ${file}`);
});
