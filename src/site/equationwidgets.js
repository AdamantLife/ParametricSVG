"use strict";
import { evaluateEquation } from "../equations.js";

/**
 * The valid callback types for the EquationWidgets object
 * @typedef {"prepopulate"|"evaluated"} EquationCallbackType
 * 
 * Callback for EquationWidgets' prepopulate signal: callbacks should modify the equations object in place
 * @callback prepopulateCallback
 * @param {Variables} equations - The equations object to prepopulate
 * 
 * Callback for EquationWidgets' evaluated signal
 * @callback evaluatedCallback
 * @param {EquationLookup} equations - The evaluated equations
 * 
 * The EquationWidgets.callbacks property
 * @typedef {Map<EquationCallbackType, (prepopulateCallback|evaluatedCallback)[]>} Callbacks
 * @property {prepopulateCallback[]} prepopulate
 * @property {evaluatedCallback[]} evaluated
 * 
 * This is a modified version of the Variables object where the keys
 * are a unique integer instead of the variable name. This is necessary
 * because, unlike Variables in the ParametricSVG Schema, the variables
 * created in the gui may be invalid (i.e.- no name, duplicate name) and
 * therefore need an alternative way to identify them.
 * @typedef {Map<int,Equation>} EquationLookup
 */

/**
 * A return for the validateEquations function which indicates
 * whether each equation is valid using the equation id as the key.
 * If the equation is valid, the first value is true, otherwise false.
 * @typedef {Map<int,[boolean, string|int]>} EquationResultLookup
 */

/**
 * Validates the equations in the given EquationLookup Object and returns any errors.
 * @param {EquationLookup} equations - A mapping of ids to equations
 * @returns {EquationResultLookup} - The errors found
 */
export function validateEquations(equations){
    /** @type {EquationResultLookup} */
    let results = new Map();
    /** @type {Variables} */
    let valids = {};
    for(let [eid, {name, value}] of equations.entries()){
        if(value.length && !name){
            results.set(eid, [false,`Equation with no name`]);
            continue;
        }
        if(equations[name] !== undefined){
            results.set(eid, [false,`Equation with name "${name}" already exists`]);
            continue;
        }
        valids[name] = {name, value, id: eid};
    }

    let equationsarray = Array.from(Object.values(valids));
    while(equationsarray.length){
        let { name, value, id } = equationsarray.shift();
        try{
            let r = evaluateEquation(value, valids);
            results.set(id, [true, r]);
        }catch(e){
            results.set(id, [false, `Syntax error in equation "${name}": ${e.message}`]);
        }
    }

    return results;
}

export class EquationWidgets {
    /**
     * Constructs a new manager for Equation Widgets
     * @param {Element} parent - The parent element to populate with widgets
     */
    constructor(parent){
        this.parent = parent;
        this.parser = new DOMParser();
        this.equationcontainer;
        this.eid = 0;
        this.setupParent();
        /**
         * @type {Callbacks}
         */
        this.callbacks = new Map();
        this.callbacks.set("prepopulate", []);
        this.callbacks.set("evaluated", []);
    }

    /**
     * Registers a callback for the given type (prepopulate or evaluated)
     * @param {EquationCallbackType} type
     * @param {Function} callback
     */
    registerCallback(type, callback){
        this.callbacks.get(type).push(callback);
    }

    /**
     * Unregisters a callback for the given type (prepopulate or evaluated).
     * If callback is true, all callbacks for the given type will be unregistered
     * @param {EquationCallbackType} type
     * @param {Function|true} callback
     */
    unregisterCallback(type, callback){
        if(callback === true) return this.callbacks.set(type, []);
        this.callbacks.set(type, this.callbacks.get(type).filter(cb => cb !== callback));
    }

    async setupParent(){
        this.parent.innerHTML = "";
        this.parent.classList.add("defintions");
        let r = await fetch("widgets/equationwidgetparent.html");
        let html = await r.text();
        let doc = this.parser.parseFromString(html, "text/html");
        this.parent.append(...doc.body.children);
        this.equationcontainer = document.getElementById("equations");
        this.parent.querySelector("#equationwidgets #addequation").addEventListener("click", e=>this.addEquation());
    }

    clearAll(){
        this.equationcontainer.innerHTML = "";
        this.updateEquations();
    }
    
