const XMLNS = "http://www.w3.org/2000/svg";

/**
 * 
 * A descriptor for an SVG Component element
 * @typedef {Object} SVGDescription
 * @property {string} type - The type of element
 * @property {Object<string, string>} attributes - The attributes of the element
 * 
 * @typedef {Object} CircleDescription
 * @extends {SVGDescription}
 * @property {"circle"} type - The type of element
 * @property {number} cx - The x coordinate of the center of the circle
 * @property {number} cy - The y coordinate of the center of the circle
 * @property {number} r - The radius of the circle
 * 
 * @typedef {Object} EllipseDescription
 * @extends {SVGDescription}
 * @property {"ellipse"} type - The type of element
 * @property {number} cx - The x coordinate of the center of the ellipse
 * @property {number} cy - The y coordinate of the center of the ellipse
 * @property {number} rx - The x radius of the ellipse
 * @property {number} ry - The y radius of the ellipse
 * 
 * @typedef {Object} RectangleDescription
 * @extends {SVGDescription}
 * @property {"rect"} type - The type of element
 * @property {number} x - The x coordinate of the top left corner
 * @property {number} y - The y coordinate of the top left corner
 * @property {number} width - The width of the rectangle
 * @property {number} height - The height of the rectangle
 * @property {number} rx - The x radius of the rectangle
 * @property {number} ry - The y radius of the rectangle
 * 
 * @typedef {Object} LineDescription
 * @extends {SVGDescription}
 * @property {"line"} type - The type of element
 * @property {number} x1 - The x coordinate of the start of the line
 * @property {number} y1 - The y coordinate of the start of the line
 * @property {number} x2 - The x coordinate of the end of the line
 * @property {number} y2 - The y coordinate of the end of the line
 * 
 * The X and Y coordinates of points for Polygons and Polylines
 * @typedef {Array<[Number, Number]>} PolyPoint
 * 
 * @typedef {Object} PolygonDescription
 * @extends {SVGDescription}
 * @property {"polygon"} type - The type of element
 * @property {PolyPoint[]} points - The points of the polygon
 * 
 * @typedef {Object} PolylineDescription
 * @extends {SVGDescription}
 * @property {"polyline"} type - The type of element
 * @property {PolyPoint[]} points - The points of the polyline
 * 
 * @typedef {Object} PathSegment
 * @property {string} type - The type of segment
 * @property {boolean} relative - Whether the segment uses relative coordinates
 * 
 * @typedef {Object} MoveSegment
 * @extends {PathSegment}
 * @property {"move"} type - The type of segment
 * @property {number} x - The x coordinate of the point
 * @property {number} y - The y coordinate of the point
 * 
 * @typedef {Object} LineSegment
 * @extends {PathSegment}
 * @property {"line"} type - The type of segment
 * @property {number} x - The x coordinate of the point
 * @property {number} y - The y coordinate of the point
 * 
 * @typedef {Object} HorizontalSegment
 * @extends {PathSegment}
 * @property {"horizontal"} type - The type of segment
 * @property {number} x - The x coordinate of the point
 * 
 * @typedef {Object} VerticalSegment
 * @extends {PathSegment}
 * @property {"vertical"} type - The type of segment
 * @property {number} y - The y coordinate of the point
 *
 * @typedef {Object} CloseSegment
 * @extends {PathSegment}
 * @property {"close"} type - The type of segment
 * 
 * @typedef {Object} ShortCubicSegment
 * @extends {PathSegment}
 * @property {"shortcubic"} type - The type of segment
 * @property {number} x2 - The x coordinate of the second control point
 * @property {number} y2 - The y coordinate of the second control point
 * @property {number} x - The x coordinate of the end point
 * @property {number} y - The y coordinate of the end point
 * 
 * @typedef {Object} CubicSegment
 * @extends {ShortCubicSegment}
 * @property {"cubic"} type - The type of segment
 * @property {number} x1 - The x coordinate of the first control point
 * @property {number} y1 - The y coordinate of the first control point
 * 
 * @typedef {Object} ShortQuadraticSegment
 * @extends {PathSegment}
 * @property {"shortquadratic"} type - The type of segment
 * @property {number} x - The x coordinate of the end point
 * @property {number} y - The y coordinate of the end point
 * 
 * @typedef {Object} QuadraticSegment
 * @extends {ShortQuadraticSegment}
 * @property {"quadratic"} type - The type of segment
 * @property {number} x1 - The x coordinate of the first control point
 * @property {number} y1 - The y coordinate of the first control point
 * 
 * @typedef {Object} ArcSegment
 * @extends {PathSegment}
 * @property {"arc"} type - The type of segment
 * @property {number} rx - The x radius of the arc
 * @property {number} ry - The y radius of the arc
 * @property {number} x - The x coordinate of the end point
 * @property {number} y - The y coordinate of the end point
 * @property {number} xRotation - The x rotation of the arc
 * @property {boolean} largeArcFlag - Whether the arc is large
 * @property {boolean} sweepFlag - Whether the arc is clockwise
 * 
 * @typedef {Object} PathDescription
 * @extends {SVGDescription}
 * @property {"path"} type - The type of element
 * @property {PathSegment[]} path- The segments of the path
 * 
 * Represents an update to the PSVG's state
 * @typedef {Object} PSVGUpdate
 * @property {"clear"|"error"|"equations"|"svg"} type - The type of update
 * @property {any} info - Additional information
 * 
 * An error state for the ParametricSVG
 * @typedef {Object} PSVGError
 * @property {"equation" | "svg"} category - The category of error
 * @property {string} name - The name of the error
 * @property {any} info - Additional information
 * 
 * A callback to provide descriptors for the SVG
 * @callback SVGCallback
 * @returns {SVGDescription[]}- An array of SVGDescriptions used to create the SVG
 * 
 * A callback to update the PSVG's equations
 * @callback EquationCallback
 * @param {Variables} equations - The equations currently in use by the PSVG
 * 
 * Callback which is notified of updates
 * @callback UpdateCallback
 * @param {PSVGUpdate} update - The update
 */

