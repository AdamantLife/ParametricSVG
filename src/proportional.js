/**
 * Represents a Value that is a Proportion of another Value.
 * 
 */
class ProportionalValue{

    /**
     * Parses a string into a ProportionalValue.
     * Accepted formats are:
     *  "x/y"- where x is the value and y is the proportion
     * 
     * 
     * @param {String} input - The string to parse
     * @returns {ProportionalValue}
     */
    static parseString(input){
        if(typeof input != 'string'){ throw new Error(`Invalid ProportionalValue: ${input}- Not a string`); }
        let [value, proportion] = input.split('/');
        if(!proportion){
            value = parseFloat(value);
            if(isNaN(value)){ throw new Error(`Invalid ProportionalValue: ${input}- Not a number`); }
            return new ProportionalValue(value, 100);
        }
        value = parseFloat(value);
        proportion = parseFloat(proportion);
        if(isNaN(value) || isNaN(proportion)){ throw new Error(`Invalid ProportionalValue: ${input}- Value or Proportion is not a number`); }
        return new ProportionalValue(value, proportion);
    }

    /**
     * Creates a new ProportionalValue
     * @param {Number} value - The value
     * @param {Number} proportion - The proportion
     */
    constructor(value, proportion){
        this.value = value;
        this.proportion = proportion;
    }

    evaluate(){
        return this.value / this.proportion;
    }
    /**
     * Returns the greatest common factor of this and other
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {Number} - The greatest common factor
     */
    gcf(other){
        let [a,b] = [this.proportion, other.proportion];
        if (a == b) return a;
        while (b != 0){
            let temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
    /**
     * Returns the least common proportion (multiple) of this and other
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {Number} - The least common multiple
     */
    lcm(other){
        let [a,b] = [this.proportion, other.proportion];
        if(a == b) return a;
        let gcf = this.gcf(other);
        return a*b/gcf;
    }
    /**
     * Adds the other ProportionalValue and returns a new one
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {ProportionalValue}- The new ProportionalValue
     */
    add(other){
        let lcm = this.lcm(other);
        return new ProportionalValue(this.value*(lcm/this.proportion) + other.value*(lcm/other.proportion), lcm);
    }

    /**
     * Subtracts the other ProportionalValue and returns a new one
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {ProportionalValue}- The new ProportionalValue
     */
    sub(other){
        let lcm = this.lcm(other);
        return new ProportionalValue(this.value*(lcm/this.proportion) - other.value*(lcm/other.proportion), lcm);
    }

    /**
     * Multiplies the other ProportionalValue and returns a new one
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {ProportionalValue}- The new ProportionalValue
     */
    mul(other){
        let lcm = this.lcm(other);
        return new ProportionalValue(this.value*(lcm/this.proportion) * other.value*(lcm/other.proportion), lcm);
    }

    /**
     * Divides the other ProportionalValue and returns a new one
     * @param {ProportionalValue} other - The other ProportionalValue
     * @returns {ProportionalValue}- The new ProportionalValue
     */
    div(other){
        let lcm = this.lcm(other);
        return new ProportionalValue(this.value*(lcm/this.proportion) / other.value*(lcm/other.proportion), lcm);
    }
}

