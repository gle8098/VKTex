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


function renderElem(elem) {
    for (let i = 0; i < elem.childNodes.length; i++) {
        let childNode = elem.childNodes[i];
        let headChildNode = childNode
        let headI = i

        if (childNode.nodeType === 1 && childNode.tagName != 'BR') {
            renderElem(childNode)
            continue
        }

        // Ищем последовательность текста
        let text = ''
        let seq_len = 0
        for (; i < elem.childNodes.length; i++, seq_len++) {
            childNode = elem.childNodes[i]

            if (childNode.nodeType === 3) {
                text += childNode.textContent
            } else if (childNode.nodeType === 1 && childNode.tagName == 'BR') {
                text += '\n'
            } else {
                // Не текстовый элемент
                i--
                break
            }
        }

        const PATTERN = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g

        if (text.search(PATTERN) == -1) {
            continue
        }

        let examined_until = 0
        let frag = document.createDocumentFragment()

        let fromTextContent = function(text) {
            let frag = document.createDocumentFragment()

            let start_ind = 0
            let ind = 0
            while ( (ind = text.indexOf('\n', start_ind)) != -1) {
                frag.appendChild(document.createTextNode(text.slice(start_ind, ind)))
                frag.appendChild(document.createElement('br'))
                start_ind = ind + 1
            }

            if (start_ind < text.length) {
                frag.appendChild(document.createTextNode(text.slice(start_ind)))
            }

            return frag
        }

        let replacer = function(match, p1, p2, offset, string) {
            if (offset - examined_until > 0) {
                frag.appendChild(fromTextContent(text.slice(examined_until, offset)))
            }
            
            let tmp_frag = document.createDocumentFragment()
            katex.render(p1 ? p1 : p2, tmp_frag, {displayMode: match[0] != '$', throwOnError: false});
            frag.appendChild(tmp_frag)

            examined_until = offset + match.length
            return ''
        }

        text.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g, replacer);
        if (examined_until < text.length) {
            frag.appendChild(fromTextContent(text.slice(examined_until)))
        }

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
        var new_link = document.createElement("link");
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
