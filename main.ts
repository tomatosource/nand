interface IBox  {
	setInput(i: number, v: boolean): void;
}

class Connection {
	box: IBox;
	inputIndex: number;

	constructor(box: IBox, inputIndex: number) {
		this.box = box;
		this.inputIndex = inputIndex;
	}
}

class Box implements IBox {
	inputs: boolean[];
	inputConnections: Connection[][];
	outputs: Connection[][];

	constructor(inputCount: number, outputCount: number) {
		this.inputs = Array.apply(null, new Array(inputCount)).map(()=> false);
		this.inputConnections = Array.apply(null, new Array(inputCount)).map(()=> []);
		this.outputs = Array.apply(null, new Array(outputCount)).map(()=> []);
	}

	setInput(i: number, v: boolean): void {
		if (this.inputs[i] != v) {
			this.inputs[i] = v;
			this.inputConnections[i].forEach(c => {
				c.box.setInput(c.inputIndex, v);
			});
		}
	}
}

class Nand implements IBox {
	inputs: boolean[];
	outputs: Connection[][];

	constructor() {
		this.inputs = [false, false];
		this.outputs = [[]];
	}

	setInput(i: number, v: boolean): void {
		if (this.inputs[i] != v) {
			this.inputs[i] = v;
			this.outputs[0].forEach(o => {
				o.box.setInput(o.inputIndex, !(this.inputs[0] && this.inputs[1]));
			});
		}
	}
}

class SourceSwitch implements IBox {
	state: boolean;
	outputs: Connection[];

	constructor() {
		this.state= false;
		this.outputs = [];
	}


	setInput(_: number, v: boolean): void {
		if (this.state != v) {
			this.state = v;
			this.outputs.forEach(o => {
				o.box.setInput(o.inputIndex, v);
			});
		}
	}

	toggle(): void {
		this.setInput(0, !this.state);
	}
}

class Indicator implements IBox {
	state: boolean;

	constructor() {
		this.state= false;
	}

	setInput(_: number, v: boolean): void {
		this.state = v;
		console.log("output: ", v);
	}
}

class Canvas {
	inputs: SourceSwitch[];
	outputs: Indicator[];
	children: IBox[];

	constructor(inputCount: number, outputCount: number) {
		this.inputs = Array.apply(null, new Array(inputCount)).map(()=> new SourceSwitch());
		this.outputs = Array.apply(null, new Array(outputCount)).map(()=> new Indicator());
		this.children = [];
	}

	toggle(i: number) {
		this.inputs[i].toggle();
	}
}

// new 2in/1out canvas
const c = new Canvas(2,1);

// create and add nand to canvas
const n = new Nand();
c.children.push(n);

// wire up canvas switches to nand inputs
c.inputs[0].outputs.push(new Connection(n,0));
c.inputs[1].outputs.push(new Connection(n,1));

// wire up nand output to canvas indicator
n.outputs[0].push(new Connection(c.outputs[0], 0));

// flick some switches
c.toggle(0);
c.toggle(1);
c.toggle(0);
c.toggle(1);
