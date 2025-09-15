export class Vector {
	constructor(public x: number, public y: number) {}
	static from(rad: number, mag = 1) { return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) } }
	static copy(one: Vector) { return { x: one.x, y: one.y } }
	static add(one: Vector, two: Vector) { return { x: one.x + two.x, y: one.y + two.y } }
	static sub(one: Vector, two: Vector) { return { x: one.x - two.x, y: one.y - two.y } }
	static addScalar(one: Vector, scalar: number) { return { x: one.x + scalar, y: one.y + scalar } }
	static subScalar(one: Vector, scalar: number) { return { x: one.x - scalar, y: one.y - scalar } }
	static mult(one: Vector, scalar: number) { return { x: one.x * scalar, y: one.y * scalar } }
	static div(one: Vector, scalar: number) { return { x: one.x / scalar, y: one.y / scalar } }
	static mag(one: Vector) { return Math.hypot(one.x, one.y) }
	static normalize(one: Vector) { return this.div(one, this.mag(one)) }
	static dot(one: Vector, two: Vector) { return one.x * two.x + one.y * two.y }
	static project(one: Vector, two: Vector) {
		const dot = this.dot(one, two);
		const magSqr = this.mag(two) ** 2;
		return {
			x: dot / magSqr * two.x,
			y: dot / magSqr * two.y,
		}
	}
}

export class PhysicsObject {
	public isDead = false;
	public netForces: Vector = { x: 0, y: 0 };
	public netTorque = 0;
	
	public prevPosition: Vector;
	public prevRotation: number

	constructor(
		public position: Vector,
		public velocity: Vector,
		public rotation: number,
		public angularVelocity: number,
		public radius: number,
		public mass: number,
	) {
		this.prevPosition = Vector.sub(position, velocity);
		this.prevRotation = rotation - angularVelocity;
	}
}

interface ColliderInfo {
	x: number;
	y: number;

	w: number;
	h: number;
	hw: number;
	hh: number;
	
	center: Vector;
};

interface Collider {
	getInfo(): ColliderInfo
}
class HTMLCollider implements Collider {
	constructor(public element: HTMLElement) {}

	getInfo(): ColliderInfo {
		const ElemRect = this.element.getBoundingClientRect();
		return {
			x: ElemRect.x,
			y: ElemRect.y,

			w: ElemRect.width,
			h: ElemRect.height,
			hw: ElemRect.width / 2,
			hh: ElemRect.height / 2,

			get center() {
				return {
					x: ElemRect.x + ElemRect.width / 2,
					y: ElemRect.y + ElemRect.height / 2,
				}
			},
		}
	}
}
class RectCollider implements Collider {
	constructor(
		private rect: () => {
			x: number;
			y: number;
			w: number;
			h: number;
		}
	) {}

	getInfo(): ColliderInfo {
		const { x, y, w, h } = this.rect()

		return {
			x,
			y,

			w: w,
			h: h,
			hw: w / 2,
			hh: h / 2,

			center: {
				x: x + w / 2,
				y: y + h / 2,
			},
		}
	}
}

interface CollisionData {
	object: PhysicsObject;
	collider: Collider;
	colliderInfo: ColliderInfo;
	closest: Vector;
	distVec: Vector;
	distMag: number;
}

export class Physics {
	public objects: PhysicsObject[] = []
	public colliders: Collider[];
	public t = 0;
	private dt = 0.01;
	private dtSqr = this.dt * this.dt;
	private currentTime = performance.now();
	private accumulator = 0;
	
	private gravity = { x: 0, y: 10 };
	private dragCoefficient = .01;
	private restitutionCoefficient = .7;
	private rollingCoefficient = .01;

	// Stops jittering, set somewhere between 0.002 and 0.0001
	private minSpeed = 0.0005;
	private minSpin = 0.00001;

	constructor(colliderElems: HTMLElement[]) {
		this.colliders = colliderElems.map(elem => new HTMLCollider(elem));
		this.colliders.push(
			// The four screen edges
			new RectCollider(() => ({ x: -20, y: -20, w: innerWidth + 40, h: 20 })),
			new RectCollider(() => ({ x: -20, y: innerHeight, w: innerWidth + 40, h: 20 })),
			new RectCollider(() => ({ x: -20, y: -20, w: 20, h: innerHeight + 40 })),
			new RectCollider(() => ({ x: innerWidth, y: -20, w: 20, h: innerHeight + 40 })),
		);
	}

