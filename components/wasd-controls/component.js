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
			}
		}
	}// schema


	// STATE
	// ------------------------------------
	// the current direction of travel of the attached entity
	#direction = {
		x: 0,
		z: 0
	};

	// how much the sprint affects the speed
	#sprintMultiplier = 1;

	// which inputs are currently being interpreted
	#inputs = new Proxy({
		forwards:  false,
		backwards: false,
		left:      false,
		right:     false,
		sprint:    false
	}, {
		// intercept changes to the #inputs object and convert them to an updated #direction
		set: (object, property, value) => {
			// honour the most recently-pressed input when calculating changes in #direction
			switch(property){
				case "forwards": {
					if(value)                 this.#direction.z = -1;
					else if(object.backwards) this.#direction.z = +1;
					else                      this.#direction.z = 0;
					break;
				}
				case "backwards": {
					if(value)                this.#direction.z = +1;
					else if(object.forwards) this.#direction.z = -1;
					else                     this.#direction.z = 0;
					break;
				}
				case "left": {
					if(value)             this.#direction.x = -1;
					else if(object.right) this.#direction.x = +1;
					else                  this.#direction.x =  0;
					break;
				}
				case "right": {
					if(value)            this.#direction.x = +1;
					else if(object.left) this.#direction.x = -1;
					else                 this.#direction.x =  0;
					break;
				}
				case "sprint": {
					if(value) this.#sprintMultiplier = 3;
					else      this.#sprintMultiplier = 1;
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
		const step = (this.data.speed / 1000) * deltaTime;

		this.entity.position.x += (step * this.#direction.x * this.#sprintMultiplier);
		this.entity.position.z += (step * this.#direction.z * this.#sprintMultiplier);
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
		}
	}// #handleKeyUp
}// WASDControls
