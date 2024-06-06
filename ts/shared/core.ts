export type Type = {
    id: string, // morphism
    name: string, // morphism
    parameters: { [key: string]: string }, // { source: scheme, target: scheme }
};

export type Adjective = {
    id: string,   // closed-immersion 
    type: string, // morphism
    name: string, // closed immersion
};

type TheoremConditions = { [path: string]: { [id: string]: boolean } };
type TheoremConclusion = { path: string, adjective: string, value: boolean };

export type Theorem = {
    id: string,   // qc_of_af
    name: string, // affine schemes are quasi-compact
    type: string, // scheme
    subject: string, // X
    conditions: TheoremConditions, // { '': { adjectives: { affine: true } } }
    conclusion: TheoremConclusion  // { path: '', adjective: 'quasi-compact', value: true }
};

export type Proof = {
    type: string,    // type of subject to which the theorem is applied
    theorem: string, // id of theorem which is applied
    subject: string, // id of subject to which it is applied
};

export type Example = { // TODO: rename to Object or so ?
    id: string,   // Spec_ZZ_to_Spec_QQ
    type: string, // morphism
    name: string, // Spec ZZ to Spec QQ
    args: { [key: string]: string }, // { source: Spec QQ, target: Spec ZZ }
    adjectives: { [id: string]: boolean },
    proofs: { [id: string]: string | Proof } // { integral: "The ring $\ZZ$ is a domain." }
};

export type Context = { [type: string]: { [id: string]: Example } };

export type BookContents = {
    types: { [id: string]: any },
    adjectives: { [type: string]: { [id: string]: any } },
    theorems: { [type: string]: { [id: string]: any } },
    examples: { [type: string]: { [id: string]: any } },
};

export class Book {
    types: { [id: string]: Type };
    adjectives: { [type: string]: { [id: string]: Adjective } };
    theorems: { [type: string]: { [id: string]: Theorem } };
    examples: Context;

    descriptions: {
        types: { [id: string]: string },
        adjectives: { [type: string]: { [id: string]: string } },
        theorems: { [type: string]: { [id: string]: string } },
        examples: { [type: string]: { [id: string]: string } }
    };

    constructor(contents: BookContents | null = null) {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
        this.descriptions = { types: {}, adjectives: {}, theorems: {}, examples: {} };

        if (contents != null)
            this.initialize(contents);
    }

    initialize(contents: BookContents) {
        for (const id in contents.types)
            this.add(id, contents.types[id]);
        for (const type in contents.adjectives)
            for (const id in contents.adjectives[type])
                this.add(id, contents.adjectives[type][id]);
        for (const type in contents.theorems)
            for (const id in contents.theorems[type])
                this.add(id, contents.theorems[type][id]);
        for (const type in contents.examples)
            for (const id in contents.examples[type])
                this.add(id, contents.examples[type][id]);
    }

    deserializeType(id: string, data: any): Type {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const parameters = ('parameters' in data) ? data.parameters : {}; // fallback to empty set of parameters if none are given

        // TODO: check if parameter keys are [\w\-]+

        return { id, name, parameters };
    }

    serializeType(type: Type, elaborate: boolean = false): any {
        const data: any = {
            type: 'type',
            name: type.name
        }
        if (Object.keys(type.parameters).length > 0)
            data.parameters = type.parameters;
        if (elaborate && type.id in this.descriptions.types)  // add description when elaborate is true
            data.description = this.descriptions.types[type.id];
        return data;
    }

