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
	public netForces: Vector = { x: 0, y: 0 };
	public netTorque = 0;
	constructor(
		public pos: Vector,
		public prevPos: Vector,

		// In radians
		public rot: number,
		public prevRot: number,
		
		public radius: number,
		public mass: number,
	) {}
}

export class Physics {
	public objects: PhysicsObject[] = []
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
	private minLinearVelocity = 0.0005;
	private minAngularVelocity = 0.00001;

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
			Vector.sub(position, velocity),
			rotation,
			rotation - angularVelocity,
			radius,
			mass,
		);

		// DEBUG EDITS
		// obj.prevPos = position;

		this.objects.push(obj);

		return obj;
	}

	private getLinearVel(obj: PhysicsObject) {
		// TODO: figure out how to multiply by dt without having the simulation explode
		return Vector.sub(obj.pos, obj.prevPos);
	}
	private getAngularVel(obj: PhysicsObject) {
		return obj.rot - obj.prevRot;
	}

	public applyForce(obj: PhysicsObject, force: Vector): void {
    obj.netForces = Vector.add(obj.netForces, Vector.div(force, obj.mass));
	}
	private updateObject(obj: PhysicsObject) {
		const prevPos = Vector.copy(obj.pos);
		const prevRot = obj.rot;
		const linearVel = this.getLinearVel(obj);
		const angularVel = this.getAngularVel(obj);
		const speed = Math.hypot(linearVel.x, linearVel.y);

		if(speed > this.minLinearVelocity) {
			// p_t = 2 * p_{t-1} - p_{t-2} + a_t * dt^2
			obj.pos = Vector.add(Vector.sub(Vector.mult(obj.pos, 2), obj.prevPos), Vector.mult(obj.netForces, this.dtSqr));
		}
		
		if(Math.abs(angularVel) > this.minAngularVelocity) {
			obj.rot = 2 * obj.rot - obj.prevRot + obj.netTorque * this.dtSqr;
		}
		
		obj.prevPos = prevPos;
		obj.prevRot = prevRot;
		obj.netForces = { x: 0, y: 0 };
	}
	private applyGravity(obj: PhysicsObject): void {
		const force = Vector.mult(this.gravity, obj.mass);
		this.applyForce(obj, force);
	}
	private applyDrag(obj: PhysicsObject) {
		const vel = this.getLinearVel(obj);
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
		const velocity = this.getLinearVel(obj);
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

		if(leftSide || rightSide) {
			obj.prevPos.x = obj.pos.x + velocity.x * this.restitutionCoefficient;
			obj.prevPos.y = obj.pos.y - newVelocities.linear.y;
			obj.prevRot = obj.rot - newVelocities.angular.y;
		}
		else if (topSide || bottomSide) {
			obj.prevPos.y = obj.pos.y + velocity.y * this.restitutionCoefficient;
			obj.prevPos.x = obj.pos.x - newVelocities.linear.x;
			obj.prevRot = obj.rot - newVelocities.angular.x;
		}
	}
	private velocitiesAfterCollision(obj: PhysicsObject) {
		const linearVel = this.getLinearVel(obj);
		const angularVel = this.getAngularVel(obj);

		const rollingImpulse = {
			x: -obj.mass / 3 * (linearVel.x + angularVel * obj.radius),
			y: -obj.mass / 3 * (linearVel.y + angularVel * obj.radius),
		}

		const resistingImpulse = -this.rollingCoefficient * obj.radius * Math.sign(angularVel);
		const finalImpulse = Vector.addScalar(rollingImpulse, resistingImpulse);
		return {
			linear: Vector.add(linearVel, Vector.div(rollingImpulse, obj.mass)),
			angular: Vector.addScalar(Vector.mult(finalImpulse, 2 / obj.mass / obj.radius), angularVel),
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
			this.t += this.dt;
			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	public debug_log_oddities(obj: PhysicsObject, kill = true) {
		if(JSON.stringify(obj).includes("null")) {
			console.table(obj);
			obj.isDead = kill;
		}		
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt = 1) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.updateObjects();
		}
	}
}