import { Book, Context } from './core.js'
import { Assistant } from './assistant.js'

function main() {
    const book = new Book();

    book.addMultiple([["Spec_QQ", { "type": "scheme", "name": "$\\Spec \\QQ$", "description": "Spectrum of the rational numbers", "adjectives": { "affine": true, "integral": [true, "The ring $\\QQ$ is a domain"] } }], ["Spec_ZZ", { "type": "scheme", "name": "$\\Spec \\ZZ$", "description": "Spectrum of the integers $\\ZZ$", "adjectives": { "affine": true, "integral": [true, "The ring $\\ZZ$ is a domain"] } }], ["scheme", { "type": "type", "name": "scheme" }], ["morphism", { "type": "type", "name": "morphism", "parameters": { "source": "scheme", "target": "scheme" } }], ["Spec_QQ_to_Spec_ZZ", { "type": "morphism", "arguments": { "source": "Spec_QQ", "target": "Spec_ZZ" }, "adjectives": { "affine": true, "flat": true } }], ["qc_of_af", { "type": "theorem", "name": "affine schemes are quasi-compact", "given": "scheme X", "if": ["X affine"], "then": "X quasi-compact" }], ["affine", { "type": "morphism adjective", "name": "affine", "description": "A morphism of schemes is affine if [...]." }], ["flat", { "type": "morphism adjective", "name": "flat", "description": "A morphism of schemes is flat if [...]." }], ["closed-immersion", { "type": "morphism adjective", "name": "closed immersion", "description": "A morphism of schemes is a closed immersion if [...]." }], ["affine", { "type": "scheme adjective", "name": "affine", "description": "A scheme is affine if it is isomorphic to $\\Spec R$ for some commutative ring $R$." }], ["integral", { "type": "scheme adjective", "name": "integral", "description": "A scheme is integral if [...]" }], ["quasi-compact", { "type": "scheme adjective", "name": "quasi-compact", "description": "A scheme is quasi-compact if its underlying topological space is quasi-compact." }]]);

    book.verify();

    const assistant = new Assistant(book);
    // const query: Context = { scheme: { X: { id: 'X', type: 'scheme', name: 'X', args: {}, adjectives: {} } } };
    const query: Context = {
        scheme: {
            X: { id: 'X', type: 'scheme', name: 'X', args: {}, adjectives: {} },
            Y: { id: 'Y', type: 'scheme', name: 'Y', args: {}, adjectives: {} }
        },
        morphism: {
            f: { id: 'f', type: 'morphism', name: 'f', args: { source: 'X', target: 'Y' }, adjectives: { 'flat': true } }
        }
    };

    // console.log(JSON.stringify(assistant.search(query)));

    assistant.deduce(book.examples);

    // console.log(JSON.stringify(book.examples, null, 2))
    console.dir(book.examples, { depth: null });
}

main();