    deserializeTheorem(id: string, data: any): Theorem {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        // const description = ('description' in data) ? data.description.toString() : null;

        // parse subject
        if (!('given' in data) || typeof data.given != 'string')
            throw new Error(`Missing field 'given' in theorem '${id}'`);
        const subjectParts = (data.given as string).split(' ');
        if (subjectParts.length != 2)
            throw new Error(`Invalid field 'given' in theorem '${id}'`);
        const subjectType = subjectParts[0];
        const subjectName = subjectParts[1];
        if (!(subjectType in this.theorems)) this.theorems[subjectType] = {};
        if (id in this.theorems[subjectType])
            throw new Error(`Theorem with id '${id}' for type '${subjectType}' already exists`);

        // parse theorem conditions
        const dataIf = ('if' in data) ? (typeof data.if == 'string' ? [data.if] : data.if) : [];
        if (!Array.isArray(dataIf))
            throw new Error(`Invalid field 'if' in theorem '${id}'`);
        const conditions: TheoremConditions = {};
        for (const condition of dataIf) {
            if (typeof condition != 'string')
                throw new Error(`Invalid condition '${condition}' in theorem '${id}'`);
            const conditionParts = condition.split(' ');
            if (conditionParts.length != 2 && !(conditionParts.length == 3 && conditionParts[1] == 'not'))
                throw new Error(`Invalid condition '${condition}' in theorem '${id}'`);
            const fullPath = conditionParts[0];
            const adjective = (conditionParts.length == 2) ? conditionParts[1] : conditionParts[2];
            const value = (conditionParts.length == 2) ? true : false;
            if (!fullPath.startsWith(subjectName))
                throw new Error(`Invalid path '${fullPath}' (should start with '${subjectName}') in theorem '${id}'`);
            const path = fullPath.substring(subjectName.length);
            if (!(path in conditions)) conditions[path] = {};
            if (adjective in conditions[path])
                throw new Error(`Multiple conditions on adjective '${adjective}' of '${path}' in theorem '${id}'`);
            conditions[path][adjective] = value;
        }

        // parse conclusion
        if (!('then' in data))
            throw new Error(`Missing field 'then' in theorem '${id}'`);
        const then = data.then;
        if (typeof then != 'string')
            throw new Error(`Invalid field 'then' in theorem '${id}'`);
        const thenParts = then.split(' ');
        if (!thenParts[0].startsWith(subjectName))
            throw new Error(`Invalid path '${thenParts[0]}' (should start with '${subjectName}') in theorem '${id}'`);
        thenParts[0] = thenParts[0].substring(subjectName.length);
        const conclusion: TheoremConclusion | null = (thenParts.length == 2)
            ? { path: thenParts[0], adjective: thenParts[1], value: true }
            : ((thenParts.length == 3 && thenParts[1] != 'not') ? { path: thenParts[0], adjective: thenParts[2], value: false } : null);
        if (conclusion == null)
            throw new Error(`Invalid conclusion '${then}' in theorem '${id}'`);

        return { id, name, type: subjectType, subject: subjectName, conditions, conclusion };
    }

    serializeTheorem(theorem: Theorem, elaborate: boolean = false): any {
        function conditionsForPath(path: string) {
            const conditions: string[] = [];
            for (const adj in theorem.conditions[path]) {
                const value = theorem.conditions[path][adj];
                conditions.push(`${theorem.subject}${path}${value ? ' ' : ' not '}${adj}`);
            }
            return conditions;
        }

        const data: any = {
            type: 'theorem',
            name: theorem.name,
            given: theorem.type + ' ' + theorem.subject,
            if: Object.keys(theorem.conditions).map(conditionsForPath).flat(),
            then: `${theorem.subject}${theorem.conclusion.path}${theorem.conclusion.value ? ' ' : ' not'}${theorem.conclusion.adjective}`
        };
        if (elaborate && theorem.type in this.descriptions.theorems && theorem.id in this.descriptions.theorems[theorem.type])  // add description when elaborate is true
            data.description = this.descriptions.theorems[theorem.type][theorem.id];
        return data;
    }

    deserializeAdjective(id: string, data: any): Adjective {
        const typeBase = (data.type as string).replace(/ adjective$/, '');
        if (!(typeBase in this.adjectives)) this.adjectives[typeBase] = {};

        if (id in this.adjectives[typeBase])
            throw new Error(`Adjective with id '${id}' for type '${typeBase}' already exists`);

        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given            
        // const description = ('description' in data) ? data.description.toString() : null;

        return { id, type: typeBase, name };
    }

