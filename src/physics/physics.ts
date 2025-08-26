export interface Vector {
	x: number,
	y: number,
};
export class Vector {
	private constructor() {}
	static copy(one: Vector) { return { x: one.x, y: one.y } }
	static add(one: Vector, two: Vector) { return { x: one.x + two.x, y: one.y + two.y } }
	static sub(one: Vector, two: Vector) { return { x: one.x - two.x, y: one.y - two.y } }
	static addScalar(one: Vector, scalar: number) { return { x: one.x + scalar, y: one.y + scalar } }
	static subScalar(one: Vector, scalar: number) { return { x: one.x - scalar, y: one.y - scalar } }
	static mult(one: Vector, scalar: number) { return { x: one.x * scalar, y: one.y * scalar } }
	static div(one: Vector, scalar: number) { return { x: one.x / scalar, y: one.y / scalar } }
}

export class PhysicsObject {
	public isDead = false;
	constructor(
		public pos: Vector,
		public prevPos: Vector,
		public netForces: Vector,
		public rot: number, // in radians
		public angularVel: number, // in radians
		public radius: number,
		public mass: number,
	) {}
}

export class Physics {
	public objects: PhysicsObject[] = []
	private dt = 0.01;
	private dtSqr = this.dt * this.dt;
	private currentTime = performance.now();
	private accumulator = 0;
	
	private gravity = { x: 0, y: 10 };
	private dragCoefficient = 10;
	private restitutionCoefficient = .7;
	// private frictionCoefficient = .8;

	public spawn(x: number, y: number): PhysicsObject {
		// const minRadius = 10;
		// const maxRadius = 30;
		// const radius = Math.random() * (maxRadius - minRadius) + minRadius;
		const radius = 30;
		const mass = Math.PI * radius * radius;
		// const mass = 1;

		// const initVelLength = Math.random() + .1;
		// const initVelAngle = Math.random() * -Math.PI;
		const initVelocity = {
			// x: initVelLength * Math.cos(initVelAngle),
			// y: initVelLength * Math.sin(initVelAngle),
			x: 0,
			y: 0,
		}

		// const rotation = Math.random() * 2 * Math.PI - Math.PI;
		const rotation = 0;
		// const maxAngularVelocity = .05;
		// const angularVelocity = Math.random() * maxAngularVelocity * 2 - maxAngularVelocity;
		const angularVelocity = 0.5;

		const position = { x, y };
		const obj = new PhysicsObject(
			position,
			Vector.add(position, initVelocity),
			{ x: 0, y: 0 },
			rotation,
			angularVelocity,
			radius,
			mass,
		);

		this.objects.push(obj);

		return obj;
	}
	public applyForce(obj: PhysicsObject, force: Vector): void {
    obj.netForces = Vector.add(obj.netForces, Vector.div(force, obj.mass));
	}
	private updateObject(obj: PhysicsObject) {
		const prevPos = Vector.copy(obj.pos);

		// p_t = 2 * p_{t-1} - p_{t-2} + a_t * dt^2
		obj.pos = Vector.add(Vector.sub(Vector.mult(obj.pos, 2), obj.prevPos), Vector.mult(obj.netForces, this.dtSqr));
		obj.prevPos = prevPos;
		obj.netForces = { x: 0, y: 0 };

		obj.rot += obj.angularVel;
	}
	private applyGravity(obj: PhysicsObject): void {
		const force = Vector.mult(this.gravity, obj.mass);
		this.applyForce(obj, force);
	}
	private applyDrag(obj: PhysicsObject) {
		const vel = Vector.sub(obj.pos, obj.prevPos);
		if(Math.abs(vel.x) < .01 && Math.abs(vel.y) < .01) return;

		const speed = Math.hypot(vel.x, vel.y);
		const dir = Vector.div(vel, speed);
		const surface = obj.radius * 2;

		// force = dir * -1 * speed^2 * surface * dragCoeffiencnt
		const scalarPart = -speed * speed * surface * this.dragCoefficient;
		const force = Vector.mult(dir, scalarPart);
		this.applyForce(obj, force);
		
	}

