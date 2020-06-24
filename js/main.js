(function() {
    'use strict';
    console.debug('VKTex Load Initiated');
    main();
})();


//классом rendered будем помечать блоки с отредеренными формулами
function appendCSS(){
    /*$('<style>\
       .rendered {}\
      </style>').appendTo($("html > head"));*/
}


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
            buffer.innerHTML = formula;
            res = buffer.outerHTML;
        }
    return res;
}


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
    // Получаем видимые границы окна прокрутки
    scrollable = getScrollParent(elem)
    scroll_borders = scrollable.getBoundingClientRect()
    client_borders = elem.getBoundingClientRect()
    elem_higher_bottom_border = scroll_borders.bottom >= client_borders.bottom

    elem.classList.add('rendered')
    elem.innerHTML = elem.innerHTML.replace(/\$\$(.*?)\$\$|\\\[(.*?)\\\]/g, formulaReplacer)

    if (elem_higher_bottom_border) {
        scrollable.scrollBy(0, elem.getBoundingClientRect().height - client_borders.height)
    }
}


//ищем все блоки, где может быть написана формула
function render_all(){
    let queue = document.body.querySelectorAll(".im-mess:not(.rendered),\
       .reply_content:not(.rendered),\
       .wall_post_text:not(.rendered),\
       .article_layer__content:not(.rendered)");
    for (let elem of queue) {
        elem.classList.add('rendered')
        renderElem(elem)
    }
}


function loadKatexCss() {
    // This is only needed in Chrome
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
    appendCSS();
    setInterval(render_all, 300);
}