    serializeAdjective(adjective: Adjective, elaborate: boolean = false): any {
        const data: any = {
            type: `${adjective.type} adjective`,
            name: adjective.name,
        };
        if (elaborate && adjective.type in this.descriptions.adjectives && adjective.id in this.descriptions.adjectives[adjective.type])  // add description when elaborate is true
            data.description = this.descriptions.adjectives[adjective.type][adjective.id];
        return data;
    }

    deserializeExample(id: string, data: any): Example {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const args = ('with' in data) ? data.with : {}; // fallback to empty set of arguments if none are given
        const adjectives = ('adjectives' in data) ? data.adjectives : {}; // fallback to empty set of adjectives if none are given
        const proofs: { [id: string]: string | Proof } = {};
        // const description = ('description' in data) ? data.description.toString() : null;

        // parse adjectives
        // NOTE: adjective values may be 'boolean' (usually) or '[boolean, string]' where the string is the proof. We split them.
        for (const key in adjectives) {
            const value = adjectives[key];
            if (typeof value == 'boolean') { }
            else if (Array.isArray(value) && value.length == 2 && typeof value[0] == 'boolean' && typeof value[1] == 'string') {
                adjectives[key] = value[0];
                proofs[key] = value[1];
            } else
                throw new Error(`Example with id '${id}' for type '${data.type}' has invalid value for adjective '${key}'`);
        }

        // parse proofs
        if ('proofs' in data) {
            for (const key in data.proofs) {
                const proof = data.proofs[key];
                if (typeof proof == 'string') {
                    proofs[key] = proof;
                } else {
                    if (!('type' in proof) || !('theorem' in proof) || !('subject' in proof))
                        throw new Error(`Example with id '${id}' for type '${data.type}' has invalid proof for adjective '${key}'`);
                    proofs[key] = { type: proof.type, theorem: proof.theorem, subject: proof.subject };
                }
            }
        }

        // TODO: check if arguments and adjectives keys are [\w\-]+

        return { id, type: data.type, name, args, adjectives, proofs };
    }

    serializeExample(example: Example, elaborate: boolean = false): any {
        const data: any = {
            type: example.type,
            name: example.name
        }
        if (Object.keys(example.args).length > 0)
            data.with = example.args;
        if (Object.keys(example.adjectives).length > 0)
            data.adjectives = example.adjectives;
        if (elaborate && Object.keys(example.proofs).length > 0)
            data.proofs = example.proofs;

        if (elaborate) { // add description when elaborate is true
            if (example.type in this.descriptions.examples && example.id in this.descriptions.examples[example.type])
                data.description = this.descriptions.examples[example.type][example.id];
        }
        return data;
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

            this.types[id] = this.deserializeType(id, data);

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null)
                this.descriptions.types[id] = description;