    errorState(){
        return this.parent.querySelectorAll(".error").length > 0;
    }

    /**
     * Sets or clears feedback for one or all Equation Widgets
     * @param {string|"all"} eid - The eid of the Equation Widget to set feedback for, or "all" for all Equation Widgets
     * @param {Object} info - Info about the feedback
     * @param {string} info.type - The type of feedback
     * @param {string} info.feedback - The feedback to display
     */
    setFeedback(eid, {type, feedback}){
        // if (eid == "Loading") return;
        if(type == "clear"){
            if(eid == "all"){
                this.equationcontainer.querySelectorAll("div.equation").forEach(
                    equation=>equation.querySelectorAll(".button.error, .button.info").forEach(
                        e => e.remove())
                    );
            }else{
                this.equationcontainer.querySelector(`div.equation[data-type=equation][data-id="${eid}"]`).querySelectorAll(".button.error, .button.info").forEach(e => e.remove());
            }
            return;
        }
        let element = this.equationcontainer.querySelector(`div.equation[data-type=equation][data-id="${eid}"]`);
        if(!element){
            console.error(`Could not find equation with id ${eid}`);
            return;
            // DEVNOTE/TODO - Couldn't remember what the justification of this fallback was; preserving until next
            //           stable version.
            //
            // for(let equation of this.equationcontainer.querySelectorAll("div.equation[data-type=equation]")){
            //     if(equation.querySelector("#name").value == eid){
            //         element = equation;
            //         break;
            //     }
            // }
        }
        let button = document.createElement("span");
        button.id = type;
        button.classList.add("button", type);
        button.ariaLabel = type;
        button.title = feedback;
        element.querySelector(".controls").insertAdjacentElement("afterBegin", button);
    }

    /**
     * Compiles all valid equation widgets into a single object.
     * Calls the prepopulate callbacks prior to compilation
     * to create a base object.
     * Calls the evaluated callback with the compiled object.
     * Resets and updates the feedback items on all child widgets.
     * @param {Boolean} nocall - If true, no evaluatedCallbacks will be called
     * @returns {Variables} - Returns valid equations
     */
    updateEquations(nocall = false){
        /** @type {Variables} */
        let equations = {};
        for(let callback of this.callbacks.get("prepopulate")){
            callback(equations);
        }

        this.setFeedback("all", {type:"clear"});

        /** @type {EquationLookup} */
        let equationlookup = new Map();
        let pid = -1;
        for(let equation of Object.values(equations)){
            equationlookup.set(pid, equation);
            pid--;
        }

        for(let equation of document.querySelectorAll("div.equation[data-type=equation]")){
            if(equation.getAttribute("disabled")) continue;
            let name = equation.querySelector("#name").value;
            let eid = equation.getAttribute("data-id");
            let value = equation.querySelector("#value").value;
            if(!name && !value) continue;
            if(!value.length) continue;
            equationlookup.set(eid, {name, value});
        }

        let results = validateEquations(equationlookup);

        let errorstate = false;
        /** @type {Variables} */
        let returnvals = {};
        for(let [eid, [valid, feedback]] of results.entries()){
            if(eid < 0) continue;
            if(!valid){
                this.setFeedback(eid, {type:"error", feedback:feedback});
                console.error(error);
                errorstate = true;
            }else{
                this.setFeedback(eid, {type:"info", feedback: `Result: ${feedback}`});
                let equation = equationlookup.get(eid);
                returnvals[equation.name] = {name: equation.name, value: feedback};
            }
        }

        // Only signal evaluated callback when no errors exist
        if(!nocall && !errorstate && this.callbacks.get("evaluated").length){
            for(let callback of this.callbacks.get("evaluated")){
                callback(returnvals);
            }
        }

        return returnvals;
    }
    
    async addEquation(container){
        let result = await fetch(`widgets/equation.html`);
        let ele = await result.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.equation");
        elem.setAttribute("data-id", this.eid++);
        container = container || this.equationcontainer;
        container.append(elem);
        elem.querySelector("#name").focus();
        this.setupEquation(elem);
        return elem;
    }

