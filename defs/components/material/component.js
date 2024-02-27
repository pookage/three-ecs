import { MeshBasicMaterial, ShaderMaterial, Color } from "three";

import Component from "../../core/component/index.js";


export default class Material extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#material;


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get schema(){
		return {
			type: {
				oneOf: [
					"basic",
					"custom"
				]
			},
			color: {
				type: "color",
				default: new Color(0xff0000)
			},
			shader: {
				type: "shader",
				requires: {
					type: "custom"
				}
			}
		}
	}// get schema

	// PUBLIC PROPERTIES
	get material(){ return this.#material }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	constructor(config){
		super(config);

		this.#material = this.#generateMaterial(this.data);
	}// constructor
	update(property, previous, current){
		if(previous !== current){
			switch(property){
				case "type": 
				case "shader": {
					this.#material = this.#generateMaterial(this.data);
					break;
				}
				case "color": {
					this.#updateMaterial(this.#material, property, current);
					break;
				}
			}
		}

		super.update(property, previous, current);
	}// update
	tick(time, deltaTime){
		super.tick(time, deltaTime);

		// pass-in common values used by all custom shaders
		if(this.#material instanceof ShaderMaterial){
			this.#material.uniforms.time.value = time / 1000;
		}
	}// tick


	// UTILS
	// -------------------------------
	#generateMaterial = data => {
		const {
			color,
			type,
			shader: CustomShader
		} = data;

		let material;
		switch(type){
			case "basic": {
				material = new MeshBasicMaterial({ color })
				break;
			}
			case "custom": {
				if(CustomShader){
					material = new ShaderMaterial({
						uniforms:       CustomShader.constructor.uniforms,
						vertexShader:   CustomShader.constructor.vertex,
						fragmentShader: CustomShader.constructor.fragment
					});	
				} else {
					console.error("this should error before now")
				}
				break;
			}
			default: {
				console.error("[ERROR](Material) Cannot create material of unknown type:", type)
			}
		}

		return material;
	}// #generateMaterial

	#updateMaterial = (material, property, value) => {
		switch(property){
			case "color": {
				material[property] = value;	
			}
		}
	}// #updateMaterial
}// Material
