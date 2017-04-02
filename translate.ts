import {keys} from './keys';
import {readFileSync, writeFileSync} from 'fs';
import * as request from 'request';

function requestWord(word: string) {
    return new Promise<string>((resolve, reject) => {
        try {
            return resolve(readFileSync(`cache/words/${word}.json`, 'utf-8'));
        } catch (e) {
            request(`https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${keys.key}&lang=en-ru&text=${word}`, (err, response, body) => {
                if (err) return reject(err);
                writeFileSync(`cache/words/${word}.json`, body, 'utf-8');
                return resolve(body);
            });
        }
    });
}

// const words = readFileSync(__dirname + '/google-10000-english.txt', 'utf-8').trim().split(/\s+/);
let words = readFileSync(__dirname + '/20k.txt', 'utf-8').trim().split(/\s+/);
// let words = readFileSync(__dirname + '/google-books-common-words.txt', 'utf-8').trim().split(/\n/).slice(0, 20000).map(w => w.split('\t')[0].toLowerCase());
// words = words.concat(words2);

async function translateWords(words: string[]) {
    for (let i = 0; i < words.length; i += 10) {
        const promises = [];
        for (let j = 0; j < 10; j++) {
            const word = words[i + j];
            console.log((i + j) + ': ' + word);
            promises.push(requestWord(word));
        }
        await Promise.all(promises);
    }
}

enum Part {
    pronoun = 1,
    preposition,
    conjunction,
    adverb,
    particle,
    invariant,
    adjective,
    predicative,
    verb,
    noun,
    participle,
    numeral,
    parenthetic,
    interjection,
    'adverbial participle'
}
function findAllWords(words: string[]) {
    let count = 0;
    const types:any = {};
    const map:any = Object.create(null);
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const json = JSON.parse(readFileSync(`cache/words/${word}.json`, 'utf-8'));
        if (!json.def) {
            throw new Error('Not found word #' + i);
        }
        if (json.def.length === 0) {
            // console.log(`Empty word: ${word}`);
            count++;
            continue;
        }
        for (let j = 0; j < json.def.length; j++) {
            const def = json.def[j];
            types[def.pos] = 1;
            let item:any = map[def.text];
            if (!item) {
                item = {
                    r: 0,
                    t: [],
                };
                map[def.text] = item;
            }
            if (word !== def.text.toLowerCase()) {
                if (!item.variations) {
                    item.v = {};
                }
                item.v[word] = 1;
            }
            item.r = i + 1;
            item.t.push(Part[def.pos] || 0, def.tr[0].text);
        }
    }
    console.log(`Not found: ${count}, words detected: ${map.size}`);
    // console.log(types);
    return map;
}

const map = findAllWords(words);
let normalWords = Object.keys(map);
const map2:any = {};
normalWords.forEach(word => {
    const firstLetterUp = word[0].toUpperCase() + word.substr(1);
    const up = word.toUpperCase();
    if (word.length > 3 && !map[firstLetterUp] && !map[up]) {
        map2[word] = map[word];
    }
});

const js = 'window.DICT=' + JSON.stringify(map2)/*.replace(/"([^"]+)":/g, '$1:').replace(",export:", '"export":')*/;
writeFileSync('front/dict.js', js);
writeFileSync('extension/dict.js', js);


// translateWords(words).catch(console.error);
