import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require(process.env.FOODLENS_SHARP_MODULE ?? 'sharp');
// Packaging + nutrition label + scan beam, matched to FoodLens's existing palette.
const art=`<g fill="none" stroke="#253127" stroke-linecap="round" stroke-linejoin="round">
<path d="M266 360v-56q0-38 38-38h56M664 266h56q38 0 38 38v56M758 664v56q0 38-38 38h-56M360 758h-56q-38 0-38-38v-56" stroke-width="30"/>
<g transform="rotate(-7 512 512)">
<path d="M378 315h268l-13 81 26 290q3 29-27 29H392q-30 0-27-29l26-290z" fill="#334737" stroke-width="16"/>
<path d="M389 345h245M390 367h242" stroke="#72915B" stroke-width="10"/>
<path d="M391 396h242l5 57H386z" fill="#415C42" stroke="none"/>
<path d="M482 430q5-59 76-54-2 60-68 62" fill="#D6F87C" stroke="#D6F87C" stroke-width="8"/>
<path d="M485 447l43-45" stroke="#E8F9BD" stroke-width="7"/>
<rect x="397" y="474" width="230" height="184" rx="24" fill="#F7F8EF" stroke="none"/>
<path d="M423 505h176" stroke-width="10"/>
<path d="M423 540h62m50 0h64M423 572h62m50 0h64M423 604h62m50 0h64" stroke="#93A487" stroke-width="9"/>
<path d="M401 684h224" stroke="#72915B" stroke-width="10"/>
</g>
<path d="M287 552h450" stroke="#D6F87C" stroke-width="29"/>
<path d="M287 552h450" stroke="#7DAB42" stroke-width="9"/>
<path d="M746 204v30m-15-15h30" stroke-width="10"/>
</g>`;
const svg=(background,foreground=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background ? '<rect width="1024" height="1024" fill="#D6F87C"/><circle cx="512" cy="512" r="384" fill="#E3FAA7"/>' : ''}<g ${foreground ? 'transform="translate(51.2 51.2) scale(.9)"' : ''}>${art}</g></svg>`;
await writeFile('assets/brand-mark.svg',svg(true));
await sharp(Buffer.from(svg(true))).png().toFile('assets/icon.png');
await sharp(Buffer.from(svg(false,true))).png().toFile('assets/android-icon-foreground.png');
await sharp(Buffer.from(svg(true))).resize(64,64).png().toFile('assets/favicon.png');
