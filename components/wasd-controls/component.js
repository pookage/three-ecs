import { Vector3, MathUtils } from "three"
import Component from "./../../component.js";

export default class WASDControls extends Component {
	// CONFIG
	// ------------------------------------
	static get schema(){
		return {
			// movement speed in m/s
			speed: {
				type: "number",
				default: 1
			},
			// movement speed in deg/s
			rotationSpeed: {
				type: "number",
				default: 30
			}
		}
	}// schema


	// STATE
	// ------------------------------------
	// the current direction of travel of the attached entity
	#translationAxis = new Vector3();
	#rollDirection   = 0;
	#translationStep = 0; 
	#rotationStep    = 0;

	// how much the sprint affects the speed
	#sprintMultiplier = 1;

	// which inputs are currently being interpreted
	#inputs = new Proxy({
		// modifiers
		sprint:    false,

		// movement
		forwards:  false,
		backwards: false,
		left:      false,
		right:     false,

		// rotation
		rollLeft:  false,
		rollRight: false
	}, {
		// intercept changes to the #inputs object and convert them to an updated #direction
		set: (object, property, value) => {
			// honour the most recently-pressed input when calculating changes in #direction
			switch(property){
				// modifiers
				case "sprint": {
					if(value) this.#sprintMultiplier = 3;
					else      this.#sprintMultiplier = 1;
					break;
				}

				// movement
				case "forwards": {
					if(value)                 this.#translationAxis.z = -1;
					else if(object.backwards) this.#translationAxis.z = +1;
					else                      this.#translationAxis.z = 0;
					break;
				}
				case "backwards": {
					if(value)                this.#translationAxis.z = +1;
					else if(object.forwards) this.#translationAxis.z = -1;
					else                     this.#translationAxis.z = 0;
					break;
				}
				case "left": {
					if(value)             this.#translationAxis.x = -1;
					else if(object.right) this.#translationAxis.x = +1;
					else                  this.#translationAxis.x =  0;
					break;
				}
				case "right": {
					if(value)            this.#translationAxis.x = +1;
					else if(object.left) this.#translationAxis.x = -1;
					else                 this.#translationAxis.x =  0;
					break;
				}

				// rotation
				case "rollLeft": {
					if(value)                 this.#rollDirection = +1;
					else if(object.rollRight) this.#rollDirection = -1;
					else                      this.#rollDirection =  0;
					break;
				}
				case "rollRight": {
					if(value)                 this.#rollDirection = -1;
					else if (object.rollLeft) this.#rollDirection = +1;
					else                      this.#rollDirection =  0;
					break;
				}
			}

			// apply the change to the object
			return Reflect.set(object, property, value);
		}
	});


	// LIFECYCLE JAZZ
	// ------------------------------------
	connected(entity)   {
		super.connected(entity)
		this.#addListeners();    
	}// connected
	disconnected(entity){
		super.disconnected(entity);
		this.#removeListeners(); 
	}// disconnected

	tick(time, deltaTime){
		this.#translationStep = (this.data.speed / 1000) * this.#sprintMultiplier * deltaTime;
		this.#rotationStep    = (MathUtils.degToRad(this.data.rotationSpeed) / 1000) * this.#sprintMultiplier * deltaTime;

		this.entity.translateOnAxis(this.#translationAxis, this.#translationStep);
		this.entity.rotateZ(this.#rollDirection * this.#rotationStep);
	}// tick


	// UTILS
	// -----------------------------------
	#addListeners = () => {
		window.addEventListener("keydown", this.#handleKeyDown);
		window.addEventListener("keyup",   this.#handleKeyUp);
	}// #addListeners
	#removeListeners = () => {
		window.addEventListener("keydown", this.#handleKeyDown);
		window.addEventListener("keyup",   this.#handleKeyUp);
	}// #removeListeners


	// EVENT HANDLERS
	// -----------------------------------
	#handleKeyDown = (event) => {
		switch(event.code){
			case "ShiftLeft" :
			case "ShiftRight": { this.#inputs.sprint    = true; break; }
			case "KeyW":       { this.#inputs.forwards  = true; break; }
			case "KeyA":       { this.#inputs.left      = true; break; }
			case "KeyS":       { this.#inputs.backwards = true; break; }
			case "KeyD":       { this.#inputs.right     = true; break; }
			case "KeyQ":       { this.#inputs.rollLeft  = true; break; }
			case "KeyE":       { this.#inputs.rollRight = true; break; }
		}
	}// #handleKeyDown
	#handleKeyUp = (event) => {
		switch(event.code){
			case "ShiftLeft" :
			case "ShiftRight": { this.#inputs.sprint    = false; break; }
			case "KeyW":       { this.#inputs.forwards  = false; break; }
			case "KeyA":       { this.#inputs.left      = false; break; }
			case "KeyS":       { this.#inputs.backwards = false; break; }
			case "KeyD":       { this.#inputs.right     = false; break; }
			case "KeyQ":       { this.#inputs.rollLeft  = false; break; }
			case "KeyE":       { this.#inputs.rollRight = false; break; }
		}
	}// #handleKeyUp
}// WASDControls
