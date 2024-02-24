import { Color, MathUtils, Vector3, Euler } from "three";


const defaultPosition = { x: 0, y: 0, z: 0 };
const defaultRotation = { x: 0, y: 0, z: 0 };
const defaultScale    = { x: 1, y: 1, z: 1 };

const defaultPositionSchema = { default: defaultPosition };
const defaultRotationSchema = { default: defaultRotation };
const defaultScaleSchema    = { default: defaultScale    };


export const componentRegistry = new Map();

export function findFirstInstanceWithProperty(property){
	let instance = null;

	this.traverse(object3D => {
		if(object3D[property] && !instance){
			instance = object3D;
		}
	});

	return instance;
}// findFirstInstanceWithProperty

export function parseUnverifiedConfig(userConfig, schema){
	return Object.entries(schema).reduce(
		(config, [ property, valueSchema ]) => {
			const {
				default: defaultValue,
				oneOf: permittedValues = []
			} = valueSchema;

			const doesPropertyExistInSchema = userConfig.hasOwnProperty(property);
			const doesPropertyHaveValue     = doesPropertyExistInSchema || typeof defaultValue !== undefined;

			if(doesPropertyHaveValue){
				const type               = getSchemaPropertyType(property, valueSchema);
				const rawValue           = userConfig[property] || defaultValue || permittedValues[0];
				const value              = parseValueWithSchema(rawValue, type, valueSchema);
				const isValueCorrectType = verifyType(value, type);

				if(isValueCorrectType){
					const hasPermittedValues = permittedValues.length > 0;
					const isValuePermitted   = hasPermittedValues && permittedValues.includes(value);

					if(isValuePermitted || !hasPermittedValues ){
						// Woop! This is the only case in which the property is valid and gets added
						config[property] = value;
					} else {
						console.warn(
							`[WARNING](${this.constructor.name}) Property '${property}'`,
							value,
							"is not one of the values",
							permittedValues,
							"permitted by this component - property will be ignored"
						);
					}
				} else {
					console.warn(
						`[WARNING](${this.constructor.name}) Property ${property}`,
						value,
						`does not match the type ${type} defined in the component schema - property will be ignored.`
					);
				}
			} else {
				console.warn(
					`[WARNING](${this.constructor.name}) Unable to derive a value for property ${property} from component schema - property will be ignored.`,
					this
				);
			}
			return config;
		},
		{}
	);
}// parseUnverifiedConfig

export function verifyType(value, type){
	switch(type){
		case "boolean":
		case "number":
		case "string": {
			return typeof value;
		}
		case "color": {
			return value.isColor
		}
	}
}// verifyType

export function generateReactiveShallowState(initialState, callback){
	return new Proxy(initialState, {
		set(obj, key, value){
			// save the previous value of the object 
			const previousValue = isObject(obj[key])
				? window.structuredClone(obj[key]) // if it's an object then clone it for posterity
				: obj[key];                        // if it's not an object then it'll be passed by value anyway, so we can just pass that through
			
			const success = Reflect.set(obj, key, value);

			// fire the callback whenever a property has changed
			if(success) callback(key, previousValue, value);
			// if it failed for whatever reason - make sure the console knows about it!
			else console.error("[generateReactiveShallowState] Unable to modify property", key, "on", obj);
			// proxies require you to return success state, so here ya go!
			return success;
		}// set
	});
}// generateReactiveShallowState

export function isObject (obj) {
	return typeof obj === 'object' && obj !== null
}// isObject

export function toProperCase(text){
	// NOTE: this was adapted from: https://stackoverflow.com/questions/64489395/converting-snake-case-string-to-title-case
	return text.replace (/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
	           .replace (/[-_]+(.)/g, (_, c) => c.toUpperCase()) // First char after each -/_	
}// toProperCase

function getSchemaPropertyType(property, value){
	const { 
		type: valueType, 
		default: defaultValue,
		oneOf = [] 
	} = value;

	let type;

	if(valueType)                       type = valueType;
	else if(defaultValue !== undefined) type = typeof defaultValue;
	else if(oneOf.length > 0)           type = typeof oneOf[0];
	else {
		console.warn(
			`[WARNING](${this.constructor.name}) Unable to derive type of ${property}`, 
			value, 
			"Please confirm that the schema for this component is correct."
		);
	}

	return type;
}// getSchemaPropertyType

function parseValueWithSchema(value, type, schema = {}){
	switch(type){
		case "number": {
			const parsedValue = parseFloat(value);
			const {
				min = parsedValue,
				max = parsedValue
			} = schema;

			return MathUtils.clamp(parsedValue, min, max);
		}
		case "boolean": return (/true/).test(value);
		case "color"  : return new Color(value);
		case "vector3": return new Vector3(
			parseFloat(value.x ?? schema.default.x), 
			parseFloat(value.y ?? schema.default.y), 
			parseFloat(value.z ?? schema.default.z)
		);
		case "euler"  : return new Euler(
			MathUtils.degToRad(parseFloat(value.x ?? schema.default.x)),
			MathUtils.degToRad(parseFloat(value.y ?? schema.default.y)),
			MathUtils.degToRad(parseFloat(value.z ?? schema.default.z))
		);
		default: return new String(value).toString();
	}
}// parseValueWithSchema

function parseStringAsThreeProperty(value, property){
	switch(property){
		case "position": {
			const [ x, y, z ] = value.split(" ");
			return parseValueWithSchema({ x, y, z }, "vector3", defaultPositionSchema);
		}
		case "rotation": {
			const [ x, y, z ] = value.split(" ");
			return parseValueWithSchema({ x, y, z }, "euler", defaultRotationSchema);
		}
		case "scale": {
			const [ x, y, z ] = value.split(" ");
			return parseValueWithSchema({ x, y, z }, "vector3", defaultScaleSchema);
		}
		case "visible": return parseValueWithSchema(value, "boolean");
		case "color":   return parseValueWithSchema(value, "color");
		default:        return value;
	}
}// parseStringAsThreeProperty

function parseObjectAsThreeProperty(value, property){
	switch(property){
		case "position": return parseValueWithSchema(value, "vector3", defaultPositionSchema);
		case "rotation": return parseValueWithSchema(value, "euler",   defaultRotationSchema);
		case "scale":    return parseValueWithSchema(value, "vector3", defaultScaleSchema);
		default:         return value;
	}
}// parseObjectAsThreeProperty

export function parseAsThreeProperty(value, property){
	if(typeof value === "string") return parseStringAsThreeProperty(value, property);
	else if(isObject(value))      return parseObjectAsThreeProperty(value, property);
	else                          return value;
}// parseAsThreeProperty