	public spawn(x: number, y: number): PhysicsObject {
		const minRadius = 20;
		const maxRadius = 40;
		const radius = Math.random() * (maxRadius - minRadius) + minRadius;
		const mass = Math.PI * radius * radius;

		const velLength = Math.random() + .1;
		const velAngle = Math.random() * -Math.PI;
		const velocity = {
			x: velLength * Math.cos(velAngle),
			y: velLength * Math.sin(velAngle),
		}

		const rotation = Math.random() * 2 * Math.PI - Math.PI;
		const maxAngularVelocity = .05;
		const angularVelocity = Math.random() * maxAngularVelocity * 2 - maxAngularVelocity;

		const position = { x, y };
		const obj = new PhysicsObject(
			position,
			velocity,
			rotation,
			angularVelocity,
			radius,
			mass,
		);

		// DEBUG EDITS
		obj.radius = 30;
		obj.angularVelocity = .005;
		
		obj.velocity = new Vector(0, .1);
		// const center = new Vector(innerWidth / 2, innerHeight / 2)
		// obj.velocity = Vector.mult(Vector.normalize(Vector.sub(obj.position, center)), .1);
		
		obj.prevRotation = rotation - obj.angularVelocity;
		obj.prevPosition = Vector.sub(position, obj.velocity);

		this.objects.push(obj);

		return obj;
	}

	public applyForce(obj: PhysicsObject, force: Vector): void {
    obj.netForces = Vector.add(obj.netForces, Vector.div(force, obj.mass));
	}
	private solvePosition(obj: PhysicsObject) {
		const prevPos = Vector.copy(obj.position);
		const speed = Vector.mag(obj.velocity);

		// pos_next = (2)(pos) - p_prev + (forces)(dt)(dt)
		obj.position = Vector.add(Vector.sub(Vector.mult(obj.position, 2), obj.prevPosition), Vector.mult(obj.netForces, this.dtSqr));
		
		if(speed < this.minSpeed) {
			obj.prevPosition = obj.position;
		}
		
		obj.prevPosition = prevPos;
		obj.netForces = { x: 0, y: 0 };

		this.debug_logIfNaN(obj, () => {
			console.log(
				obj.netForces,
				this.dtSqr,
				Vector.mult(obj.netForces, this.dtSqr)
			);

			obj.isDead = true;
		})
	}
	private solveRotation(obj: PhysicsObject) {
		const prevRot = obj.rotation;

		// rot_next = (2)(rot) - rot_prev + (torque)(dt)(dt)
		obj.rotation = 2 * obj.rotation - obj.prevRotation + obj.netTorque * this.dtSqr;

		if(Math.abs(obj.angularVelocity) < this.minSpin) {
			obj.prevRotation = obj.rotation;
		}
	
		obj.prevRotation = prevRot;
		obj.netTorque = 0;
	}
	private updateVelocities(obj: PhysicsObject) {
		obj.velocity = Vector.div(Vector.sub(obj.position, obj.prevPosition), this.dt);
		obj.angularVelocity = (obj.rotation - obj.prevRotation) / this.dt;
		// obj.velocity = Vector.sub(obj.position, obj.prevPosition);
		// obj.angularVelocity = obj.rotation - obj.prevRotation;
	}
	private applyGravity(obj: PhysicsObject): void {
		const force = Vector.mult(this.gravity, obj.mass);
		this.applyForce(obj, force);
	}
	private applyDrag(obj: PhysicsObject) {
		if(Math.abs(obj.velocity.x) < .01 && Math.abs(obj.velocity.y) < .01) return;

		const speed = Vector.mag(obj.velocity);
		const dir = Vector.div(obj.velocity, speed);
		const surface = obj.radius * 2;

		// force = dir * -1 * speed^2 * surface * dragCoeffiencnt
		const scalarPart = -speed * speed * surface * this.dragCoefficient;
		const force = Vector.mult(dir, scalarPart);
		this.applyForce(obj, force);
	}

	private computeVelocityChange(speed: number, obj: PhysicsObject) {
		const rollingImpulse = -obj.mass / 3 * (speed + obj.angularVelocity * obj.radius);
		const resistingImpulse = -this.rollingCoefficient * obj.radius * Math.sign(obj.angularVelocity);
		const finalImpulse = rollingImpulse + resistingImpulse;

		return {
			linear: speed + rollingImpulse / obj.mass,
			angular: obj.angularVelocity + finalImpulse * 2 / (obj.mass * obj.radius),
		}
	}