/**
 * 
 */
class ParametricSVG {
    /**
     * Constructs a new ParametricSVG instance
     */
    constructor(){
        /**
         * Functions to call in order to populate the SVG.
         * These should be added via svgcallback.
         * @type {SVGCallback[]}
         */
        this.svgcallbacks = [];
        /**
         * Functions to call in order to update the PSVG's available equations.
         * These callbacks are called prior to the SVG being built.
         * These should be added via equationcallback.
         * @type {EquationCallback[]}
         */
        this.equationcallback = [];
        /**
         * The equations available to the PSVG to substitute when building
         * the SVG. These are cleared during updateEquations (which occurs
         * prior to updateSVG) and therefore should be added via
         * equationcallback.
         * @type {Variables}
         */
        this.equations = {};
        /**
         * An array of functions to notifify when an update is made
         * to the PSVG's state. Callback functions should be added
         * via addUpdateCallback.
         * @type {UpdateCallback[]}
         */
        this.updatecallback = [];
        /**
         * An array of errors in the PSVG's state
         * @type {PSVGError[]}
         */
        this.errors = [];
        this.svg = document.createElementNS(XMLNS, "svg");
        this.parser = new DOMParser();
    }

    clearAll(){
        this.svg.innerHTML = "";
        if(this.updatecallback) this.updatecallback({
            type: "clear",
            info: "all"
        })
        this.updateEquations();
    }

    addSVGCallback(callback){
        this.svgcallbacks.push(callback);
    }
    removeSVGCallback(callback){
        this.svgcallbacks = this.svgcallbacks.filter(c => c !== callback);
    }

    addEquationCallback(callback){
        this.equationcallback.push(callback);
    }
    removeEquationCallback(callback){
        this.equationcallback = this.equationcallback.filter(c => c !== callback);
    }

    addUpdateCallback(callback){
        this.updatecallback.push(callback);
    }
    removeUpdateCallback(callback){
        this.updatecallback = this.updatecallback.filter(c => c !== callback);
    }

    /**
     * Sets a new error state for the ParametricSVG instance
     * @param {PSVGError} error - The error to set
     */
    setErrorState(error){
        let e = this.errors.filter(e => e.name === error.name && e.category === error.category);
        if(e.length) return;
        this.errors.push(error);
        for(let callback of this.updatecallback){
            callback({type: "error", info: {action: "add", error}});
        }
    }

    /**
     * Returns whether or not the ParametricSVG instance has any errors
     * @returns {boolean}
     */
    getErrorState(){
        return Boolean(this.errors.length);
    }

    /**
     * Clears an error based on the type and/or name
     * @param {PSVGError} error 
     */
    clearErrorState(error){
        let {category, name} = error;
        if(category === undefined && name === undefined) return;
        if(category !== undefined && name !== undefined){
            this.errors = this.errors.filter(e => e.name !== name || e.category !== category);
        }else if(category !== undefined){
            this.errors = this.errors.filter(e => e.category !== category);
        }else if(name !== undefined){
            this.errors = this.errors.filter(e => e.name !== name);
        }
        for(let callback of this.updatecallback) callback({type:"clear", info: {error}});
    }

