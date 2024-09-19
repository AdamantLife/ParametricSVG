class EquationText{
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

class EquationTable{
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
        this.callbacks = [];
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

    clearAll(){
        this.table.querySelector("tbody").innerHTML = "";
    }

    /**
     * Adds a new Table Row Element with TD>Input Elements for Name, Value, Disabled, and Comment
     * @returns {Element} - The created Table Row Element
     */
    addRow(){
        let row = document.createElement("tr");
        for(let name of ["name", "value", "disabled", "comment"]){
            let td = document.createElement("td");
            let input = document.createElement("input");
            input.id = name;
            if(name === "disabled"){
                input.type = "checkbox";
            }else{
                input.type = "text";
            }
            input.addEventListener("blur", this.validate.bind(this));
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
        });
        this.table.querySelector("tbody").append(row);
        return row;
    }

    validate(){
        let out = {};
        this.table.querySelectorAll("tr .error").forEach(e => {e.classList.remove("error"); e.removeAttribute("title");});
        this.table.querySelectorAll("tr .info").forEach(e => {e.classList.remove("info"); e.removeAttribute("title");});

        for(let row of this.table.querySelectorAll("tbody > tr")){
            let disabled = row.querySelector("input#disabled").checked;
            if(disabled) continue;

            let name = row.querySelector("input#name").value;
            let value = row.querySelector("input#value").value;
            if(!name && !value) continue;
            if(!name && value){
                let nameele =  row.querySelector("input#name")
                nameele.classList.add("error");
                nameele.title = "Missing name";
                continue;
            }
            if(out[name]){
                let nameele = row.querySelector("input#name")
                nameele.classList.add("error");
                nameele.title = "Duplicate name";
                continue;
            }
            if(name && !value) continue;

            out[name] = {name, value, row};
        }

        for(let name of Object.keys(out)){
            let {value, row} = out[name];
            let result, valueele;
            valueele =  row.querySelector("input#value")
            try{
                console.log(name, value, out);
                result = evaluateEquation(value, out);
                out[name].value = result;
            }catch(e){
                valueele.classList.add("error");
                valueele.title = `Syntax Error: ${e.message}`;
                continue;
            }
            valueele.classList.add("info");
            valueele.title = `Result: ${result}`;
        }
        this.notifyCallbacks();
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
     */
    loadFromJSON(json){
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
        this.validate();
    }
}