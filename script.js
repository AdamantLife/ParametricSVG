var PSVG = new ParametricSVG(document.getElementById('svg'), document.getElementById('equations'));

const MIN = 50;
let parent = document.getElementById('parent');
parent.style.minWidth = MIN + 'px';
parent.style.minHeight = MIN + 'px';
parent.appendChild(PSVG.svg);
PSVG.svg.setAttribute("viewBox", `0 0 ${MIN} ${MIN}`);
PSVG.svg.style.width = MIN + 'px';
PSVG.svg.style.height = MIN + 'px';
PSVG.svg.style.display = "block";
document.getElementById("size").innerHTML = `viewBox: 0 0 ${MIN} ${MIN}`;

function updateCallback(type, ...arguments){
    if(type == "equation"){
        equations = arguments[0];
        let {width, height} = PSVG.svg.getBoundingClientRect();
        equations["vbw"] = width;
        equations["vbh"] = height;
    }else if(type=="svg"){
        let svg = arguments[0];
        let {width, height} = svg.getBoundingClientRect();
        let str = `0 0 ${width} ${height}`;
        let viewBox = svg.getAttribute("viewBox")
        if(viewBox != str){
            let result = /\d+ \d+ (?<width>\d+) (?<height>\d+)/.exec(viewBox);
            if(result){
                width = result.groups.width;
                height = result.groups.height;
                svg.style.width = width+"px";
                svg.style.height = height+"px";
            }
            document.getElementById("size").innerHTML = `viewBox: ${viewBox}`
        }
    }
}
PSVG.setUpdateCallback(updateCallback);

function resize(e){
    let {width, height} = PSVG.svg.getBoundingClientRect();
    let delta = e.deltaY > 0 ? 100 : -100;
    mod = 1;
    if(e.ctrlKey && e.shiftKey && e.altKey){
        mod = .01;
    }else if(e.ctrlKey && e.shiftKey){
        mod = .1;
    }else if(e.ctrlKey){
        mod = .5;
    }
    width -= delta*mod;
    width = Math.floor(Math.max(Math.min(width, 500), MIN));
    PSVG.svg.setAttribute("viewBox", `0 0 ${width} ${width}`);
    PSVG.svg.style.width = width + 'px';
    PSVG.svg.style.height = width + 'px';
    PSVG.updateEquations();
    document.getElementById("size").innerHTML = `viewBox: 0 0 ${width} ${width}`;
    e.preventDefault();
    e.stopPropagation();
    return false;
}
PSVG.svg.addEventListener("wheel", resize);

function copy(e){
    let out;
    if(e.ctrlKey || e.metaKey){
        out = JSON.stringify(PSVG.serialize());
    }else{
        out = PSVG.svg.outerHTML;
    }
    navigator.clipboard.writeText(out);
    if(e.ctrlKey || e.metaKey){
        alert("Configuration copied to clipboard");
    }else{
        alert("SVG copied to clipboard");
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
}
PSVG.svg.addEventListener("click", copy);

function save(e){
    let out, filename;
    if(e.ctrlKey || e.metaKey){
        let obj = PSVG.serialize();
        let blob = new Blob([JSON.stringify(obj)], {type: "application/json;charset=utf-8"});
        out = URL.createObjectURL(blob);
        filename = "parametric.json";
    }else{
        let text = PSVG.svg.outerHTML;
        let blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        out = URL.createObjectURL(blob);
        filename = "parametric.svg";
    }
    let a = document.createElement("a");
    a.href = out
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    e.preventDefault();
    e.stopPropagation();
    return false;
}
PSVG.svg.addEventListener("contextmenu", save);

async function load(e){
    let input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", async e => {
        let file = e.target.files[0];
        if(file){
            let text = await file.text();
            PSVG.loadFromJSON(JSON.parse(text));
        }
    });
    input.click();
    e.preventDefault();
    e.stopPropagation();
    return false;
}
document.getElementById("load").addEventListener("click", load);

document.getElementById("addsvg").addEventListener("click", e => {
    let value = document.getElementById("svgtype").value;
    PSVG.addSVG(value);   
});
document.getElementById("addequation").addEventListener("click", e=>PSVG.addEquation());