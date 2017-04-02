var words = [];
function find(dom) {
    var type = dom.nodeType;
    if (type === 3) {
        var content = dom.nodeValue;
        const fragment = extractWords(content);
        if (fragment !== void 0) {
            dom.parentNode.replaceChild(fragment, dom);
        }
        // console.log(content);
        return;
    } else if (type === 1) {
        var localName = dom.localName;
        if (localName === 'script' || localName === 'style' || dom.className === 'translate-word') return;
        var subdom = dom.firstChild;
        while (subdom !== null) {
            find(subdom);
            subdom = subdom.nextSibling;
        }
    }
}

function extractWords(content) {
    var wordStart = 0;
    var words = void 0;
    var replaceWords = void 0;
    for (var i = 0; i < content.length; i++) {
        var code = content.charCodeAt(i);
        // 48-57, 65-90, 97-122
        if (/*(48 <= code && code <= 57) || */(65 <= code && code <= 90) || (97 <= code && code <= 122)) {

        } else {
            if (i - wordStart > 3) {
                replaceWords = findWord(replaceWords, content, wordStart, i);
            }
            wordStart = i + 1;
        }
    }
    if (i - wordStart > 3) {
        replaceWords = findWord(replaceWords, content, wordStart, i);
    }
    if (replaceWords !== void 0) {
        return createFragment(replaceWords, content);
    }
}

const spanClone = document.createElement('span');
spanClone.className = 'translate-word';
spanClone.appendChild(document.createTextNode(''));
function createFragment(replaceWords, content) {
    const fragment = document.createDocumentFragment();
    var prevEnd = 0;
    for (var i = 0; i < replaceWords.length; i += 3) {
        const start = replaceWords[i];
        const originalWord = replaceWords[i + 1];
        const dictWord = replaceWords[i + 2];
        if (start > 0) {
            fragment.appendChild(document.createTextNode(content.substring(prevEnd, start)));
        }
        const span = spanClone.cloneNode(true);
        span.setAttribute('data-translation', dictWord.t[1]);
        span.firstChild.textContent = originalWord;
        fragment.appendChild(span);
        prevEnd = start + originalWord.length;
    }
    if (content.length > prevEnd) {
        fragment.appendChild(document.createTextNode(content.substring(prevEnd, content.length)));
    }
    return fragment;
}

function findWord(replaceWords, content, start, end) {
    const originalWord = content.substring(start, end);
    const normWord = originalWord.toLowerCase();
    const dictWord = DICT[normWord];
    if (dictWord !== void 0) {
        if (dictWord.r > 3500) {
            if (replaceWords === void 0) replaceWords = [];
            replaceWords.push(start, originalWord, dictWord);
        }
    }
    return replaceWords;
}

const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
        const mut = mutations[i];
        for (let j = 0; j < mut.addedNodes.length; j++) {
            const node = mut.addedNodes[j];
            find(node);
        }
    }
});

observer.observe(document.body, {
    attributes: false,
    childList: true,
    characterData: false
});

console.time('tree');
if (document.body !== null) {
    find(document.body);
}
console.timeEnd('tree');