	private constrainToView(obj: PhysicsObject): void {
		const velocity = Vector.sub(obj.pos, obj.prevPos);
		const newVelocities = this.velocitiesAfterCollision(obj);

		const rightSide = obj.pos.x + obj.radius > innerWidth;
		const leftSide = obj.pos.x - obj.radius < 0;
		const bottomSide = obj.pos.y + obj.radius > innerHeight;
		const topSide = obj.pos.y - obj.radius < 0;

		if(rightSide) {
			obj.pos.x = innerWidth - obj.radius;
		}
		else if(leftSide) {
			obj.pos.x = obj.radius;
		}
		
		if(bottomSide) {
			obj.pos.y = innerHeight - obj.radius;
		}
		else if(topSide) {
			obj.pos.y = obj.radius;
		}

		// if(leftSide || rightSide) {
		// 	obj.prevPos.x = obj.pos.x + velocity.x * this.restitutionCoefficient;
		// }
		// else if (topSide || bottomSide) {
		// 	obj.prevPos.y = obj.pos.y + velocity.y * this.restitutionCoefficient;

		// 	const contactVel = velocity.x + obj.radius * obj.angularVel;

		// 	// velocity at contact + linear velocity = 0
		// }


		if(leftSide || rightSide) {
			obj.isDead = true;

			obj.prevPos.x = obj.pos.x + velocity.x * this.restitutionCoefficient;
			obj.prevPos.y = obj.pos.y + newVelocities.linear.y;
			obj.angularVel = newVelocities.angular.y;
		}
		else if (topSide || bottomSide) {
			// console.log("collided! before", velocity.x, obj.angularVel);
			
			obj.prevPos.y = obj.pos.y + velocity.y * this.restitutionCoefficient;
			obj.prevPos.x = obj.pos.x + newVelocities.linear.x;
			obj.angularVel = newVelocities.angular.x;

			// console.log("collided! after", velX, angularVel * obj.radius, velX + angularVel * obj.radius);
		}

		
		// if(leftSide || rightSide) {
		// 	const halfCircumference = Math.PI * obj.radius;
		// 	const decayedVelocity = velocity.y * this.frictionCoefficient;
		// 	const speedByHalfBodyLength = decayedVelocity / halfCircumference;

		// 	obj.prevPos.x = obj.pos.x + velocity.x * this.restitutionCoefficient;
		// 	obj.prevPos.y = obj.pos.y + decayedVelocity;
		// 	obj.angularVel = speedByHalfBodyLength * Math.PI;
		// }
		// else if (topSide || bottomSide) {
		// 	const halfCircumference = Math.PI * obj.radius;
		// 	const decayedVelocity = velocity.x * this.frictionCoefficient;
		// 	const speedByHalfBodyLength = decayedVelocity / halfCircumference;

		// 	obj.prevPos.y = obj.pos.y + velocity.y * this.restitutionCoefficient;
		// 	obj.prevPos.x = obj.pos.x - decayedVelocity;
		// 	obj.angularVel = speedByHalfBodyLength * Math.PI;
		// }
	}
	private velocitiesAfterCollision(obj: PhysicsObject) {
		const velocity = Vector.sub(obj.pos, obj.prevPos);
		const impulse = {
			x: -obj.mass / 3 * (velocity.x + obj.angularVel * obj.radius),
			y: -obj.mass / 3 * (velocity.y + obj.angularVel * obj.radius),
		}

		return {
			linear: {
				x: velocity.x + impulse.x / obj.mass,
				y: velocity.y + impulse.y / obj.mass,
			},
			angular: {
				x: obj.angularVel + 2 * impulse.x / obj.mass / obj.radius,
				y: obj.angularVel + 2 * impulse.y / obj.mass / obj.radius,
			}
		}
	}

	private updateObjects() {
		for(const obj of this.objects) {
			this.applyGravity(obj);
			this.applyDrag(obj);
			this.updateObject(obj);
			this.constrainToView(obj);
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
			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt = 1) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.updateObjects();
		}
	}
}