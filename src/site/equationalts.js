"use strict";

import { validateEquations } from "./equationwidgets.js";

export class EquationText{
    /** NOTE- EquationRE supports equation names starting with numbers so that work
     *        won't be lost when the input mode is toggled. evaluateEquation does not
     *        support equation names starting with numbers.
     */
    static EQUATIONRE = /^(?<disabled>\/\/)?\s*(?<name>\w+)\s*=\s*(?<value>[^;]*?);?\s*(?:\/\/\s*(?<comment>.*))?$/i;
    constructor(text){
        this.text = text;
        this.callbacks = [];
        this.text.addEventListener("blur", this.notifyCallbacks.bind(this));
    }

    registerCallback(callback){
        this.callbacks.push(callback);
    }
    
    unregisterCallback(callback){
        this.callbacks = this.callbacks.filter(c => c !== callback);
    }

    notifyCallbacks(){
        let out = this.serialize();
        for(let callback of this.callbacks){
            callback(out);
        }
    }

    serialize(){
        return this.parse();
    }

    /**
     * Parses the text into a set of equations
     * @returns {Variables} - The Equations parsed from the text element. These may be invalid equations.
     */
    parse(){
        let value = this.text.value;
        // Need to add /g to work with matchall (could alternatively be rewritten as an iteration)
        let newreg = new RegExp(EquationText.EQUATIONRE.source, EquationText.EQUATIONRE.flags + "gm");
        let results = value.matchAll(newreg);
        /** @type {Variables} */
        let out = {};
        for(let result of results){
            let name = result.groups.name;
            // Can't add blank to output
            if(!name || !name.length) continue;
            // NOTE- We're not checking that name is valid per comment on EQUATIONRE
            let value = result.groups.value;
            let comment = result.groups.comment;
            let disabled = Boolean(result.groups.disabled);
            out[name] = {name, value, comment, disabled};
        }
        return out;
    }

    loadFromJSON(json){
        this.text.value = "";
        for(let {name, value, comment, disabled} of Object.values(json.equations)){
            this.text.value += `${disabled ? "// " : ""}${name} = ${value};${comment ? ` // ${comment}` : ""}\n`;
        }
    }
}

export class EquationTable{
    constructor(table, addhead = true){
        /** @type {Element} */
        this.table = table;
        if(!this.table.querySelector("tbody")){
            this.table.append(document.createElement("tbody"));
        }
        if(!this.table.querySelector("thead") && addhead){
            let head = document.createElement("thead");
            let tr = document.createElement("tr");
            head.append(tr);
            for(let name of ["Name", "Equation", "Disable", "Comment"]){
                let td = document.createElement("td");
                td.innerText = name;
                tr.append(td);
            }
            this.table.insertAdjacentElement("afterbegin", head);
        }
        this.eid = 0;
        /** @type {Callbacks} */
        this.callbacks = new Map();
        this.callbacks.set("prepopulate", []);
        this.callbacks.set("evaluated", []);
    }

    registerCallback(type,callback){
        this.callbacks.get(type).push(callback);
    }
    
    unregisterCallback(callback){
        this.callbacks.set(type, this.callbacks.get(type).filter(c => c !== callback));
    }

    clearAll(){
        this.table.querySelector("tbody").innerHTML = "";
    }

    /**
     * Adds a new Table Row Element with TD>Input Elements for Name, Value, Disabled, and Comment
     * @returns {Element} - The created Table Row Element
     */
    addRow(){
        let row = document.createElement("tr");
        row.dataset.id = this.eid;
        this.eid++;
        for(let name of ["name", "value", "disabled", "comment"]){
            let td = document.createElement("td");
            let input = document.createElement("input");
            input.id = name;
            if(name === "disabled"){
                input.type = "checkbox";
            }else{
                input.type = "text";
            }
            input.addEventListener("blur", this.updateEquations.bind(this));
            td.append(input);
            row.append(td);
        }
        row.querySelector("input#name").addEventListener("blur",e=>{
            if(e.target.value && e.target == this.table.querySelector("tbody").lastElementChild.querySelector("input#name")){
                this.addRow();
            }
        });

        row.querySelector("input#disabled").addEventListener("change", e=>{
            for(let name of ["name", "value", "comment"]){
                let element = row.querySelector(`#${name}`);
                if(e.target.checked){
                    element.setAttribute("disabled", true);
                }else{
                    element.removeAttribute("disabled");
                }
            }
            this.updateEquations();
        });
        this.table.querySelector("tbody").append(row);
        return row;
    }

    /**
     * @returns {Variables}
     */
    updateEquations(nocall = false){
        /** @type {EquationLookup} */
        let equations = new Map();
        
        let pid = -1;
        let temp = {};
        for(let callback of this.callbacks.get("prepopulate")){
            callback(temp);
        }
        for(let equation of Object.values(temp)){
                equations.set(pid, equation);
                pid--;
        }

        this.table.querySelectorAll("tr .error").forEach(e => {e.classList.remove("error"); e.removeAttribute("title");});
        this.table.querySelectorAll("tr .info").forEach(e => {e.classList.remove("info"); e.removeAttribute("title");});
        
        
        for(let row of this.table.querySelectorAll("tbody > tr")){
            let disabled = row.querySelector("input#disabled").checked;
            if(disabled) continue;

            let name = row.querySelector("input#name").value;
            let value = row.querySelector("input#value").value;
            if(!name && !value) continue;
            
            let eid = row.dataset.id;
            equations.set(eid, {name, value});
        }

        let results = validateEquations(equations);
        
        /** @type {Variables} */
        let out = {};

        for(let [eid, [valid, feedback]] of results.entries()){
            if(eid < 0) continue;
            let row = this.table.querySelector(`tr[data-id="${eid}"]`);
            if(!row){
                throw new Error(`Equation ${eid} not found`);
            }

            if(!valid){
                let nameele =  row.querySelector("input#name")
                nameele.classList.add("error");
                nameele.title = feedback;
                continue;
            }else{
                let valueele =  row.querySelector("input#value")
                valueele.classList.add("info");
                valueele.title = `Result: ${feedback}`;
                let {name,value} = equations.get(eid);
                out[name] = {name, value};
            }
        }

        if(!nocall){
            for(let callback of this.callbacks.get("evaluated")){
                callback(out);
            }
        }

        return out;
    }

    serialize(){
        let out = {};
        for(let row of this.table.querySelectorAll("tbody > tr")){
            let name = row.querySelector("input#name").value;
            let value = row.querySelector("input#value").value;
            if(!name && !value) continue;
            let disabled = row.querySelector("input#disabled").checked;
            let comment = row.querySelector("input#comment").value;
            out[name] = {name, value, disabled, comment};
        }
        return out;
    }

    /**
     * 
     * @param {JsonDescription} json 
     * @param {Boolean} nocall- If true, no evaluatedCallbacks will be called
     */
    loadFromJSON(json, nocall = false){
        this.clearAll();
        for(let {name, value, disabled, comment} of Object.values(json.equations)){
            let row = this.addRow();
            row.querySelector("input#name").value = name;
            row.querySelector("input#value").value = value ? value : "";
            row.querySelector("input#disabled").checked = disabled == true;
            row.querySelector("input#comment").value = comment ? comment : "";
            if(disabled == true){
                row.querySelector("input#disabled").dispatchEvent(new Event("change"));
            }
        }
        this.addRow();
        this.updateEquations(nocall);
    }
}