import { Vector3 } from "three";

export default class Shader {
	static get uniforms(){ 
		return {
			time: {
				value: 1.0
			}
		}; 
	}
	static get vertex(){ 
		return `
			uniform float time;

			varying vec3 v_Normal;


			void main() {
				float fasterTime = time * 3.0;
				float timeWave   = (sin(fasterTime) + 1.0) / 2.0;
				float scale      = (timeWave / 3.0) + 1.0;

				gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
				v_Normal    = normal;
			}
		`; 
	}
	static get fragment(){ 
		return `
			uniform float time;

			varying vec3 v_Normal;


			void main(){
				gl_FragColor = vec4(
					v_Normal.x, 
					v_Normal.y, 
					v_Normal.z, 
					1.0
				);
			}
		`; 
	}
}// Shader
