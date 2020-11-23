interface Connection {
	node: Node;
	index: Number;
}

interface Node {
	inputs: boolean[];
	outputs: Connection[];
	setInput(i: Number, v: boolean): void;
}

class SourceSwitch implements Node {
	value: boolean;
	inputs: boolean[];
	outputs: Connection[];

	constructor(v: boolean) {
		this.value = v;
		this.inputs = [];
		this.outputs =; []
	}


	toggle() {
		this.value = !this.value;
		this.update();

		this.outputs.forEach(o => {
			o.node.setInput(o.index, this.value);
		})
	}

	setInput(i: Number, v: boolean) {}
};

class NotGate implements Node {
	constructor(outputs: Node[]) {
		this.inputs = [];
		this.outputs = outputs;
	}

	setInput(i: Number, v: boolean) {
		if this.inputs[i] != v {
			this.inputs[i] = v;
			this.outputs.forEach(o => {
				o.node.setInput(o.index, !v);
			});
		}
	}
}

class AndGate implements Node {
	constructor(outputs: Node[]) {
		this.inputs = [false, false];
		this.outputs = outputs;
	}

	setInput(i: Number, v: boolean) {
		if this.inputs[i] != v {
			this.inputs[i] = v;
			this.outputs.forEach(o => {
				o.node.setInput(o.index, this.inputs[0] && this.inputs[1]);
			});
		}
	}
}

class LEDOutput implements Node {
	constructor() {
		this.inputs = [false];
	}

	setInput(i: Number, v: boolean) {
		console.log(v);
	}
}

class Bundle implements Node {
	inputConns: Connection[];

	constructor() {
		this.inputs = [false];
	}

	setInput(i: Number, v: boolean) {
		if this.inputs[i] != v {
			this.inputs[i] = v;
			this.inputConns[i].node.setInput(
			this.outputs.forEach(o => {
				o.node.setInput(o.index, v);
			});
		}
	}
}

const a = new SourceSwitch(true);
const n = new Not();

