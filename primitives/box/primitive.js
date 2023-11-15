import Primitive from "./../../primitive.js";

export default class Box extends Primitive {
	static get defaultComponents(){
		return {
			geometry: {
				primitive: "box",
				height: 1,
				width:  1,
				depth:  1
			},
			material: {
				color: "red",
				type: "standard"
			}
			mesh: {}
		}
	}// defaultComponents

	static get mappings(){
		return {
			color: "material.color",
			width: "geometry.width",
			height: "geometry.height",
			depth: "geometry.depth"
		}
	}// mappings
}// Box
