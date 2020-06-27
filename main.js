(function() {
    'use strict';
    console.debug('VKTex Load Initiated');
    main();
})();


//классом rendered будем помечать блоки с отредеренными формулами


//находим ближайшего родителя, которого можно прокручивать (колесиком мыши)
function getScrollParent(node) {
    const isElement = node instanceof HTMLElement;
    const overflowY = isElement && window.getComputedStyle(node).overflowY;
    const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

    if (!node) {
        return null;
    } else if (isScrollable && node.scrollHeight >= node.clientHeight) {
        return node;
    }

    return getScrollParent(node.parentNode) || document.body;
}


// Добавляет текст в конец parent.
// Текст представляется как последовательность Text Nodes со вставками <br>
// в местах переноса строки.
function appendTextToDOM(parent, text) {
    let start_ind = 0
    let ind = 0
    while ( (ind = text.indexOf('\n', start_ind)) != -1) {
        parent.appendChild(document.createTextNode(text.slice(start_ind, ind)))
        parent.appendChild(document.createElement('br'))
        start_ind = ind + 1
    }

    if (start_ind < text.length) {
        parent.appendChild(document.createTextNode(text.slice(start_ind)))
    }
}


// Рендерит TeX в тексте. Возвращает готовый ко вставке в дерево
// веб-страницы Document Fragment, или null, если в тексте нет TeX.
function renderText(text) {
    const PATTERN = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g

    if (text.search(PATTERN) == -1) {
        return null
    }

    let examined_until = 0  // Длина уже обработанного префикса text
    let frag = document.createDocumentFragment()

    let replacer = function(match, p1, p2, offset, string) {
        if (offset - examined_until > 0) {
            appendTextToDOM(frag, text.slice(examined_until, offset))
        }
        
        let tmp_frag = document.createDocumentFragment()
        katex.render(p1 ? p1 : p2, tmp_frag, {
            displayMode: match[0] != '$',
            throwOnError: false}
        );
        frag.appendChild(tmp_frag)

        examined_until = offset + match.length
        return ''
    }

    text.replace(PATTERN, replacer);
    if (examined_until < text.length) {
        appendTextToDOM(frag, text.slice(examined_until))
    }

    return frag
}


// Рендерит TeX в конкретном элементе DOM
function renderElem(elem) {
    for (let i = 0; i < elem.childNodes.length; i++) {
        let childNode = elem.childNodes[i];
        let headChildNode = childNode
        let headI = i

        if (childNode.nodeType === 1 && childNode.tagName != 'BR') {
            // Элемент
            renderElem(childNode)
            continue
        }

        // childNode -- это текст (Text Node) или <br>, которые мы также считаем текстом
        // 1. Найдем последовательность текста

        let text = ''
        let seq_len = 0  // Кол-во nodes в последовательности

        for (; i < elem.childNodes.length; i++, seq_len++) {
            childNode = elem.childNodes[i]

            if (childNode.nodeType === 3) {
                text += childNode.textContent
            } else if (childNode.nodeType === 1 && childNode.tagName == 'BR') {
                text += '\n'
            } else {
                // Не текстовый элемент. Стоп машина.
                i--
                break
            }
        }

        // 2. Рендерим текст
        frag = renderText(text)
        if (frag === null) {
            // В тексте нечего рендерить, пропускаем его
            continue
        }

        // 3. Заменяем текст на отрисованный TeX
        i = headI + frag.childNodes.length
        elem.insertBefore(frag, headChildNode)

        for (; seq_len > 0; seq_len--) {
            elem.childNodes[i].remove()
        }

    }
}


//ищем все блоки, где может быть написана формула
function render_all(){
    let queue = document.body.querySelectorAll(".im-mess--text:not(.rendered),\
       .reply_content:not(.rendered),\
       .wall_post_text:not(.rendered),\
       .article_view:not(.rendered)");

    //сохраним размеры элементов перед рендерингом
    let scroll_storage = []
    for (let elem of queue) {
        scrollable = getScrollParent(elem)
        scroll_borders = scrollable.getBoundingClientRect()
        client_borders = elem.getBoundingClientRect()

        if (scroll_borders.bottom >= client_borders.bottom) {
            scroll_storage.push({
                elem: elem,
                scrollable: scrollable,
                prev_height: client_borders.height
            })
        }
    }

    for (let elem of queue) {
        elem.classList.add('rendered')
        renderElem(elem)
    }

    //если рендер увеличил высоту элементов, то мы хотим прокрутить ту высоту,
    //которую мы добавили
    for (let st of scroll_storage) {
        let sb = st.elem.getBoundingClientRect().height - st.prev_height
        if (sb > 0) {
            st.scrollable.scrollBy(0, sb)
        }
    }
}


function loadKatexCss() {
    //подгружаем katex css для Chrome
    if (window.chrome) {
        let new_link = document.createElement("link");
        new_link.setAttribute('rel', "stylesheet");
        new_link.setAttribute('href', "https://cdn.jsdelivr.net/npm/katex@0.10.0-beta/dist/katex.min.css");
        new_link.setAttribute('integrity', "sha384-9tPv11A+glH/on/wEu99NVwDPwkMQESOocs/ZGXPoIiLE8MU/qkqUcZ3zzL+6DuH");
        new_link.setAttribute('crossorigin', "anonymous");
        document.head.appendChild(new_link);
    }
}

function main() {
    loadKatexCss();
    setInterval(render_all, 300);
}
