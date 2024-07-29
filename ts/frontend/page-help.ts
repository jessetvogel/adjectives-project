import { create } from './util.js';
import navigation from './navigation.js';
import { katexTypeset } from './katex-typeset.js';

export function pageHelp(): HTMLElement {
    const page = create('div', { class: 'page page-help' });

    page.append(...[
        create('span', { class: 'title' }, 'Help'),
        create('p', {}, ['The explore page can be used to search for examples of schemes and morphisms admitting (or not admitting) certain properties. Furthermore, it can be used to find additional properties that apply to your scheme or morphism, using the available theorems. For all the availible examples and theorems, see the ', navigation.anchorPage('data', 'data'), '.']),

        create('span', { class: 'title' }, 'Example (non-separated schemes)'),
        create('p', {}, ['Suppose we want to find examples of non-', navigation.anchorAdjective('scheme', 'separated'), ' schemes.']),
        create('ol', {}, [
            create('li', {}, 'Go the the explore page, and make sure \'<b>scheme</b>\' is selected in the drop-down menu.'),
            create('li', {}, 'Click twice on \'<b>separated</b>\' to indicate that the scheme should not be separated.'),
            create('li', {}, 'Click the <button>Search</button> button.'),
            create('li', {}, ['You will now see a list of schemes which are not separated (for instance ', navigation.anchorExample('scheme', 'AA-1-QQ-double-origin'), ').']),
        ]),
        create('p', {}, 'Now suppose we are also interested in what additional properties non-separated schemes have.'),
        create('ol', { start: 5 }, [
            create('li', {}, 'Click the <button>Deduce</button> button.'),
            create('li', {}, ['You will now see a list of conclusions that apply to a non-separated scheme, together with the theorem from which that conclusion follows. For instance, the scheme is also not ', navigation.anchorAdjective('scheme', 'affine'), ' because ', navigation.anchorTheorem('scheme', 'qaf-of-af'), ' and ', navigation.anchorTheorem('scheme', 'sp-of-qaf'), '.'])
        ])
    ]);

    katexTypeset(page);

    return page;
}

// <ol style="line-height: 24px;">
//     <li>Type a name for your scheme, e.g. $X$, and click <button>+ scheme</button>.</li>
//     <li>A list of scheme properties appears. You can click these properties to indicate that your scheme $X$ should (or should not) have one or more of these properties. In this case, click twice on '<b>separated</b>' to indicate that your scheme should not be separated.</li>
//     <li>Click <button>Search</button> and wait.</li>
//     <li>Now you will see an example of a scheme $X$ which is not separated, e.g. [ex:AA_1_QQ_double_origin].</li>
// </ol>
// suppose we are also interested in what other properties a non-separated scheme $X$ has.
// <ol style="line-height: 24px;" start="5">
//     <li>Make sure $X$ is selected, click <button>Deduce</button> and wait.</li>
//     <li>Now you will see a table of scheme properties, indicating whether $X$ has (or does not have) certain other properties, together with a proof. For example, $X$ is also not [prop:scheme.affine] by [thm:sp_of_af].</li>
// </ol>

// <h2>Example 2 (is reduced an fppf-local property?)</h2>
// suppose we want to know if being reduced is an fppf-local property. That is, if $f : X \to Y$ is an [prop:morphism.fppf_cover] and $Y$ is [prop:scheme.reduced], does it follow that $X$ is reduced as well?
// <ol style="line-height: 24px;">
//     <li>Create a morphism $f : X \to Y$ using <button>+ morphism</button>.</li>
//     <li>Click on the properties '<b>fppf-cover</b>' for $f$, and '<b>reduced</b>' for $Y$ to indicate that $f$ and $Y$ should have these properties.</li>
//     <li>Now select $X$ and click on <button>Deduce</button> to see if it follows that $X$ is also reduced.</li>
//     <li>Looking through the conclusions, you will not find that $X$ must be reduced. Hence, instead, we will try to find a counterexample, that is, an example where $X$ is not reduced.</li>
//     <li>Selecting $X$, click twice on '<b>reduced</b>' to indicate that $X$ should not be reduced.</li>
//     <li>Click <button>Search</button> and wait.</li>
//     <li>We find (at least one) example of an fppf-cover with reduced target but non-reduced source, e.g. [ex:fat_point_to_Spec_QQ]. This shows that being reduced is not an fppf-local property.</li>
// </ol>