import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT_DIR = path.join(__dirname, '..', '..', 'extension');
const ICONS_DIR = path.join(EXT_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate valid base64 PNG data for a teal pill icon at different sizes
// We can write valid PNG byte buffers or standard base64 PNGs
const PNG_16_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVR42mNkQAO/8f+DNROD4T+GAeU8i9HNx6GAnZEh31GBwZuRkeEf2QakGIANvH379j8DA8N/ZCMYGBn+E2MDyLqRFf379w+vAciGYg3EBqih8P//fwYGBgZ82mH+ZUBxABsA3B03V8q8RykAAAAASUVORK5CYII=';
const PNG_48_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAf0lEQVR42u3YwQkAIAxE0Z/tZ3V2N8HhDkIeZ3D00IeQgB5yHhACCCCAAAIIIIAAAl4DuM69w3c7z3w8571XmXvv7d2z7w4z55y710wA763n7Z0AArwB163nbwEEEAiYAF1g3v1iHqD33gECCCCAAAIIIIAAAgghwP0b4N4B184QeQ3439QAAAAASUVORK5CYII=';
const PNG_128_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAuUlEQVR42u3csQ2AMAwEwZ/9Zyq7gSg9wS3GSI6kU4y4p9dDAAAAAAAAAAAAAAC82XN9t59vP9v78H3eL/a+m5cBAAAAAAAAAAAAAEwAjg3ABuD9Brj/L8AGQAAAAAAAAAAAAAAAlBqA/X+vAcBvAAAAAAAAAAAAAACYACe7bW8EAAAAAAAAAAAAAAAAAAAA/uIEXnIAAAAAAAAAAAAAAAAAAMAdAANsAAAAAAAAAAAAAACABwF6AgAAAAAAAAAAAAAAAAAAsAP0CgAAAAAAAAAAAAAAAAB8BwM4EQAAAAAAAAAAAAAAAPADJ+8bA2Uj8aAAAAAASUVORK5CYII=';

fs.writeFileSync(path.join(ICONS_DIR, 'icon-16.png'), Buffer.from(PNG_16_BASE64, 'base64'));
fs.writeFileSync(path.join(ICONS_DIR, 'icon-48.png'), Buffer.from(PNG_48_BASE64, 'base64'));
fs.writeFileSync(path.join(ICONS_DIR, 'icon-128.png'), Buffer.from(PNG_128_BASE64, 'base64'));

console.log('✅ Generated 16px, 48px, 128px PNG icons in extension/icons/');
