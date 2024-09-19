var SVGW = new SVGWidgets(document.getElementById('svgwidgets'));
var EQW = new EquationWidgets(document.getElementById('equation_widgets'));
var EQTx = new EquationText(document.getElementById('equationtext'));
var EQTa = new EquationTable(document.getElementById('equationtable'));

const MIN = 50;
let parent = document.getElementById('parent');
var SVG = document.createElementNS(ParametricSVG.XMLNS, "svg");
parent.appendChild(SVG);
parent.style.minWidth = MIN + 'px';
parent.style.minHeight = MIN + 'px';
SVG.setAttribute("viewBox", `0 0 ${MIN} ${MIN}`);
SVG.style.width = MIN + 'px';
SVG.style.height = MIN + 'px';
SVG.style.display = "block";
document.getElementById("size").innerHTML = `viewBox: 0 0 ${MIN} ${MIN}`;

/** @param {Variables} */
function equationCallback(equations){
    let {width, height} = SVG.getBoundingClientRect();
    equations["vbw"] = {name:"vbw", value:width};
    equations["vbh"] = {name: "vbh", value:height};
}
EQW.registerCallback("prepopulate", equationCallback);

function resize(e){
    let {width, height} = SVG.getBoundingClientRect();
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
    SVG.setAttribute("viewBox", `0 0 ${width} ${width}`);
    SVG.style.width = width + 'px';
    SVG.style.height = width + 'px';
    EQW.updateEquations();
    document.getElementById("size").innerHTML = `viewBox: 0 0 ${width} ${width}`;
    e.preventDefault();
    e.stopPropagation();
    return false;
}
SVG.addEventListener("wheel", resize);

async function changeInputType(e){
    let button = document.querySelector("button#changeinput");
    let equations;
    // NOTE- EQW is being updated directly by EQTa and EQTx's callbacks

    if(button.classList.contains("showtext")){
        button.classList.remove("showtext");
        button.classList.add("showtable");
        equations = EQTx.serialize();
        EQTa.loadFromJSON({equations});
    } else if(button.classList.contains("showtable")){
        button.classList.remove("showtable");
        // We don't need to update the text input because it's not visible
        // and will be populated on the next click
    }else{
        button.classList.add("showtext");
        let equations = EQW.serialize();
        EQTx.loadFromJSON({equations});
        // We don't need to load the equations into the table
        // because it's not visible and will be populated
        // on the next click
    }
}
document.getElementById("changeinput").addEventListener("click", changeInputType);

function updateSVG_Equations(equations){
    updateSVG({equations});
}
function updateSVG_SVGComponents(svgcomponents){
    updateSVG({svgcomponents});
}

function updateSVG(defaults){
    let equations = defaults.equations;
    if(!equations){
        equations = EQW.updateEquations();
    }
    let svgcomponents = defaults.svgcomponents;
    if(!svgcomponents){
        svgcomponents = SVGW.serialize();
    }
    let result = ParametricSVG.parseJSON({equations, svgcomponents, attributes: {viewBox: SVG.getAttribute("viewBox")}});
    SVG.innerHTML = "";
    console.log("???", result);
    for(let r of [...result.children]){
        console.log("!?!?!?", r);
        SVG.appendChild(r);
    }
}
EQW.registerCallback("evaluated", updateSVG_Equations);
SVGW.registerCallback("updated", updateSVG_SVGComponents);

function updateEQW(equations){
    EQW.loadFromJSON({equations});
    updateSVG();
}
EQTx.registerCallback(updateEQW);
EQTa.registerCallback(updateEQW);


function copy(e){
    let out;
    if(e.ctrlKey || e.metaKey){
        /** @type {JsonDescription} */
        out = {equations: EQW.serialize(), svgcomponents: SVGW.serialize(), attributes: {viewBox: SVG.getAttribute("viewBox")}}
    }else{
        out = SVG.outerHTML;
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
SVG.addEventListener("click", copy);

function save(e){
    let out, filename;
    if(e.ctrlKey || e.metaKey){
        /** @type {JsonDescription} */
        let obj = {equations: EQW.serialize(), svgcomponents: SVGW.serialize(), attributes: {viewBox: SVG.getAttribute("viewBox")}}
        let blob = new Blob([JSON.stringify(obj)], {type: "application/json;charset=utf-8"});
        out = URL.createObjectURL(blob);
        filename = "parametric.psvg.json";
    }else{
        let text = SVG.outerHTML;
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
SVG.addEventListener("contextmenu", save);

async function load(e){
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".psvg.json";
    input.addEventListener("change", async e => {
        let file = e.target.files[0];
        if(file){
            let text = await file.text();
            /** @type {JsonDescription} */
            let jso = JSON.parse(text);
            await EQW.loadFromJSON(jso);
            await SVGW.loadFromJSON(jso);
            if(jso.attributes && jso.attributes.viewBox){
                SVG.setAttribute("viewBox", jso.attributes.viewBox);
            }
        }
    });
    input.click();
    e.preventDefault();
    e.stopPropagation();
    return false;
}
document.getElementById("load").addEventListener("click", load);