	private findCollisions(obj: PhysicsObject): CollisionData[] {
		const hits: CollisionData[] = [];
		for(const collider of this.colliders) {
			const info =  collider.getInfo();
			const diff = Vector.sub(obj.position, info.center);
			const closest = {
				x: Math.max(Math.min(diff.x, info.hw), -info.hw),
				y: Math.max(Math.min(diff.y, info.hh), -info.hh),
			}

			const distVec = Vector.sub(diff, closest);
			const distMag = Vector.mag(distVec);
			if(distMag < obj.radius) hits.push({
				object: obj,
				collider,
				colliderInfo: info,
				closest,
				distVec,
				distMag,
			});
		}
		return hits;
	}
	private solveCollision(collisionData: CollisionData): void {
		const { object, distVec, distMag } = collisionData;

		// Push out of collider
		const penetrationDepth = object.radius - distMag;
		const penetrationVector = Vector.mult(distVec, penetrationDepth / distMag);
		object.position = Vector.add(object.position, penetrationVector);

		// Update velocities
		const normalVec = Vector.from(Math.atan2(distVec.y, distVec.x));
		const tangentVec = { x: -normalVec.y, y: normalVec.x };

		const startVel = object.velocity;
		let normalVel = Vector.project(startVel, normalVec);
		normalVel = Vector.mult(normalVel, -this.restitutionCoefficient);
		
		let tangentVel = Vector.project(startVel, tangentVec);
		const velocityChange = this.computeVelocityChange(Vector.mag(tangentVel), object);
		tangentVel = Vector.addScalar(tangentVel, velocityChange.linear);

		// console.log(Vector.mag(startVel));
		// console.log(Vector.mag(normalVel));
		// console.log(Vector.mag(tangentVel));

		const finalLinearVel = Vector.mult(Vector.add(normalVel,tangentVel), this.dt);
		const finalAngularVel = object.angularVelocity - velocityChange.angular * this.dt;
		object.prevPosition = Vector.sub(object.position, finalLinearVel);
		object.prevRotation = object.rotation - finalAngularVel;
		// console.table({
		// 	collider: collisionData.collider,
		// 	...Vector.sub(object.position, object.prevPosition)
		// })

		
		// const incomingAngle = Math.atan2(object.velocity.y, object.velocity.x);
		// const reflectedAngle = normalAngle + normalAngle - incomingAngle;

		// const speed = Vector.mag(object.velocity);
		// const speedAlongTangent = speed * Math.sin(normalAngle - reflectedAngle);
		// const balancedVel = this.getSpeedsAfterCollision(speedAlongTangent, object);
		// const relAxisAngleX = reflectedAngle - normalAngle;
		// const trueSpinVelocity = Vector.fromAngle(relAxisAngleX, balancedVel.linear);
		// const reflectedVelocity = Vector.fromAngle(reflectedAngle, speed);
		// const finalVelocity = Vector.add(reflectedVelocity, trueSpinVelocity);
		

		// object.prevPosition = Vector.add(object.position, Vector.mult(finalVelocity, this.dt));
		// object.prevRotation = object.rotation - balancedVel.angular * this.dt;
	}

	private updateObjects() {
		for(const obj of this.objects) {
			if(obj.isDead) continue;
			
			this.applyGravity(obj);
			this.applyDrag(obj);

			this.solvePosition(obj);
			this.solveRotation(obj);

			const hitColliders = this.findCollisions(obj);
			for(const collisionData of hitColliders) {
				this.solveCollision(collisionData);
			}

			this.updateVelocities(obj);
		}
	}

	private removeDead(): void {
		let i = 0;
		let cnt = this.objects.length;
		let curr: PhysicsObject;
		let tmp: PhysicsObject;
		while(i < cnt) {
			curr = this.objects[i];
			if(!curr.isDead) ++i;
			else {
				tmp = this.objects[cnt - 1];
				this.objects[cnt - 1] = curr;
				this.objects[i] = tmp;
				this.objects.length = --cnt;
			}
		}
	}
	
	public update(newTime: number): number {
		let frameTime = newTime - this.currentTime;
		if(frameTime > .25) frameTime = .25; // Why?
		this.currentTime = newTime;

		this.accumulator += frameTime;

		this.removeDead();
		while(this.accumulator >= this.dt) {
			this.updateObjects();
			this.t += this.dt;
			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	public debug_containsInvalid(obj: PhysicsObject): boolean {
		return /null|undefined/.test(JSON.stringify(obj));
	}
	public debug_logIfNaN(
		obj: PhysicsObject,
		cb?: (obj: PhysicsObject) => void,
	) {
		if(!this.debug_containsInvalid(obj)) return;
		cb?.(obj);
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt = 1) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.updateObjects();
		}
	}
}