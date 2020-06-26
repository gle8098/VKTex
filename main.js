(function() {
    'use strict';
    console.debug('VKTex Load Initiated');
    main();
})();


//классом rendered будем помечать блоки с отредеренными формулами


//заменяем html символы на unicode
function htmlReplacer(str, offset, s){
    if (str == "&quot;") return '"';
    if (str == "&gt;") return '>';
    if (str == "&lt;") return '<';
	if (str == "<br>") return '';
	if (str == "amp;") return '';
}


//заменяем текст формулы на ее саму
function formulaReplacer(str, group_1, group_2, offset, s) {
    var formula, formulaType = str[0] == '\\', res;
    if (formulaType) formula = group_2;
    else formula = group_1;
    var buffer = document.createElement('span');
    try{   //рендерим формулы и после возвращаем результат
            katex.render(formula.replace(/&quot;|&gt;|&lt;|<br>|amp;/g, htmlReplacer), buffer, {displayMode: formulaType});
            res = buffer.innerHTML;
        } catch(e) {
            buffer.setAttribute('style', 'background: #fc0;');
            buffer.setAttribute('title', e.toString())
            buffer.innerHTML = formula;
            res = buffer.outerHTML;
        }
    return res;
}


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
    elem.classList.add('rendered')
    elem.innerHTML = elem.innerHTML.replace(/\$\$(.*?)\$\$|\\\[(.*?)\\\]/g, formulaReplacer)
}


//ищем все блоки, где может быть написана формула
function render_all(){
    let queue = document.body.querySelectorAll(".im-mess:not(.rendered),\
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