            return;
        }

        if (type == 'theorem') { // parse theorems
            const theorem = this.deserializeTheorem(id, data);

            if (!(theorem.type in this.theorems))
                this.theorems[theorem.type] = {};

            if (id in this.theorems[theorem.type])
                throw new Error(`Theorem with id '${id}' for type '${theorem.type}' already exists`);

            this.theorems[theorem.type][id] = theorem;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(theorem.type in this.descriptions.theorems))
                    this.descriptions.theorems[theorem.type] = {};
                this.descriptions.theorems[theorem.type][id] = description;
            }

            return;
        }

        if (type.endsWith(' adjective')) { // parse adjective
            const adjective = this.deserializeAdjective(id, data);

            if (!(adjective.type in this.adjectives))
                this.adjectives[adjective.type] = {};

            if (id in this.adjectives[adjective.type])
                throw new Error(`Adjective with id '${id}' for type '${adjective.type}' already exists`);

            this.adjectives[adjective.type][id] = adjective;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(adjective.type in this.descriptions.adjectives))
                    this.descriptions.adjectives[adjective.type] = {};
                this.descriptions.adjectives[adjective.type][id] = description;
            }

            return;
        }

        { // parse examples
            const example = this.deserializeExample(id, data);

            if (!(type in this.examples)) this.examples[type] = {};

            if (id in this.examples[type])
                throw new Error(`Example with id '${id}' for type '${type}' already exists`);

            this.examples[type][id] = example;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(example.type in this.descriptions.examples))
                    this.descriptions.examples[example.type] = {};
                this.descriptions.examples[example.type][id] = description;
            }

            return;
        }
    }

    verify(): boolean { // checks if all references in the book are correct
        for (const id in this.types) { // verify types
            const type = this.types[id];
            for (const key in type.parameters) {
                const paramType = type.parameters[key];
                if (!(paramType in this.types))
                    throw new Error(`Type '${id}' refers to unknown type '${paramType}'`);
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

        for (const type in this.theorems) { // verify theorems
            for (const id in this.theorems[type]) {
                const theorem = this.theorems[type][id];
                if (theorem.type != type)
                    throw new Error(`Mysterious mismatch for type of theorem '${id}' ('${theorem.type}' != '${type}')`);
                if (!(theorem.type in this.types))
                    throw new Error(`Theorem '${id}' refers to unknown type '${type}'`);
                for (const path in theorem.conditions) { // verify theorem conditions
                    const pathType = this.resolvePathType(theorem.type, path);
                    if (pathType == null)
                        throw new Error(`Theorem '${id}' refers to invalid path '${path}' in its conditions`);
                    for (const key in theorem.conditions[path]) {
                        if (!(key in this.adjectives[pathType]))
                            throw new Error(`Theorem '${id}' refers to unknown adjective '${key}' for '${path}' of type '${pathType}'`);
                    }
                }
                // verify theorem conclusion
                const conclusionPathType = this.resolvePathType(theorem.type, theorem.conclusion.path);
                if (conclusionPathType == null)
                    throw new Error(`Theorem '${id}' refers to invalid path '${theorem.conclusion.path}' in its conclusion`);
                if (!(theorem.conclusion.adjective in this.adjectives[conclusionPathType]))
                    throw new Error(`Theorem '${id}' refers to unknown adjective '${theorem.conclusion.adjective}' for '${theorem.conclusion.path}' of type '${conclusionPathType}'`);
            }

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

    resolvePathType(type: string, path: string): string | null { // e.g. `resolve_path_type('morphism', '.source') = 'scheme'`
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                return null;
            if (i > 0 && !(pathParts[i] in this.types[type].parameters))
                return null;
            if (i > 0)
                type = this.types[type].parameters[pathParts[i]];
        }
        return type;
    }

    resolvePath(context: Context, object: Example, path: string): Example | null {
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                return null;
            if (i > 0 && !(pathParts[i] in this.types[object.type].parameters))
                return null;
            if (i > 0 && !(pathParts[i] in object.args))
                throw new Error(`Mysteriously missing argument '${pathParts[i]}' in '${object.id}' of type '${object.type}'`);
            if (i > 0) {
                const argType = this.types[object.type].parameters[pathParts[i]];
                object = context[argType][object.args[pathParts[i]]];
            }
        }
        return object;
    }

    serialize(elaborate: boolean = false): BookContents {
        const contents: BookContents = {
            types: {},
            adjectives: {},
            theorems: {},
            examples: {}
        };
        for (const id in this.types) { // add types
            contents.types[id] = this.serializeType(this.types[id], elaborate);
        }
        for (const type in this.adjectives) { // add adjectives
            if (!(type in contents.adjectives))
                contents.adjectives[type] = {};
            for (const id in this.adjectives[type])
                contents.adjectives[type][id] = this.serializeAdjective(this.adjectives[type][id], elaborate);
        }
        for (const type in this.theorems) {// add theorems
            if (!(type in contents.theorems))
                contents.theorems[type] = {};
            for (const id in this.theorems[type])
                contents.theorems[type][id] = this.serializeTheorem(this.theorems[type][id], elaborate);
        }
        for (const type in this.examples) { // add examples
            if (!(type in contents.examples))
                contents.examples[type] = {};
            for (const id in this.examples[type])
                contents.examples[type][id] = this.serializeExample(this.examples[type][id], elaborate);
        }
        return contents;
    }
};
