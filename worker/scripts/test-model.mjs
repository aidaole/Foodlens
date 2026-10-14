import {getPlatformProxy} from 'wrangler';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {modelInput} from '../src/model-input.ts';
const platform=await getPlatformProxy({configPath:fileURLToPath(new URL('../wrangler.jsonc',import.meta.url)),persist:false});
try {
 const image='data:image/jpeg;base64,'+(await readFile(new URL('../../tests/fixtures/label-zh.jpg',import.meta.url))).toString('base64');
 const result=await platform.env.AI.run('@cf/google/gemma-4-26b-a4b-it',modelInput(image));
 await writeFile(new URL('../../.tools/gemma-raw-result.json',import.meta.url),JSON.stringify(result,null,2));
 console.log('Captured model result keys',Object.keys(result));
} finally {await platform.dispose();}