    updateEquations(){
        this.equations = {};
        for(let callback of this.updatecallback) callback({type: "clear", info:{equations: this.equations}});
        for(let callback of this.equationcallback) callback(this.equations);
        for(let callback of this.updatecallback) callback({type:"equations",info:{equations: this.equations}});
        this.updateObjectEquations(this.equations);
        for(let callback of this.updatecallback) callback({type:"equations",info:{equations: this.equations}});
        this.updateSVG();
    }

    /**
     * Runs evaluateEquation on each value of a given object
     * @param {Object} obj - The Object to evaluate
     * @returns {void} - The object is mutated in place
     */
    updateObjectEquations(obj){
        for(let [key, value] of Object.entries(obj)){
            console.log("key", key, "value", value);
            try{
                if(/^\d/.test(key)){
                    console.log("error")
                    this.setErrorState({category:"equation", name:key, info: {type:"numericname",error: new Error("Equation syntax error")}});
                    continue;
                }
                obj[key] = evaluateEquation(value+"", this.equations);
            }catch(e){
                this.setErrorState({category:"equation", name:key, info: {type:"syntaxerror",error: e}});
            }
        }
    }

    updateSVG(){
        this.svg.innerHTML = "";
        for(let callback of this.updatecallback){
            callback({type: "clear", info:{svg: this.svg}});
        }

        let objs = [];
        for(let callback of this.svgcallbacks) objs.push(...callback());
        console.log(this.equations)
        for(let obj of objs){
            let element = this.parseJSON(obj);
            if(element){
                // console.log(element);
                this.svg.append(element);
            }
        }
        
        for(let callback of this.updatecallback){
            callback({type: "svg", info:{svg: this.svg}});
        }
    }

    parseJSON(obj){
        let element = null;
        if(obj.type === "circle"){
            element = this.parseCirle(obj);
        }else if(obj.type === "line"){
            element = this.parseLine(obj);
        }else if(obj.type === "ellipse"){
            element = this.parseEllipse(obj);
        }else if(obj.type === "rect"){
            element = this.parseRectangle(obj);
        }else if(obj.type === "polygon"){
            element = this.parsePolygon(obj);
        }else if(obj.type === "polyline"){
            element = this.parsePolyline(obj);
        }else if(obj.type === "path"){
            element = this.parsePath(obj);
        }else{
            throw new Error(`Invalid type ${obj.type}`);
        }
        return element;
    }

    /**
     * Updates the provided attributes via updateObjectEquation and sets the attributes of an SVG Element.
     * @param {Element} element - The Element to set the attributes on
     * @param {Object<string, string>} attributes - The attributes to update and set
     */
    setComponentAttributes(element, attributes){
        for(let [attr, val] of Object.entries(attributes)){
            if(val){
                try{
                    val = evaluateEquation(val, this.equations);
                }catch(e){
                    continue;
                }
            }
            if(val === undefined || val === null || val === "") continue;
            try{
                element.setAttributeNS(null, attr, val);
            }catch(e){
                console.log(e);
            }
        }
    }

    /**
     * Parses a CircleDescription into an SVG Circle
     * @param {CircleDescription} component - The Circle Description
     * @returns {Element}- The SVG Circle Component
     */
    parseCirle(component){
        let attributes = {...component.attributes};
        attributes.cx = component.cx;
        attributes.cy = component.cy;
        attributes.r = component.r;
        let svg = document.createElementNS(XMLNS, "circle");
        this.setComponentAttributes(svg, attributes);
        return svg;
    }

    /**
     * Parses an EllipseDescription into an SVG Ellipse
     * @param {EllipseDescription} component - The Ellipse Description
     * @returns {Element}- The SVG Ellipse Component
     */
    parseEllipse(component){
        let attributes = {...component.attributes};
        attributes.cx = component.cx;
        attributes.cy = component.cy;
        attributes.rx = component.rx;
        attributes.ry = component.ry;
        
        let svg = document.createElementNS(XMLNS,"ellipse");
        this.setComponentAttributes(svg, component);
        return svg;
    }

    /**
     * Parses a LineDescription into an SVG Line
     * @param {LineDescription} component - The Line Description
     * @returns {Element}- The SVG Line Component
     */
    parseLine(component){
        let attributes = {...component.attributes};
        attributes.x1 = component.x1;
        attributes.y1 = component.y1;
        attributes.x2 = component.x2;
        attributes.y2 = component.y2;
        let svg = document.createElementNS(XMLNS, "line");
        this.setComponentAttributes(svg, component);
        return svg;
    }

