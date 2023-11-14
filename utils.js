import { Color } from "three";

export function generateReactiveShallowState(initialState, callback){
	return new Proxy(initialState, {
		set(object, property, value){
			// save the previous value of the object 
			const previousValue = isObject(object[property])
				? structuredClone(object[property]) // if it's an object then clone it for posterity
				: object[property];                 // if it's not an object then it'll be passed by value anyway, so we can just pass that through
			
			// apply the change to the object
			const success = Reflect.set(object, property, value);

			// fire the callback whenever a property has changed
			if(success) callback(property, previousValue, value); 
			// if it failed for whatever reason - make sure the console knows about it!
			else console.error("[generateReactiveShallowState] Unable to modify property", property, "on", object);

			// proxies require you to return success state, so here ya go!
			return success;
		}
	});
}// generateReactiveShallowState

export function isObject (obj) {
	return typeof obj === 'object' && obj !== null
}// isObject

export function parseProperty(value, type){
	switch(type){
		case "color" : return value.isColor ? value : new Color(value);
		case "number": return typeof value === "number" ? value : parseFloat(value);
		default:       return value;
	}
}// parseProperty