    setupEquation(elem){
        elem.querySelector("#remove").addEventListener("click", e => {elem.remove(); this.updateEquations();});
        for(let inputele of [elem.querySelector("#name"), elem.querySelector("#value")]){
            EquationWidgets.setValueReset(inputele, this.updateEquations.bind(this));
        }
        elem.querySelector("#value").addEventListener("keyup", e=>{
            if(e.key == "Enter"){
                this.updateEquations();
                this.addEquation();
            }
        });
        elem.querySelector("#value").addEventListener("keydown",e =>{
            if(e.key == "Tab"){
                if(e.shiftKey) return;
                // Don't addEquation if comment is visible
                if(!e.target.parentElement.parentElement.querySelector(`label[for="comment"].hidden`)) return;
                if(e.target !== this.parent.querySelector("div.equation:last-child #value")) return;
                e.preventDefault();
                e.stopPropagation();
                this.updateEquations();
                this.addEquation();
                return false;
            }
        });
        elem.querySelector("#disabled").addEventListener("change", e=> {
            let parent = e.target.parentElement;
            while(parent.dataset.type !== "equation" && parent.parentElement){
                parent = parent.parentElement;
            }
            if(parent.dataset.type !== "equation"){
                throw new Error(`Could not find parent equation element: ${e.target}`);
            }
            let name = parent.querySelector("#name");
            let equation = parent.querySelector("#value");
            let comment = parent.querySelector("#comment");
            if(e.target.checked){
                name.setAttribute("disabled", true);
                parent.setAttribute("disabled", true);
                equation.setAttribute("disabled", true);
                comment.setAttribute("disabled", true);
            } else {
                name.removeAttribute("disabled");
                parent.removeAttribute("disabled");
                equation.removeAttribute("disabled");
                comment.removeAttribute("disabled")
            }
            this.updateEquations();
        });
        elem.querySelector("#togglecomment").addEventListener("click", e=>{
            elem.querySelector(`label[for="comment"]`).classList.toggle("hidden");
        });

        elem.querySelector("#comment").addEventListener("keydown", e=>{
            if(e.key == "Tab"){
                if(e.shiftKey) return;
                if(e.target !== this.parent.querySelector("div.equation:last-child #comment")) return;
                e.preventDefault();
                e.stopPropagation();
                this.updateEquations();
                this.addEquation();
                return false;
            }
        })
    }

    static handleInputKeyPress(e){
        if(e.key == "Enter"){
            e.preventDefault();
            e.stopPropagation();
            e.target.blur();
            return false;
        }
        if(e.key == "Escape"){
            e.preventDefault();
            e.stopPropagation();
            e.target.value = e.target.dataset.originalvalue;
            delete e.target.dataset.originalvalue;
            e.target.blur();
            return false;
        }
    }


    static setValueReset(input, valueChangeHandler){
        input.addEventListener("keyup", EquationWidgets.handleInputKeyPress)
        input.addEventListener("focus", e=> {e.target.dataset.originalvalue = e.target.value});
        input.addEventListener("blur", e=> {delete e.target.dataset.originalvalue; valueChangeHandler();});
    }

    /**
     * Serializes the current state of the EquationWidgets (including invalid equations)
     * @returns {Variables} - A Serialized version of the EquationWidgets state
     */
    serialize(){
        let out = {};
        for(let equation of this.equationcontainer.querySelectorAll(".equation")){
            let name = equation.querySelector("#name").value;
            let value = equation.querySelector("#value").value;
            let disabled = equation.querySelector("#disabled").checked;
            let comment = equation.querySelector("#comment").value || "";
            if(!name && !value) continue;
            out[name] = {name, value, disabled, comment};
        }
        return out;
    }

    /**
     * Sets the state of the EquationWidgets based on a JSON
     * @param {JsonDescription} json - A Json Description
     * @param {Boolean} nocall - If true, no evaluatedCallbacks will be called
     */
    async loadFromJSON(json, nocall = false){
        this.clearAll();
        for(let [name, {value, disabled, comment}] of Object.entries(json.equations)){
            let element = await this.addEquation();
            element.querySelector("#name").value = name;
            element.querySelector("#value").value = value;
            element.querySelector("#disabled").checked = disabled == true;
            if(disabled == true){
                element.querySelector("#disabled").dispatchEvent(new Event("change"));
            }
            element.querySelector("#comment").value = comment || "";
        }
        this.updateEquations(nocall);
    }
}