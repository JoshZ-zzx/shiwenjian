import { readFile, mkdir, writeFile } from 'node:fs/promises';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
let html = await read('index.html');
const css = await read('assets/styles.css');
const files = ['data/annotations.js', 'data/lessons.js', 'data/texts.js', 'src/core.js', 'src/app.js'];
const parts = await Promise.all(files.map(read));
const js = parts.join('\n').replace(/^import .*;\n/gm, '').replace(/^export \{.*\};\n/gm, '').replace(/^export const /gm, 'const ');
html = html.replace('<link rel="stylesheet" href="./assets/styles.css">', () => '<style>' + css + '</style>')
  .replace('<script type="module" src="./src/app.js"></script>', () => '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/shiwenjian.html', import.meta.url), html);
console.log('已生成 dist/shiwenjian.html，可直接打开离线使用。');
