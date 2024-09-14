class EquationWidgets {
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
         * @typedef {"prepopulate"|"evaluated"} EquationCallbackType
         * @typedef {Map<EquationCallbackType, Function>} Callbacks
         * @type {Callbacks}
         */
        this.callbacks = {};
    }

    /**
     * Registers a callback for the given type (prepopulate or evaluated)
     * @param {EquationCallbackType} type
     * @param {Function} callback
     */
    registerCallback(type, callback){
        if (!this.callbacks[type]) this.callbacks[type] = [];
        this.callbacks[type].push(callback);
    }

    /**
     * Unregisters a callback for the given type (prepopulate or evaluated).
     * If callback is true, all callbacks for the given type will be unregistered
     * @param {EquationCallbackType} type
     * @param {Function|true} callback
     */
    unregisterCallback(type, callback){
        if (!this.callbacks[type]) return;
        if(callback === true) return this.callbacks[type] = [];
        this.callbacks[type] = this.callbacks[type].filter(cb => cb !== callback);
    }

    async setupParent(){
        this.parent.innerHTML = "";
        this.parent.classList.add("defintions");
        let r = await fetch("src/widgets/equationwidgetparent.html");
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
     */
    updateEquations(){
        let equations = {};
        let eids = {};
        if(this.callbacks['prepoulate']){
            for(let callback of this.callbacks["prepopulate"]){
                let result = callback(equations);
                if(result !== undefined){
                    Object.apply(equations, result);
                }
            }
        }
        this.setFeedback("all", {type:"clear"});
        let errorstate = false;
        for(let equation of document.querySelectorAll("div.equation[data-type=equation]")){
            if(equation.getAttribute("disabled")) continue;
            let name = equation.querySelector("#name").value;
            let eid = equation.getAttribute("data-id");
            let equationstring = equation.querySelector("#value").value;
            if(!name && !equationstring) continue;
            if(!equationstring.length) continue;
            if(equationstring.length && !name){
                this.setFeedback(eid, {type:"error", feedback:`Equation with no name`});
                console.error(`Equation with no name`);
                errorstate = true;
                continue;
            }
            if(equations[name] !== undefined){
                this.setFeedback(eid, {type:"error", feedback:`Equation with name "${name}" already exists`});
                console.error(`Equation with name "${name}" already exists`);
                errorstate = true;
                continue;
            }
            equations[name] = equationstring;
            eids[name] = eid;
            this.setFeedback(eid, {type:"clear"});
        }

        let names = Object.keys(equations);
        while(names.length){
            let name = names.shift();
            try{
                equations[name] = evaluateEquation(equations[name], equations);
                this.setFeedback(eids[name], {type:"info", feedback: `Result: ${equations[name]}`});
            }catch(e){
                this.setFeedback(eids[name], {type:"error", feedback:e.message});
                console.error(`Syntax error in equation "${name}": ${e.message}`);
                delete equations[name];
                delete eids[name];
                errorstate = true;
            }
        }

        // Only signal evaluated callback when no errors exist
        if(!errorstate && this.callbacks["evaluated"]){
            for(let callback of this.callbacks["evaluated"]){
                callback(equations);
            }
        }
    }
    
    async addEquation(container){
        let result = await fetch(`src/widgets/equation.html`);
        let ele = await result.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.equation");
        elem.setAttribute("data-id", this.eid++);
        this.setupEquation(elem);
        container = container || this.equationcontainer;
        container.append(elem);
        elem.querySelector("#name").focus();
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
        elem.querySelector("#disable").addEventListener("change", e=> {
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
            let disabled = equation.querySelector("#disable").checked;
            let comment = equation.querySelector("#comment").value;
            if(!name && !value) continue;
            out[name] = {name, value, disabled, comment};
        }
        return out;
    }

    /**
     * Sets the state of the EquationWidgets based on a JSON
     * @param {JsonDescription} json - A Json Description
     */
    async loadFromJSON(json){
        this.clearAll();
        for(let [name, {value, disabled, comment}] of Object.entries(json.equations)){
            let element = await this.addEquation();
            element.querySelector("#name").value = name;
            element.querySelector("#value").value = value;
            element.querySelector("#disable").checked = disabled == true;
            if(disabled == true){
                element.querySelector("#disable").dispatchEvent(new Event("change"));
            }
            element.querySelector("#comment").value = comment;
        }
    }
}