    /**
     * Parses a RectangleDescription into an SVG Rectangle
     * @param {RectangleDescription} component - The Rectangle Description
     * @returns {Element}- The SVG Rectangle Component
     */
    parseRectangle(component){
        let attributes = {...component.attributes};
        attributes.x = component.x;
        attributes.y = component.y;
        attributes.width = component.width;
        attributes.height = component.height;
        attributes.rx = component.rx;
        attributes.ry = component.ry;
        let svg = document.createElementNS(XMLNS, "rect");
        this.setComponentAttributes(svg, component);
        return svg;
    }

    /**
     * Parses a PolygonDescription into an SVG Polygon
     * @param {PolygonDescription} component - The Polygon Description
     * @returns {Element}- The SVG Polygon Component 
     */
    parsePolygon(component){
        let attributes = {...component.attributes};
        attributes.points = "";
        for(let [x,y] of component.points){
            attributes.points += `${evaluateEquation(x, this.equations)},${evaluateEquation(y, this.equations)} `;
        }
        let svg = document.createElementNS(XMLNS, "polygon");
        this.setComponentAttributes(svg, component);
        return svg;
    }

    /**
     * Parses a PolylineDescription into an SVG Polyline
     * @param {PolylineDescription} component - The Polyline Description
     * @returns {Element}- The SVG Polyline Component
     */
    parsePolyline(component){
        let attributes = {...component.attributes};
        attributes.points = "";
        for(let [x,y] of component.points){
            attributes.points += `${evaluateEquation(x, this.equations)},${evaluateEquation(y, this.equations)} `;
        }
        let svg = document.createElementNS(XMLNS, "polyline");
        this.setComponentAttributes(svg, component);
        return svg;
    }

    /**
     * Parses a PathDescription into an SVG Path
     * @param {PathDescription} component - The Path Description
     * @returns {Element}- The SVG Path Component
     */
    parsePath(component){

        /**
         * @param {CloseSegment|MoveSegment|LineSegment|HorizontalSegment|VerticalSegment} param0
         * @returns {string}- The path segment string
         */
        function parseDefault({type, x, y}){
            if(type == "close") return "Z";
            if(type == "move"){
                return `M${x} ${y}`;
            }else if(type == "line"){
                return `L${x} ${y}`;
            }else if(type == "horizontal"){
                return `H${x}`;
            }else if(type == "vertical"){
                return `V${y}`;
            }
            throw new Error(`Unkown type: ${type}`);
        }

        /**
         * @param {CubicSegment|ShortCubicSegment} param0 
         * @returns {string}- The path segment string
         */
        function parseCubic({type, x1, y1, x2, y2, x, y}){
            if(type == "cubic"){
                return `C${x1} ${y1},${x2} ${y2},${x} ${y}`;
            }else if (type == "shortcubic"){
                return `S${x2} ${y2},${x} ${y}`
            }
            throw new Error(`Unkown type: ${type}`);
        }
        /**
         * @param {QuadraticSegment|ShortQuadraticSegment} param0
         * @returns {string}- The path segment string
         */
        function parseQuadratic({type, x1, y1, x, y}){
            if(type == "quadratic"){
                return `Q${x1} ${y1},${x} ${y}`;
            }else if (type == "shortquadratic"){
                return `T${x} ${y}`
            }
            throw new Error(`Unkown type: ${type}`);
            
        }
        /**
         * @param {ArcSegment} param0 
         * @returns {string}- The path segment string
         */
        function parseArc({type, x, y, rx, ry, xRotation, largeArcFlag, sweepFlag}){
            if(type == "arc"){
                return `A${rx} ${ry},${xRotation},${largeArcFlag},${sweepFlag}, ${x} ${y}`;
            }
            throw new Error(`Unkown type: ${type}`);
        }

        let attributes = {...component.attributes};
        attributes.d = "";
        for(let segment of component.path){
            /** @type {function} */
            let callback;
            switch(segment.type){
                case "move":
                case "line":
                case "horizontal":
                case "vertical":
                case "close":
                    callback = parseDefault;
                case "cubic":
                case "shortcubic":
                    callback = parseCubic;
                    break;
                case "quadratic":
                case "shortquadratic":
                    callback = parseQuadratic;
                    break;
                case "arc":
                    callback = parseArc;
                    break;
                default:
                    throw new Error("Unknown path command");
            }
            let pointval = callback(segment);
            if(segment.relative){
                pointval = pointval.toLowerCase();
            }
            d+=pointval;
        }

        let svg = document.createElementNS(XMLNS, "path");
        this.setComponentAttributes(svg, component);
        return svg;
    }
}