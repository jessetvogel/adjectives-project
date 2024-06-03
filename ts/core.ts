export type Type = {
    id: string, // morphism
    name: string, // morphism
    parameters: { [key: string]: string } // { source: scheme, target: scheme }
};

export type Adjective = {
    id: string,   // closed-immersion 
    type: string, // morphism
    name: string, // closed immersion
};

export type Theorem = {
    id: string,              // qc_of_af
    name: string,            // affine schemes are quasi-compact
    context: Context,        // { scheme: { X: { ... } } }
    subject: Example,        // { X }
    conclusion: Proposition  // { object: { X }, adjective: 'quasi-compact', value: true }
};

export type Example = {
    id: string,   // Spec_ZZ_to_Spec_QQ
    type: string, // morphism
    name: string, // Spec ZZ to Spec QQ
    args: { [key: string]: string }, // { source: Spec QQ, target: Spec ZZ }
    adjectives: { [id: string]: boolean }
};

export type Context = { [type: string]: { [id: string]: Example } };

export type Proposition = { object: Example, adjective: Adjective, value: boolean };

export class Book {
    types: { [id: string]: Type };
    adjectives: { [type: string]: { [id: string]: Adjective } };
    theorems: { [id: string]: Theorem };
    examples: Context;

    constructor() {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
    }

    addMultiple(array: [string, any][]) { // add data indexed by id
        for (const item of array)
            this.add(item[0], item[1]);
    }

    add(id: string, data: any): void { // add some data to the book, automatically detects whether it is a `Type`, `Adjective`, `Theorem` or `Example`
        if (!('type' in data) || typeof data.type != 'string')
            throw new Error(`Missing field type for id '${id}'`);

        if (!id.match(/^[\w\-]+$/)) // make sure `id` is alphanumeric possibly with dashses
            throw new Error(`Invalid id '${id}'`);

        const type = data.type as string;

        if (type == 'type') { // parse types
            if (id in this.types)
                throw new Error(`Type with id '${id}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
            const parameters = ('parameters' in data) ? data.parameters : {}; // fallback to empty set of parameters if none are given

            // TODO: check if parameter keys are [\w\-]+

            this.types[id] = { id, name, parameters };
            return;
        }

        if (type == 'theorem') {
            return;
        }

        const parts = type.split(' ');

        if (parts.length == 2 && parts[1] == 'adjective') { // parse adjectives
            const type_base = parts[0];
            if (!(type_base in this.adjectives)) this.adjectives[type_base] = {};

            if (id in this.adjectives[type_base])
                throw new Error(`Adjective with id '${id}' for type '${type_base}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given            

            this.adjectives[type_base][id] = { id, type: type_base, name };
            return;
        }

        if (parts.length == 1) { // parse examples
            if (!(type in this.examples)) this.examples[type] = {};

            if (id in this.examples[type])
                throw new Error(`Example with id '${id}' for type '${type}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
            const args = ('arguments' in data) ? data.arguments : {}; // fallback to empty set of arguments if none are given
            const adjectives = ('adjectives' in data) ? data.adjectives : {}; // fallback to empty set of adjectives if none are given

            // TODO: check if arguments and adjectives keys are [\w\-]+

            this.examples[type][id] = { id, type, name, args, adjectives };
            return;
        }

        throw new Error(`Unknown type ''`);
    }

    verify(): boolean { // checks if all references in the book are correct
        for (const id in this.types) { // verify types
            const type = this.types[id];
            for (const key in type.parameters) {
                const param_type = type.parameters[key];
                if (!(param_type in this.types))
                    throw new Error(`Type '${id}' refers to unknown type '${param_type}'`);
            }
        }

        for (const type in this.adjectives) { // verify adjectives
            for (const id in this.adjectives[type]) {
                const adjective = this.adjectives[type][id];
                if (adjective.type != type)
                    throw new Error(`Mysterious mismatch for type of adjective '${id}' ('${adjective.type}' != '${type}')`);
                if (!(adjective.type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
            }
        }

        for (const id in this.theorems) { // verify theorems
            // TODO
        }

        for (const type in this.examples) { // verify examples
            for (const id in this.examples[type]) {
                const example = this.examples[type][id];
                // verify type
                if (example.type != type)
                    throw new Error(`Mysterious mismatch for type of example '${id}' ('${example.type}' != '${type}')`);
                if (!(type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
                // verify arguments
                const parameters = this.types[type].parameters;
                for (const key in parameters) {
                    if (!(key in example.args))
                        throw new Error(`Missing argument '${key}' for example '${id}' of type '${type}'`);
                    const arg = example.args[key];
                    if (!(arg in this.examples[parameters[key]])) // note: `parameters[key]` is already verified to be a correct type
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown example '${arg}' of type '${parameters[key]}'`);
                }
                // verify adjectives
                for (const adj in example.adjectives) {
                    if (!(adj in this.adjectives[type]))
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown adjective '${adj}'`);
                }
            }
        }

        return true;
    }
};

export function sum(a: number, b: number): number {
    return a + b;
}
