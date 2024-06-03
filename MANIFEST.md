# These are the kinds of .yaml files that consitute the database

# type = scheme | morphism | scheme property | morphism property | scheme theorem | morphism theorem

```yaml
--- # Example scheme file
type: scheme
name: Spectrum of the integers
description: Take the spectrum of the integers $\ZZ$
adjectives:
  affine: true # if there is no comment, then just true or false is sufficient
  integral: [true, The ring $\ZZ$ is a domain.]
```

```yaml
--- # Example morphism file
type: morphism
source: E0001 # Spec Q
target: E0002 # Spec Z
name: Morphism $\ZZ \to \QQ$
description: The unique morphism $\Spec \QQ \to \Spec \ZZ$
adjectives:
  affine: true
  # etc ...
```

```yaml
--- # Example property file `quasi_compact.yaml`
type: scheme adjective
name: quasi-compact
description: A scheme is quasi-compact if the underlying topological space is quasi-compact.
```

```yaml
--- # Example theorem file `T0001.yaml`
type: scheme theorem
name: Affine schemes are quasi-compact
statement: X affine => X quasi_compact
description: A scheme is quasi-compact if the underlying topological space is quasi-compact.
```

```yaml
--- # Example theorem file `src_qc_of_qc_trg_qc.yaml`
type: morphism theorem
name: Affine morphisms are quasi-compact
statement: Y quasi_compact & f quasi_compact => X quasi_compact # always think of $f : X \to Y$
proof: See reference [...] on page [...].
```



# Architecture

All user-data is stored in .yaml files for readability, and ease of manually changing
All processed data is stored in .json files for ease of use together with JavaScript
Then the browser does not need to parse .yaml, only .json, but that it can do very well
Also the distinction between user-data and processed data is very clear

The assistant has the following functionality:
✅ - Given a set of adjectives with truth values, find the matching examples `Assistant.search(Context)`
✅ - Given a context (a set of examples which might refer to each other), and a list of theorems (bundled in a book), deduce adjectives for the examples
  - Also give 'proofs' for the statements: i.e. a (short as possible) list of theorems which to apply in order to arrive at the result
- Given a context, try to deduce a contradiction

# TODO
- Go from snake_case to camelCase