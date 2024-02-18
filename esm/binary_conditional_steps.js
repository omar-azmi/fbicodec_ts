import { array_isEmpty } from "./deps.js";
import { BinaryPureStep } from "./typedefs.js";
export class BinaryMultiStateStep extends BinaryPureStep {
    state;
    states;
    constructor(states, initial_state) {
        super();
        this.state = initial_state;
        this.states = states;
    }
    forward(input) {
        const step = this.states[this.state];
        return step.forward(input);
    }
    backward(input) {
        const step = this.states[this.state];
        return step.backward(input);
    }
}
export class BinaryStackedStateStep extends BinaryPureStep {
    default_state;
    states;
    stack = [];
    constructor(states, default_state) {
        super();
        this.default_state = default_state;
        this.states = states;
    }
    forward(input) {
        const step = this.states[this.pop()];
        return step.forward(input);
    }
    backward(input) {
        const step = this.states[this.pop()];
        return step.backward(input);
    }
    push(...states) {
        this.stack.push(...states);
    }
    pop() {
        const stack = this.stack;
        return array_isEmpty(stack) ? this.default_state : stack.pop();
    }
}
export class BinaryConditionalStep extends BinaryPureStep {
    conditions;
    default_step;
    constructor(conditions, default_step) {
        super();
        this.conditions = conditions;
        this.default_step = default_step;
    }
    forward(input) {
        for (const [forward_condition, , step] of this.conditions) {
            if (forward_condition(input)) {
                return step.forward(input);
            }
        }
        return this.default_step.forward(input);
    }
    backward(input) {
        for (const [, backward_condition, step] of this.conditions) {
            if (backward_condition(input)) {
                return step.backward(input);
            }
        }
        return this.default_step.backward(input);
    }
}
