"use strict";

/**
 * An array of JSON descriptions used by ParametricSVG
 * to generate SVG elements
 * @typedef {Object} JsonDescription
 * @property {Variables} equations - Equations available to evaluate the values of component attributes
 * @property {SVGDescription[]} svgcomponents - The components of the SVG
 * @property {Object<string, string>} attributes - The attributes of the SVG
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
 * @property {PathSegment[]} d- The segments of the path
 */

/**
 * Used to create an SVG from a JSON description using the parseJSON function
 * @namespace ParametricSVG
 * @type {ParametricSVG}
 */
export var ParametricSVG = {

    /** The namespace of the SVG; can be modified if needed */
    XMLNS : "http://www.w3.org/2000/svg",

    /** Attributes of the XML File Declaration, used as a header in an SVG file.
     * Additional attributes can be added as needed
     */
    XMLDECLARATION: {
        version : "1.0",
        encoding : "UTF-8"
    },
    /** The XML File Declaration as a fully formatted string
     * @returns {string}
    */
    formatDeclaration: function(){
        out = [];
        for(let [key, value] of Object.entries(this.XMLDECLARATION)){
            out.push(`${key}="${value}"`);
        }
        out = out.join(" ");
        return `<?xml ${out}?>`;
    },    

    /** @callback evaluator - A default function to use when evaluating equations with parseJSON or updateSVG */
    evaluator : null,

    /** DEVNOTE - parse[Element] functions are nested in parseJSON for two reasons:
     *      1) in order to avoid passing the obj argument (or its equations, specifically)
     *      2) because it doesn't seem necessary to expose them
     * 
     *      If a good reason to expose them is found, then it should be trivial to
     *      refactor them into other entries in the ParametricSVG namespace and add
     *      the equations argument to each.
     */

    /**
     * Parses the provided JSON and returns an SVG Element
     * @memberof ParametricSVG
     * @param {JsonDescription} description - The JSON to parse
     * @param {function} [evaluator] - The function to evaluate equations defined by the JSON
     * @returns {Element} - The parsed SVG Element
     */
    parseJSON : function(description, evaluator){
        if (!evaluator){
            if(!ParametricSVG.evaluator){
                throw new Error("No evaluator defined");
            }
            evaluator = ParametricSVG.evaluator;
        }
        let svg = document.createElementNS(ParametricSVG.XMLNS, "svg");
        setComponentAttributes(svg, description.attributes);


        for (let obj of description.svgcomponents){
            let element = null;
            if(obj.type === "circle"){
                element = parseCirle(obj);
            }else if(obj.type === "line"){
                element = parseLine(obj);
            }else if(obj.type === "ellipse"){
                element = parseEllipse(obj);
            }else if(obj.type === "rect"){
                element = parseRectangle(obj);
            }else if(obj.type === "polygon"){
                element = parsePolygon(obj);
            }else if(obj.type === "polyline"){
                element = parsePolyline(obj);
            }else if(obj.type === "path"){
                element = parsePath(obj);
            }else{
                throw new Error(`Invalid type ${obj.type}`);
            }

            svg.appendChild(element);
        }

        /**
         * Updates the provided attributes via updateObjectEquation and sets the attributes of an SVG Element.
         * @param {Element} element - The Element to set the attributes on
         * @param {Object<string, string>} attributes - The attributes to update and set
         */
        function setComponentAttributes(element, attributes){
            for(let [attr, val] of Object.entries(attributes)){
                if(val){
                    try{
                        val = evaluator(val, description.equations);
                    }catch(e){
                        // console.error(e);
                    }
                }
                if(val === undefined || val === null || val === "") continue;
                try{
                    element.setAttributeNS(null, attr, val);
                }catch(e){
                    console.error(e);
                }
            }
        }

        /**
         * Converts undefined values to empty strings.
         * This function was setup because it should only be applied to
         * values pulled by the parser, not values set in the JSON
         * and therefore should not be handled in setComponentAttributes.
         */
        function setUndefined(val){
            return val === undefined ? "" : val;
        }

        /**
         * Parses a CircleDescription into an SVG Circle
         * @param {CircleDescription} component - The Circle Description
         * @returns {Element}- The SVG Circle Component
         */
        function parseCirle(component){
            let attributes = {...component.attributes};
            attributes.cx = setUndefined(component.cx);
            attributes.cy = setUndefined(component.cy);
            attributes.r = setUndefined(component.r);
            let out = document.createElementNS(ParametricSVG.XMLNS, "circle");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses an EllipseDescription into an SVG Ellipse
         * @param {EllipseDescription} component - The Ellipse Description
         * @returns {Element}- The SVG Ellipse Component
         */
        function parseEllipse(component){
            let attributes = {...component.attributes};
            attributes.cx = setUndefined(component.cx);
            attributes.cy = setUndefined(component.cy);
            attributes.rx = setUndefined(component.rx);
            attributes.ry = setUndefined(component.ry);
            
            let out = document.createElementNS(ParametricSVG.XMLNS,"ellipse");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses a LineDescription into an SVG Line
         * @param {LineDescription} component - The Line Description
         * @returns {Element}- The SVG Line Component
         */
        function parseLine(component){
            let attributes = {...component.attributes};
            attributes.x1 = setUndefined(component.x1);
            attributes.y1 = setUndefined(component.y1);
            attributes.x2 = setUndefined(component.x2);
            attributes.y2 = setUndefined(component.y2);
            let out = document.createElementNS(ParametricSVG.XMLNS, "line");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses a RectangleDescription into an SVG Rectangle
         * @param {RectangleDescription} component - The Rectangle Description
         * @returns {Element}- The SVG Rectangle Component
         */
        function parseRectangle(component){
            let attributes = {...component.attributes};
            attributes.x = setUndefined(component.x);
            attributes.y = setUndefined(component.y);
            attributes.width = setUndefined(component.width);
            attributes.height = setUndefined(component.height);
            attributes.rx = setUndefined(component.rx);
            attributes.ry = setUndefined(component.ry);
            let out = document.createElementNS(ParametricSVG.XMLNS, "rect");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses a PolygonDescription into an SVG Polygon
         * @param {PolygonDescription} component - The Polygon Description
         * @returns {Element}- The SVG Polygon Component 
         */
        function parsePolygon(component){
            let attributes = {...component.attributes};
            attributes.points = "";
            for(let [x,y] of component.points||[]){
                attributes.points += `${evaluator(x, description.equations)},${evaluator(y, description.equations)} `;
            }
            let out = document.createElementNS(ParametricSVG.XMLNS, "polygon");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses a PolylineDescription into an SVG Polyline
         * @param {PolylineDescription} component - The Polyline Description
         * @returns {Element}- The SVG Polyline Component
         */
        function parsePolyline(component){
            let attributes = {...component.attributes};
            attributes.points = "";
            for(let [x,y] of component.points||[]){
                attributes.points += `${evaluator(x, description.equations)},${evaluator(y, description.equations)} `;
            }
            let out = document.createElementNS(ParametricSVG.XMLNS, "polyline");
            setComponentAttributes(out, attributes);
            return out;
        }

        /**
         * Parses a PathDescription into an SVG Path
         * @param {PathDescription} component - The Path Description
         * @returns {Element}- The SVG Path Component
         */
        function parsePath(component){

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
            function parseCubic({type, x1=0, y1=0, x2=0, y2=0, x=0, y=0}){
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
            function parseQuadratic({type, x1=0, y1=0, x=0, y=0}){
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
                    return `A${rx} ${ry},${xRotation},${largeArcFlag? 1 : 0},${sweepFlag? 1 : 0}, ${x} ${y}`;
                }
                throw new Error(`Unkown type: ${type}`);
            }

            let attributes = {...component.attributes};
            // path can be used as an alias for d
            if(component.d === undefined && component.path !== undefined){
                component.d = component.path;
            }else if(component.d !== undefined && component.path !== undefined){
                throw new Error("Cannot specify both d and path");
            }
            attributes.d = "";
            for(let segment of component.d||[]){
                /** @type {function} */
                let callback;
                switch(segment.type.toLowerCase()){
                    case "m":
                    case "move":
                    case "l":
                    case "line":
                    case "h":
                    case "horizontal":
                    case "v":
                    case "vertical":
                    case "z":
                    case "close":
                        callback = parseDefault;
                        break;
                    case "c":
                    case "cubic":
                    case "s":
                    case "shortcubic":
                        callback = parseCubic;
                        break;
                    case "q":
                    case "quadratic":
                    case "t":
                    case "shortquadratic":
                        callback = parseQuadratic;
                        break;
                    case "a":
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
                attributes.d+=pointval;
            }

            let out = document.createElementNS(ParametricSVG.XMLNS, "path");
            setComponentAttributes(out, attributes);
            return out;
        }

        return svg;
    },

    
    /**
     * A convenience function which replaces the given SVG Element with the
     * parsed result of the JSON description provided.
     * @param {JsonDescription} description - The Json Description to parse
     * @param {SVGElement} svg - The SVG Element to replace
     * @param {function} [evaluator] - The evaluator function to use for equations
     */
    updateSVG : function(description, svg, evaluator){
        let parsed = ParametricSVG.parse(description, evaluator);
        svg.replaceWith(parsed);
    }
}