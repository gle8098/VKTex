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
            //buffer.setAttribute('title', str(e));
            buffer.innerHTML = formula;
            res = buffer.outerHTML;
        }
    return res;
}


//ищем формулы и отпрявляем в formulaReplacer на рендеринг
function prepareInnerHTML(messIndex, innerStr){
    $( this ).addClass("rendered");    //помечаем отрендеренное сообщение классом rendered
    return innerStr.replace(/\$\$(.*?)\$\$|\\\[(.*?)\\\]/g, formulaReplacer);
}

function renderElem(elem) {
    for (var i = 0; i < elem.childNodes.length; i++) {
        var childNode = elem.childNodes[i];

        if (childNode.nodeType === 3) {
            // Text node
            let span = document.createElement('span');
            span.innerHTML = childNode.textContent.replace(/\$\$(.*?)\$\$|\\\[([\s\S]*?)\\\]/g, formulaReplacer);
            if (span.childNodes.length > 1 || span.childNodes[0].nodeType !== 3) {
                // Something was replaced
                for (let spanChild of span.childNodes) {
                    elem.insertBefore(spanChild, childNode)
                }
                elem.removeChild(childNode)
            }
            i += span.childNodes.length - 1;
        } else if (childNode.nodeType === 1) {
            // Element node
            renderElem(childNode);
        }
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



function main() {
    appendCSS();
    setInterval(render_all, 300);
}
