# Adjectives Project

The Adjectives Project is a website that collects interesting examples and theorems of schemes and morphisms in algebraic geometry. The aim of this project is to gain a better understanding of the many adjectives regarding schemes and morphisms, and the relation between them.

The website can be used to find examples of schemes and morphisms with certain adjectives. It also uses the theorems to automatically make deductions about the properties of the schemes and morphisms.

The website can be visited at [jessetvogel.nl/adjectives-project](https://jessetvogel.nl/adjectives-project).

## Setup and usage

To run the Adjectives Project locally, use the following steps. Make sure that both [Git](https://git-scm.com) and [Node.js](https://nodejs.org) are installed on your machine.

**1.** Clone the repository.
```
git clone https://github.com/jessetvogel/adjectives-project.git
```

**2.** Navigate into the project directory and update the data submodule.
```
cd adjectives-project
git submodule update --init
```

**3.** Install Node dependencies.
```
npm install
```

**4.** Update the JSON files by running the following commands. For more details, see the 'Commands' section.
```
npm run clear-json
npm run update-json-from-yaml
npm run deduce
```

**5.** Serve the `public` folder via an HTTP server. For instance, using Python, run the following command and visit the website via `https://127.0.0.1:8080`.
```
python3 -m http.server -d public 8080
```

## Commands
To clear all JSON data, run the following command.
```
npm run clear-json
```
To update the JSON data from the YAML data, run the following command.
```
npm run update-json-from-yaml
```
To deduce new properties for the examples, run the following command.
```
npm run deduce
```
