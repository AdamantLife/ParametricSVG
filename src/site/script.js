import { evaluateEquation } from "../equations.js";
import {ParametricSVG} from "../parametricsvg.js";
import {EquationWidgets} from "./equationwidgets.js";
import {EquationText, EquationTable} from "./equationalts.js";

ParametricSVG.evaluator = evaluateEquation;
var SVGW = new SVGWidgets(document.getElementById('svgwidgets'));
var EQW = new EquationWidgets(document.getElementById('equation_widgets'));
var EQTx = new EquationText(document.getElementById('equationtext'));
var EQTa = new EquationTable(document.getElementById('equationtable'));

const MIN = 50;
let parent = document.getElementById('parent');
var SVG = document.createElementNS(ParametricSVG.XMLNS, "svg");
SVG.setAttribute("xmlns", ParametricSVG.XMLNS);
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
    let mod = 1;
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
        EQTa.loadFromJSON({equations},true);
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
    updateSVG();
}
function updateSVG_SVGComponents(svgcomponents){
    updateSVG();
}

function updateSVG(defaults){
    let equations = defaults?.equations;
    if(!equations){
        equations = EQW.updateEquations(true);
    }
    let svgcomponents = defaults?.svgcomponents;
    if(!svgcomponents){
        svgcomponents = SVGW.serialize();
    }
    let result = ParametricSVG.parseJSON({equations, svgcomponents, attributes: {viewBox: SVG.getAttribute("viewBox")}});
    SVG.innerHTML = "";
    for(let r of [...result.children]){
        SVG.appendChild(r);
    }
}
EQW.registerCallback("evaluated", updateSVG_Equations);
SVGW.registerCallback("updated", updateSVG_SVGComponents);

function updateEQW(equations){
    EQW.loadFromJSON({equations});
    updateSVG({equations});
}
EQTx.registerCallback(updateEQW);
EQTa.registerCallback("prepopulate", equationCallback);
EQTa.registerCallback("evaluated", updateEQW);


async function copy(e){
    let out;
    if(e.ctrlKey || e.metaKey){
        /** @type {JsonDescription} */
        out = {equations: EQW.serialize(), svgcomponents: SVGW.serialize(), attributes: {viewBox: SVG.getAttribute("viewBox")}}
    }else{
        out = SVG.outerHTML;
    }
    await navigator.clipboard.writeText(out);
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
        let text = ParametricSVG.formatDeclaration() + SVG.outerHTML;
        let blob = new Blob([text], {type: "image/svg+xml;charset=utf-8"});
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
            if(jso.attributes && jso.attributes.viewBox){
                let vb = jso.attributes.viewBox
                SVG.setAttribute("viewBox", vb);
                let [x,y,width, height] = vb.split(" ");
                SVG.style.width = width + "px";
                SVG.style.height = height + "px";
                document.getElementById("size").innerHTML = `viewBox: 0 0 ${width} ${height}`;
            }
            SVGW.clearAll();
            EQW.clearAll();
            await EQW.loadFromJSON(jso, true);
            await SVGW.loadFromJSON(jso);
            
            let button = document.querySelector("button#changeinput");
            // Text mode
            if(button.classList.contains("showtext")){
                let equations = EQW.serialize();
                EQTx.loadFromJSON({equations});
            }
            // Table Mode
            else if(button.classList.contains("showtable")){
                let equations = EQW.serialize();
                EQTa.loadFromJSON({equations}, true);
            }
            
            window.scrollTo(0,0);
        }
    });
    input.click();
    e.preventDefault();
    e.stopPropagation();
    return false;
}
document.getElementById("load").addEventListener("click", load);


/**
 * 
 * @param {KeyboardEvent} e 
 */
function hotkeys(e){
    if(e.key == "PageUp" && e.altKey){
        window.scrollTo(0,0);
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if(e.key == "PageDown" && e.altKey){
        window.scrollTo(0,document.body.scrollHeight);
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}
document.body.addEventListener("keyup", hotkeys);